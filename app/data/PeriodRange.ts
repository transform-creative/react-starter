import { DateTime } from "luxon";

export type PeriodPreset =
  | "last-week"
  | "last-month"
  | "last-3-months"
  | "last-year"
  | "this-year";

/** An admin-picked range of inclusive ISO dates. Encoded as one string rather
 *  than an object so it stays a stable primitive in effect dependency arrays
 *  and `===` checks. Build with customPeriod, read with parseCustomPeriod. */
export type CustomPeriod =
  `custom:${string}:${string}`;

export type Period = PeriodPreset | CustomPeriod;

export type PeriodGranularity =
  | "day"
  | "week"
  | "month";

/** How far back a custom range may start. */
export const CUSTOM_RANGE_MAX_YEARS = 1;

/** Value used by dropdowns (and `?period=` links) to stand in for any custom range. */
export const CUSTOM_PERIOD_OPTION = "custom";

export const PERIOD_PRESETS: {
  label: string;
  value: PeriodPreset;
}[] = [
  { label: "Last Week", value: "last-week" },
  { label: "Last Month", value: "last-month" },
  {
    label: "Last 3 Months",
    value: "last-3-months",
  },
  { label: "Last Year", value: "last-year" },
  { label: "This Year", value: "this-year" },
];

/******************************
 * customPeriod
 * Encodes an inclusive from/to pair of ISO dates as a Period
 */
export function customPeriod(
  from: string,
  to: string,
): CustomPeriod {
  return `custom:${from}:${to}`;
}

/******************************
 * parseCustomPeriod
 * The from/to dates of a custom period, or null for a preset
 */
export function parseCustomPeriod(
  period: Period,
): { from: string; to: string } | null {
  if (!period.startsWith("custom:")) return null;
  const [, from, to] = period.split(":");
  return { from, to };
}

/******************************
 * customRangeLimits
 * The earliest and latest dates a custom range may cover: the last
 * CUSTOM_RANGE_MAX_YEARS up to today
 */
export function customRangeLimits(
  now: DateTime = DateTime.now(),
): {
  min: string;
  max: string;
} {
  return {
    min: now
      .minus({ years: CUSTOM_RANGE_MAX_YEARS })
      .toISODate()!,
    max: now.toISODate()!,
  };
}

/** True for a real calendar date in strict yyyy-MM-dd form. */
function isIsoDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    DateTime.fromISO(value).isValid
  );
}

/******************************
 * validateCustomRange
 * Why a from/to pair can't be used as a period, or null when it can. Kept
 * separate from customPeriod so a half-typed date can sit in the inputs,
 * flagged, without ever reaching a query
 */
export function validateCustomRange(
  from: string,
  to: string,
  now: DateTime = DateTime.now(),
): string | null {
  if (!isIsoDate(from) || !isIsoDate(to))
    return "Pick both a start and an end date";

  const { min, max } = customRangeLimits(now);
  if (from < min || to < min)
    return `Dates can't be earlier than ${DateTime.fromISO(min).toFormat("d MMM yyyy")}`;
  if (from > max || to > max)
    return "Dates can't be in the future";
  if (from > to)
    return "The start date must be on or before the end date";
  return null;
}

/******************************
 * periodToDateRange
 * ISO start and end dates for a period. Every preset ends today; a custom
 * range returns its own dates
 */
export function periodToDateRange(
  period: Period,
  now: DateTime = DateTime.now(),
): { startDate: string; endDate: string } {
  const custom = parseCustomPeriod(period);
  if (custom)
    return {
      startDate: custom.from,
      endDate: custom.to,
    };

  const startMap: Record<PeriodPreset, DateTime> =
    {
      "last-week": now.minus({ weeks: 1 }),
      "last-month": now.minus({ months: 1 }),
      "last-3-months": now.minus({ months: 3 }),
      "last-year": now.minus({ years: 1 }),
      "this-year": now.startOf("year"),
    };
  return {
    startDate:
      startMap[
        period as PeriodPreset
      ].toISODate()!,
    endDate: now.toISODate()!,
  };
}

/******************************
 * periodBounds
 * The period as timestamps for timestamp-keyed queries. `until` is an
 * EXCLUSIVE bound (midnight after the last day) and null for every preset,
 * which reads up to now. Only a custom range ends early
 */
export function periodBounds(
  period: Period,
  now: DateTime = DateTime.now(),
): { since: DateTime; until: DateTime | null } {
  const { startDate, endDate } =
    periodToDateRange(period, now);
  return {
    since: DateTime.fromISO(startDate),
    until: parseCustomPeriod(period)
      ? DateTime.fromISO(endDate).plus({
          days: 1,
        })
      : null,
  };
}

/******************************
 * periodGranularity
 * Chart bucket size for a period, so every chart on a page shares an x axis.
 * Presets pick by name; a custom range picks by span with the same breakpoints
 */
export function periodGranularity(
  period: Period,
): PeriodGranularity {
  const custom = parseCustomPeriod(period);
  if (custom) {
    const days =
      DateTime.fromISO(custom.to).diff(
        DateTime.fromISO(custom.from),
        "days",
      ).days + 1;
    if (days > 93) return "month";
    if (days > 31) return "week";
    return "day";
  }
  if (period === "last-year") return "month";
  if (period === "last-3-months") return "week";
  return "day";
}

/******************************
 * periodFromSearchParams
 * Reads `?period=` (plus `?from=&to=` for a custom range) back into a Period.
 * A hand-edited or stale link is ignored (null) rather than clamped
 */
export function periodFromSearchParams(
  params: URLSearchParams,
  now: DateTime = DateTime.now(),
): Period | null {
  const value = params.get("period");
  if (value === CUSTOM_PERIOD_OPTION) {
    const from = params.get("from") ?? "";
    const to = params.get("to") ?? "";
    return validateCustomRange(from, to, now)
      ? null
      : customPeriod(from, to);
  }
  return PERIOD_PRESETS.some(
    (p) => p.value === value,
  )
    ? (value as PeriodPreset)
    : null;
}

/******************************
 * periodToSearchParams
 * Writes a Period into a copy of `params`: the preset name, or `custom` plus
 * its dates. Other params are preserved
 */
export function periodToSearchParams(
  period: Period,
  params: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(params);
  const custom = parseCustomPeriod(period);
  if (custom) {
    next.set("period", CUSTOM_PERIOD_OPTION);
    next.set("from", custom.from);
    next.set("to", custom.to);
  } else {
    next.set("period", period);
    next.delete("from");
    next.delete("to");
  }
  return next;
}
