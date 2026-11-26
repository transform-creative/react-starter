import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CURRENCIES,
  SUPPORTED_CURRENCIES,
} from "./Currency";

/******************************
 * The stripe-checkout edge function keeps its own currency allowlist (Deno
 * can't import from app/). A currency offered in the UI but missing there
 * 400s at checkout; one allowed there but not here is an unreviewed charge
 * path. Parse the edge source and fail if the two drift.
 */
describe("stripe-checkout currency allowlist parity", () => {
  const source = readFileSync(
    resolve(
      __dirname,
      "../../supabase/functions/stripe-checkout/index.ts",
    ),
    "utf8",
  );
  const block = source.match(
    /const SUPPORTED_CURRENCIES[^=]*=\s*\{([\s\S]*?)\};/,
  );

  it("finds the allowlist in the edge function", () => {
    expect(block).not.toBeNull();
  });

  it("lists the same currencies with the same minimums", () => {
    const edge = Object.fromEntries(
      [
        ...(block?.[1] ?? "").matchAll(
          /(\w+):\s*(\d+)/g,
        ),
      ].map((m) => [m[1], Number(m[2])]),
    );
    const app = Object.fromEntries(
      SUPPORTED_CURRENCIES.map((code) => [
        code,
        CURRENCIES[code].minimumMinorUnits,
      ]),
    );
    expect(edge).toEqual(app);
  });
});
