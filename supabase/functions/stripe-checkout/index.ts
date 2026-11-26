/**
 * stripe-checkout
 * Creates a Stripe embedded-checkout session from a `{ payment, identity }`
 * request body. Optionally rate-limits by user id (or IP for anonymous
 * callers) via Upstash Redis when both env vars are set; rate limiting fails
 * open if Redis is unavailable so payments never silently block.
 *
 * Request body:
 *   payment: {
 *     currency: string,      // must be in SUPPORTED_CURRENCIES below
 *     cart: Array<{ product: { name: string; amount: number }; quantity: number }>,
 *     returnUrl: string,
 *     freq?: "week" | "month" | "year",
 *     title?: string,
 *     cents?: number,        // used when cart is empty
 *     metadata?: Record<string, unknown>,
 *   }
 *   identity: { first: string; last: string; email: string; phone?: string; org?: string }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Redis } from "https://esm.sh/@upstash/redis@1.22.0";
import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@0.4.3";

const stripeClient = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY") ?? "",
  {
    httpClient: Stripe.createFetchHttpClient(),
  },
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiter is optional. If either env var is missing we skip rate limiting
// so new projects can spin up checkout without provisioning Redis first.
const REDIS_URL = Deno.env.get(
  "UPSTASH_REDIS_REST_URL",
);
const REDIS_TOKEN = Deno.env.get(
  "UPSTASH_REDIS_REST_TOKEN",
);
const ratelimit =
  REDIS_URL && REDIS_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: REDIS_URL,
          token: REDIS_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(
          10,
          "60 s",
        ),
        analytics: false,
      })
    : null;

// Currencies this function will charge in, and each one's floor in minor
// units. MUST mirror SUPPORTED_CURRENCIES / CURRENCIES[...].minimumMinorUnits
// in app/data/Currency.tsx (Deno can't import it) —
// app/data/CurrencyEdgeParity.test.ts fails if they drift. Without this list a
// caller could pick any Stripe currency, including zero-decimal ones like JPY
// where "500" means ¥500, not ¥5.
const SUPPORTED_CURRENCIES: Record<
  string,
  number
> = {
  aud: 500,
  nzd: 500,
  gbp: 300,
  usd: 300,
};

const MAX_QUANTITY = 100;
const MAX_LINE_ITEMS = 50;

// Optional: comma-separated origins (e.g. "https://example.org,http://localhost:5173")
// that returnUrl must start with. Unset = any http(s) URL, which lets a caller
// bounce a paying user to a look-alike site after checkout — set it in prod.
const ALLOWED_RETURN_ORIGINS = (
  Deno.env.get("ALLOWED_RETURN_ORIGINS") ?? ""
)
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

/**
 * Reject a returnUrl that isn't http(s), or isn't on the allowlist when one is
 * configured. Compares parsed origins, so "https://example.org.evil.com"
 * can't pass as "https://example.org".
 */
function assertReturnUrl(
  returnUrl: unknown,
): string {
  if (typeof returnUrl !== "string")
    throw new Error("returnUrl is required");
  let url: URL;
  try {
    url = new URL(returnUrl);
  } catch {
    throw new Error(
      "returnUrl is not a valid URL",
    );
  }
  if (
    url.protocol !== "https:" &&
    url.protocol !== "http:"
  ) {
    throw new Error("returnUrl must be http(s)");
  }
  if (
    ALLOWED_RETURN_ORIGINS.length &&
    !ALLOWED_RETURN_ORIGINS.includes(url.origin)
  ) {
    throw new Error(
      "returnUrl origin is not allowed",
    );
  }
  return url.toString();
}

/**
 * A positive amount in minor units, rounded to a whole number (client maths
 * like 10.1 * 100 lands on 1009.9999…), or throw. Rejects NaN, Infinity,
 * zero and negatives — Math.floor(undefined) used to reach Stripe as NaN.
 */
