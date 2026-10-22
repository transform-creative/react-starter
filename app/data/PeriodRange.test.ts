import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import {
  customPeriod,
  customRangeLimits,
  parseCustomPeriod,
  periodBounds,
  periodFromSearchParams,
  periodGranularity,
  periodToDateRange,
  periodToSearchParams,
  validateCustomRange,
} from "./PeriodRange";

const NOW = DateTime.fromISO(
  "2026-10-22T10:00:00",
);

/******************************
 * custom period encoding
 */
describe("customPeriod / parseCustomPeriod", () => {
  it("round-trips a range", () => {
    expect(
      parseCustomPeriod(
        customPeriod("2026-01-01", "2026-02-01"),
      ),
    ).toEqual({
      from: "2026-01-01",
      to: "2026-02-01",
    });
  });

  it("returns null for a preset", () => {
    expect(
      parseCustomPeriod("last-month"),
    ).toBeNull();
  });
});

/******************************
 * validateCustomRange
 */
describe("validateCustomRange", () => {
  it("accepts a range inside the last 12 months", () => {
    expect(
      validateCustomRange(
        "2026-09-01",
        "2026-10-01",
        NOW,
      ),
    ).toBeNull();
  });

  it("accepts a single day, including today", () => {
    expect(
      validateCustomRange(
        "2026-10-22",
        "2026-10-22",
        NOW,
      ),
    ).toBeNull();
  });

  it("rejects half-typed and impossible dates", () => {
    expect(
      validateCustomRange("", "2026-10-01", NOW),
    ).not.toBeNull();
    expect(
      validateCustomRange(
        "2026-02-30",
        "2026-10-01",
        NOW,
      ),
    ).not.toBeNull();
    expect(
      validateCustomRange(
        "2026-9-1",
        "2026-10-01",
        NOW,
      ),
    ).not.toBeNull();
  });

  it("rejects dates before the 12 month limit", () => {
    expect(
      validateCustomRange(
        "2025-10-21",
        "2026-10-01",
        NOW,
      ),
    ).toMatch(/earlier than/);
    expect(
      validateCustomRange(
        "2025-10-22",
        "2026-10-01",
        NOW,
      ),
    ).toBeNull();
  });

  it("rejects future dates", () => {
    expect(
      validateCustomRange(
        "2026-10-01",
        "2026-10-23",
        NOW,
      ),
    ).toMatch(/future/);
  });

  it("rejects a start after the end", () => {
    expect(
      validateCustomRange(
        "2026-10-02",
        "2026-10-01",
        NOW,
      ),
    ).toMatch(/on or before/);
  });

  it("exposes the limits it checks against", () => {
    expect(customRangeLimits(NOW)).toEqual({
      min: "2025-10-22",
      max: "2026-10-22",
    });
  });
});

/******************************
 * periodToDateRange / periodBounds
 */
describe("periodToDateRange", () => {
  it("ends presets today", () => {
    expect(
      periodToDateRange("last-week", NOW),
    ).toEqual({
      startDate: "2026-10-15",
      endDate: "2026-10-22",
    });
    expect(
      periodToDateRange("this-year", NOW)
        .startDate,
    ).toBe("2026-01-01");
  });

  it("returns a custom range's own dates", () => {
    expect(
      periodToDateRange(
        customPeriod("2026-03-01", "2026-03-31"),
        NOW,
      ),
    ).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-31",
    });
  });
});

describe("periodBounds", () => {
  it("has no upper bound for a preset", () => {
    expect(
      periodBounds("last-month", NOW).until,
    ).toBeNull();
  });

  it("makes a custom range's upper bound exclusive", () => {
    const { since, until } = periodBounds(
      customPeriod("2026-03-01", "2026-03-31"),
      NOW,
    );
    expect(since.toISODate()).toBe("2026-03-01");
    expect(until?.toISODate()).toBe("2026-04-01");
  });
});

/******************************
 * periodGranularity
 */
describe("periodGranularity", () => {
  it("picks by name for presets", () => {
    expect(periodGranularity("last-week")).toBe(
      "day",
    );
    expect(
      periodGranularity("last-3-months"),
    ).toBe("week");
    expect(periodGranularity("last-year")).toBe(
      "month",
    );
  });

  it("picks by span for a custom range", () => {
    expect(
      periodGranularity(
        customPeriod("2026-10-01", "2026-10-31"),
      ),
    ).toBe("day");
    expect(
      periodGranularity(
        customPeriod("2026-09-01", "2026-10-22"),
      ),
    ).toBe("week");
    expect(
      periodGranularity(
        customPeriod("2026-01-01", "2026-10-22"),
      ),
    ).toBe("month");
  });
});

/******************************
 * URL round-trip
 */
describe("search params", () => {
  it("round-trips a custom range and keeps other params", () => {
    const period = customPeriod(
      "2026-09-01",
      "2026-10-01",
    );
    const params = periodToSearchParams(
      period,
      new URLSearchParams("page=finance"),
    );
    expect(params.get("page")).toBe("finance");
    expect(
      periodFromSearchParams(params, NOW),
    ).toBe(period);
  });

  it("clears from/to when switching back to a preset", () => {
    const custom = periodToSearchParams(
      customPeriod("2026-09-01", "2026-10-01"),
      new URLSearchParams(),
    );
    const params = periodToSearchParams(
      "last-week",
      custom,
    );
    expect(params.has("from")).toBe(false);
    expect(
      periodFromSearchParams(params, NOW),
    ).toBe("last-week");
  });

  it("ignores unknown presets and stale or invalid custom links", () => {
    expect(
      periodFromSearchParams(
        new URLSearchParams("period=nope"),
        NOW,
      ),
    ).toBeNull();
    expect(
      periodFromSearchParams(
        new URLSearchParams(
          "period=custom&from=2020-01-01&to=2020-02-01",
        ),
        NOW,
      ),
    ).toBeNull();
    expect(
      periodFromSearchParams(
        new URLSearchParams(),
        NOW,
      ),
    ).toBeNull();
  });
});
