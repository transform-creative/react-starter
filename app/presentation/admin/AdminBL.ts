import type { Session } from "@supabase/supabase-js";
import type { AalLevel } from "~/data/CommonTypes";

/*********************************
 * The admin sub-pages, in navbar order. Each is a `?page=` value that
 * AdminRoute switches on. Add a page here and a branch in AdminRoute.
 */
export const ADMIN_PAGES = [
  { page: "dashboard", label: "Dashboard" },
  { page: "finance", label: "Finance" },
] as const;

export type AdminPage =
  (typeof ADMIN_PAGES)[number]["page"];

/*********************************
 * Resolves the `?page=` query value to a known admin page, falling back to the
 * first page so a stale or hand-edited URL never renders a blank screen.
 * @param value The raw search param
 */
export function parseAdminPage(
  value: string | null | undefined,
): AdminPage {
  return (
    ADMIN_PAGES.find((p) => p.page === value)
      ?.page ?? ADMIN_PAGES[0].page
  );
}

/*********************************
 * Whether the admin console should render. Requires a session, and — when the
 * user has MFA enrolled (nextLevel aal2) — a verified aal2 session. This is a
 * UX gate only: authorisation must still be enforced by RLS / RPCs.
 */
export function canViewAdmin(
  session: Session | null,
  aalCurrent: AalLevel | null,
  aalNext: AalLevel | null,
): boolean {
  if (!session) return false;
  if (aalNext === "aal2" && aalCurrent !== "aal2")
    return false;
  return true;
}

export interface PaymentRow {
  cents: number;
  support_cents?: number | null;
  refunded_cents?: number | null;
}

export interface FinanceSummary {
  grossCents: number;
  refundedCents: number;
  netCents: number;
  count: number;
  averageCents: number;
}

/*********************************
 * Totals a list of payments. `cents` is the FULL amount the customer paid
 * (any tip/fee line included), so the totals never add `support_cents` on top.
 * Refunds are subtracted for the net figure, which is floored at zero.
 * @param rows Payments with integer-cent amounts
 */
export function summarisePayments(
  rows: PaymentRow[],
): FinanceSummary {
  const grossCents = rows.reduce(
    (sum, r) => sum + (Number(r.cents) || 0),
    0,
  );
  const refundedCents = rows.reduce(
    (sum, r) =>
      sum + (Number(r.refunded_cents) || 0),
    0,
  );
  return {
    grossCents,
    refundedCents,
    netCents: Math.max(
      0,
      grossCents - refundedCents,
    ),
    count: rows.length,
    averageCents: rows.length
      ? Math.round(grossCents / rows.length)
      : 0,
  };
}