function assertMinorUnits(
  value: unknown,
  label: string,
): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(
      `${label} must be a positive amount in cents`,
    );
  }
  return n;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
        "",
      { auth: { persistSession: false } },
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (ratelimit) {
      const identifier =
        user?.id ??
        req.headers.get("x-forwarded-for") ??
        "anon_ip";
      try {
        const { success } =
          await ratelimit.limit(identifier);
        if (!success) {
          return new Response(
            JSON.stringify({
              error:
                "Too many checkout attempts. Please wait a minute.",
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                "Content-Type":
                  "application/json",
              },
            },
          );
        }
      } catch (err) {
        // Upstash is down — fail open so payments still succeed.
        console.error(
          "RATE LIMITER FAILURE (failing open):",
          err,
        );
      }
    }

    const { payment, identity } =
      await req.json();
    if (!payment || typeof payment !== "object") {
      throw new Error("payment is required");
    }

    const currency = String(
      payment.currency ?? "",
    ).toLowerCase();
    const minimum =
      SUPPORTED_CURRENCIES[currency];
    if (minimum === undefined) {
      throw new Error(
        `Unsupported currency: ${currency || "(none)"}`,
      );
    }
    const returnUrl = assertReturnUrl(
      payment.returnUrl,
    );
    if (
      payment.freq !== undefined &&
      payment.freq !== null &&
      !["week", "month", "year"].includes(
        payment.freq,
      )
    ) {
      throw new Error(
        "Invalid recurring interval",
      );
    }
    if (
      Array.isArray(payment.cart) &&
      payment.cart.length > MAX_LINE_ITEMS
    ) {
      throw new Error("Too many items in cart");
    }

    const customerEmail =
      user?.email || identity?.email;
    if (!customerEmail)
      throw new Error(
        "Email is required for receipt.",
      );

    const line_items =
      Array.isArray(payment.cart) &&
      payment.cart.length
        ? payment.cart.map((cart_item: any) => {
            const quantity = Number(
              cart_item?.quantity ?? 1,
            );
            if (
              !Number.isInteger(quantity) ||
              quantity < 1 ||
              quantity > MAX_QUANTITY
            ) {
              throw new Error(
                `Quantity must be 1–${MAX_QUANTITY}`,
              );
            }
            return {
              price_data: {
                currency,
                product_data: {
                  name: String(
                    cart_item?.product?.name ??
                      "Item",
                  ).slice(0, 250),
                },
                unit_amount: assertMinorUnits(
                  cart_item?.product?.amount,
                  "Item amount",
                ),
              },
              quantity,
            };
          })
        : [
            {
              price_data: {
                currency,
                product_data: {
                  name: String(
                    payment.title ?? "Payment",
                  ).slice(0, 250),
                },
                unit_amount: assertMinorUnits(
                  payment.cents,
                  "Amount",
                ),
              },
              quantity: 1,
            },
          ];

    if (
      payment.freq &&
      line_items[0].price_data
    ) {
      (
        line_items[0].price_data as any
      ).recurring = { interval: payment.freq };
    }

    const total = line_items.reduce(
      (sum: number, l: any) =>
        sum +
        l.price_data.unit_amount * l.quantity,
      0,
    );
    if (!total || total < minimum) {
      throw new Error(
        `Amount must be at least ${minimum} ${currency} minor units`,
      );
    }

    const session =
      await stripeClient.checkout.sessions.create(
        {
          ui_mode: "embedded",
          payment_method_types: ["card"],
          line_items,
          mode: payment.freq
            ? "subscription"
            : "payment",
          return_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
          customer_email: customerEmail,
          tax_id_collection: { enabled: true },
          automatic_tax: { enabled: true },
          metadata: {
            user_id: user?.id ?? null,
            name: `${identity?.first ?? ""} ${identity?.last ?? ""}`.trim(),
            ...(payment.metadata ?? {}),
          },
        },
      );

    return new Response(
      JSON.stringify({
        clientSecret: session.client_secret,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
