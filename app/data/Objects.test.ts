import { describe, it, expect } from "vitest";
import {
  formatCents,
  formatDollars,
  formatNumber,
} from "./Objects";

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(12345)).toBe("12,345");
  });

  it("returns '0' for non-finite values", () => {
    expect(formatNumber(NaN)).toBe("0");
    expect(formatNumber(Infinity)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
  });
});

describe("formatDollars", () => {
  it("renders 2 decimals by default", () => {
    expect(formatDollars(12345.6)).toBe("12,345.60");
  });

  it("honours the decimals argument", () => {
    expect(formatDollars(12345.6, 0)).toBe("12,346");
  });
});

describe("formatCents", () => {
  it("converts cents to formatted dollars", () => {
    expect(formatCents(1234500)).toBe("12,345.00");
  });

  it("handles null/undefined as 0", () => {
    expect(formatCents(null)).toBe("0.00");
    expect(formatCents(undefined)).toBe("0.00");
  });
});
