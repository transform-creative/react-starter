import { describe, it, expect } from "vitest";
import type { Session } from "@supabase/supabase-js";
import {
  ADMIN_PAGES,
  canViewAdmin,
  parseAdminPage,
  summarisePayments,
} from "./AdminBL";

const SESSION = { user: { id: "u1" } } as Session;

/******************************
 * parseAdminPage tests
 * Unknown or missing ?page= values must fall back to the first page.
 */
describe("parseAdminPage", () => {
  it("accepts every registered page", () => {
    for (const { page } of ADMIN_PAGES)
      expect(parseAdminPage(page)).toBe(page);
  });

  it("falls back to the first page", () => {
    expect(parseAdminPage(null)).toBe(
      "dashboard",
    );
    expect(parseAdminPage("nope")).toBe(
      "dashboard",
    );
  });
});

/******************************
 * canViewAdmin tests
 * Guards the session + MFA gate on the admin console.
 */
describe("canViewAdmin", () => {
  it("blocks signed-out users", () => {
    expect(canViewAdmin(null, null, null)).toBe(
      false,
    );
  });

  it("allows a session with no MFA enrolled", () => {
    expect(
      canViewAdmin(SESSION, "aal1", "aal1"),
    ).toBe(true);
  });

  it("blocks an enrolled user who has not passed the MFA challenge", () => {
    expect(
      canViewAdmin(SESSION, "aal1", "aal2"),
    ).toBe(false);
  });

  it("allows an enrolled user at aal2", () => {
    expect(
      canViewAdmin(SESSION, "aal2", "aal2"),
    ).toBe(true);
  });
});

/******************************
 * summarisePayments tests
 * Money is in cents; cents is the full amount paid, so support_cents is never added.
 */
describe("summarisePayments", () => {
  it("returns zeros for no payments", () => {
    expect(summarisePayments([])).toEqual({
      grossCents: 0,
      refundedCents: 0,
      netCents: 0,
      count: 0,
      averageCents: 0,
    });
  });

  it("does not add support_cents on top of cents", () => {
    const s = summarisePayments([
      { cents: 1100, support_cents: 100 },
      { cents: 900 },
    ]);
    expect(s.grossCents).toBe(2000);
    expect(s.averageCents).toBe(1000);
  });

  it("subtracts refunds and floors net at zero", () => {
    expect(
      summarisePayments([
        { cents: 1000, refunded_cents: 400 },
      ]).netCents,
    ).toBe(600);
    expect(
      summarisePayments([
        { cents: 100, refunded_cents: 500 },
      ]).netCents,
    ).toBe(0);
  });
});
