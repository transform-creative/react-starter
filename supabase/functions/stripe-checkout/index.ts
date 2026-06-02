/**
 * stripe-checkout
 * Creates a Stripe embedded-checkout session from a `{ payment, identity }`
 * request body. Optionally rate-limits by user id (or IP for anonymous
 * callers) via Upstash Redis when both env vars are set; rate limiting fails
 * open if Redis is unavailable so payments never silently block.
 *
 * Request body:
 *   payment: {
 *     currency: string,
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

const stripeClient = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiter is optional. If either env var is missing we skip rate limiting
// so new projects can spin up checkout without provisioning Redis first.
const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
const ratelimit =
  REDIS_URL && REDIS_TOKEN
    ? new Ratelimit({
        redis: new Redis({ url: REDIS_URL, token: REDIS_TOKEN }),
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        analytics: false,
      })
    : null;

const MIN_AMOUNT_CENTS = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (ratelimit) {
      const identifier =
        user?.id ?? req.headers.get("x-forwarded-for") ?? "anon_ip";
      try {
        const { success } = await ratelimit.limit(identifier);
        if (!success) {
          return new Response(
            JSON.stringify({
              error: "Too many checkout attempts. Please wait a minute.",
            }),
            {
              status: 429,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            },
          );
        }
      } catch (err) {
        // Upstash is down — fail open so payments still succeed.
        console.error("RATE LIMITER FAILURE (failing open):", err);
      }
    }

    const { payment, identity } = await req.json();

    const customerEmail = user?.email || identity?.email;
    if (!customerEmail) throw new Error("Email is required for receipt.");

    const line_items =
      payment.cart && payment.cart.length
        ? payment.cart.map((cart_item: any) => ({
            price_data: {
              currency: payment.currency,
              product_data: { name: cart_item.product.name },
              unit_amount: Math.floor(cart_item.product.amount),
            },
            quantity: cart_item.quantity || 1,
          }))
        : [
            {
              price_data: {
                currency: payment.currency,
                product_data: { name: payment.title ?? "Payment" },
                unit_amount: Math.floor(payment.cents ?? 0),
              },
              quantity: 1,
            },
          ];

    if (payment.freq && line_items[0].price_data) {
      (line_items[0].price_data as any).recurring = { interval: payment.freq };
    }

    const total = line_items.reduce(
      (sum: number, l: any) => sum + l.price_data.unit_amount * l.quantity,
      0,
    );
    if (!total || total < MIN_AMOUNT_CENTS) {
      throw new Error(`Amount must be at least ${MIN_AMOUNT_CENTS} cents`);
    }

    const session = await stripeClient.checkout.sessions.create({
      ui_mode: "embedded",
      payment_method_types: ["card"],
      line_items,
      mode: payment.freq ? "subscription" : "payment",
      return_url: `${payment.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customerEmail,
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: true },
      metadata: {
        user_id: user?.id ?? null,
        name: `${identity?.first ?? ""} ${identity?.last ?? ""}`.trim(),
        ...(payment.metadata ?? {}),
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
