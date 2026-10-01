import { describe, it, expect } from "vitest";
import { isSessionExpired } from "./ErrorReporting";

/******************************
 * isSessionExpired
 */
describe("isSessionExpired", () => {
  it("flags PGRST303 (JWT expired)", () => {
    expect(
      isSessionExpired({
        code: "PGRST303",
        message: "JWT expired",
      }),
    ).toBe(true);
  });

  it("still logs PGRST301 — a forged or garbled token", () => {
    expect(
      isSessionExpired({ code: "PGRST301" }),
    ).toBe(false);
  });

  it("is false for plain errors, strings and null", () => {
    expect(isSessionExpired(new Error("x"))).toBe(
      false,
    );
    expect(isSessionExpired("JWT expired")).toBe(
      false,
    );
    expect(isSessionExpired(null)).toBe(false);
  });
});
