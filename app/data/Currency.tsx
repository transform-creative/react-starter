/******************************************
 * Multi-currency money support.
 *
 * BASE_CURRENCY is the currency the organisation banks in and that every
 * database total is denominated in. It renders bare (`$68`). Every other
 * currency is ticker-prefixed by default (`NZD $60`) so nobody mistakes one
 * dollar for another. `moneyPrefix` is the ONE place that rule lives —
 * `formatMoney` builds on it; don't hand-roll a symbol anywhere else.
 *
 * IMPORTANT: a `cents` amount means "minor units of THAT row's currency" —
 * pence for GBP. It is only base-currency cents when the row's currency is the
 * base. Never add `cents` up across rows of mixed currency: use
 * `sumBaseCents`, which only counts a value whose base equivalent is known.
 *
 * ADDING A CURRENCY: append to SUPPORTED_CURRENCIES, add a CURRENCIES entry,
 * and mirror the code + minimum into the allowlist in
 * supabase/functions/stripe-checkout/index.ts (Deno can't import from here).
 * `CurrencyEdgeParity.test.ts` fails if the two drift.
 */

export const BASE_CURRENCY = "aud";

export const SUPPORTED_CURRENCIES = [
  "aud",
  "nzd",
  "gbp",
  "usd",
] as const;

export type SupportedCurrency =
  (typeof SUPPORTED_CURRENCIES)[number];

export type CurrencyConfig = {
  code: SupportedCurrency;
  /** Upper-case ISO 4217 ticker shown beside non-base amounts. */
  ticker: string;
  symbol: string;
  /** Human label for a selector, e.g. "GBP — British Pound". */
  label: string;
  /** Smallest chargeable amount, in this currency's minor units. */
  minimumMinorUnits: number;
};

export const CURRENCIES: Record<
  SupportedCurrency,
  CurrencyConfig
> = {
  aud: {
    code: "aud",
    ticker: "AUD",
    symbol: "$",
    label: "AUD — Australian Dollar",
    minimumMinorUnits: 500,
  },
  nzd: {
    code: "nzd",
    ticker: "NZD",
    symbol: "$",
    label: "NZD — New Zealand Dollar",
    minimumMinorUnits: 500,
  },
  gbp: {
    code: "gbp",
    ticker: "GBP",
    symbol: "£",
    label: "GBP — British Pound",
    // £3, not £5 — 500 pence is nearly double A$5.
    minimumMinorUnits: 300,
  },
  usd: {
    code: "usd",
    ticker: "USD",
    symbol: "$",
    label: "USD — US Dollar",
    minimumMinorUnits: 300,
  },
};

/*******************************************
 * Narrow an unknown value (localStorage, a URL param, a DB row) to a
 * supported currency. Case-sensitive: codes are stored lower-case, as Stripe
 * returns them.
 */
export function isSupportedCurrency(
  value: unknown,
): value is SupportedCurrency {
  return (
    typeof value === "string" &&
    (
      SUPPORTED_CURRENCIES as readonly string[]
    ).includes(value)
  );
}

/*******************************************
 * Config lookup that never throws — unknown codes fall back to the base
 * currency so a stale stored value can't blank out the UI.
 */
export function getCurrency(
  code: unknown,
): CurrencyConfig {
  const normalised =
    typeof code === "string"
      ? code.toLowerCase()
      : code;
  return isSupportedCurrency(normalised)
    ? CURRENCIES[normalised]
    : CURRENCIES[BASE_CURRENCY];
}

/*******************************************
 * True when `currency` is the base currency. A missing currency counts as
 * base — legacy rows written before a currency column existed were base.
 */
export function isBaseCurrency(
  currency: unknown,
): boolean {
  return (
    currency == null ||
    String(currency).toLowerCase() ===
      BASE_CURRENCY
  );
}

/*******************************************
 * The bit in front of a number: "$" for the base currency, "GBP £" /
 * "NZD $" for everything else.
 * @param currency Falls back to base if unrecognised
 * @param showTicker Override the default (ticker on all but the base)
 */
export function moneyPrefix(
  currency: unknown,
  showTicker?: boolean,
): string {
  const config = getCurrency(currency);
  const withTicker =
    showTicker ?? config.code !== BASE_CURRENCY;
  return withTicker
    ? `${config.ticker} ${config.symbol}`
    : config.symbol;
}

export type FormatMoneyOptions = {
  /** Show the ISO ticker. Defaults to true for every non-base currency. */
  ticker?: boolean;
  /**
   * Force a decimal count. By default whole amounts render with none (`$68`)
   * and everything else with two (`$68.50`).
   */
  decimals?: number;
};

/*******************************************
 * Render an amount in minor units as money. Negative amounts (refunds) keep
 * the sign in front of the prefix: `-$5`.
 * @param minorUnits Cents/pence in `currency`
 * @param currency Falls back to base if unrecognised
 * @example formatMoney(6800, "aud") // "$68"
 * @example formatMoney(3550, "gbp") // "GBP £35.50"
 */
export function formatMoney(
  minorUnits: number | null | undefined,
  currency: unknown = BASE_CURRENCY,
  options: FormatMoneyOptions = {},
): string {
  const raw = Number(minorUnits);
  const units = Number.isFinite(raw)
    ? raw / 100
    : 0;

  const decimals =
    options.decimals ??
    (Number.isInteger(units) ? 0 : 2);

  const amount = Math.abs(units).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    },
  );

  const sign = units < 0 ? "-" : "";
  return `${sign}${moneyPrefix(currency, options.ticker)}${amount}`;
}

/*******************************************
 * Same as `formatMoney` but takes whole units (dollars, pounds).
 */
export function formatMoneyUnits(
  units: number | null | undefined,
  currency: unknown = BASE_CURRENCY,
  options: FormatMoneyOptions = {},
): string {
  const raw = Number(units);
  return formatMoney(
    Number.isFinite(raw)
      ? Math.round(raw * 100)
      : 0,
    currency,
    options,
  );
}

/*******************************************
 * The fields a payment row may carry to be shown or totalled in the base
 * currency. Map your table's columns onto this shape (e.g. `cents_aud` →
 * `cents_base`). `cents_base` is the SETTLED base equivalent captured from
 * Stripe's balance transaction — never a looked-up or guessed rate.
 */
export interface BaseValueSource {
  cents?: number | null;
  currency?: string | null;
  cents_base?: number | null;
  refunded_cents?: number | null;
  refunded_cents_base?: number | null;
}

/*******************************************
 * What the payer paid for ONE row, in base cents, BEFORE refunds — the base
 * twin of `cents`. A base-currency row is its own figure; a foreign one is its
 * captured `cents_base`. `null` when not known yet (settlement hasn't posted,
 * or an abandoned checkout that never will) — render that as "unknown", never
 * "$0".
 */
export function settledBaseCents(
  row: BaseValueSource,
): number | null {
  if (isBaseCurrency(row.currency))
    return row.cents ?? null;
  return row.cents_base ?? null;
}

/*******************************************
 * What ONE row contributes to a total: its settled base value net of refunds,
 * or `null` when unknown — which a total must leave out rather than count at
 * its raw foreign figure.
 */
export function netBaseCents(
  row: BaseValueSource,
): number | null {
  const gross = settledBaseCents(row);
  if (gross == null) return null;
  const refunded = isBaseCurrency(row.currency)
    ? row.refunded_cents
    : row.refunded_cents_base;
  return gross - (refunded ?? 0);
}

/*******************************************
 * A total across many rows, in base cents, net of refunds. The ONLY way the
 * client should add payments up across currencies. Rows whose base value
 * isn't known yet are skipped; `unknownCount` says how many, so a dashboard
 * can flag the total as provisional instead of silently under-reporting.
 */
export function sumBaseCents(
  rows:
    | ReadonlyArray<BaseValueSource>
    | null
    | undefined,
): { total: number; unknownCount: number } {
  let total = 0;
  let unknownCount = 0;
  for (const row of rows ?? []) {
    const value = netBaseCents(row);
    if (value == null) unknownCount += 1;
    else total += value;
  }
  return { total, unknownCount };
}

export interface MoneyDisplay {
  /** As-charged amount, in the row's own currency. Always present. */
  charged: string;
  /** Settled base equivalent — only for a foreign row whose settlement is known. */
  converted?: string;
}

/*******************************************
 * How to show ONE row's amount: the as-charged figure, plus the settled base
 * equivalent for a foreign row once it is known. The converted figure always
 * carries the ticker so `$68` beside `GBP £35` can't be misread.
 */
export function formatMoneyWithBase(
  row: BaseValueSource,
): MoneyDisplay {
  const charged = formatMoney(
    row.cents,
    row.currency,
  );
  if (isBaseCurrency(row.currency))
    return { charged };
  const base = settledBaseCents(row);
  if (base == null) return { charged };
  return {
    charged,
    converted: formatMoney(base, BASE_CURRENCY, {
      ticker: true,
    }),
  };
}

/*******************************************
 * IANA timezone prefixes → currency, matched longest-prefix-first. Timezone
 * beats an IP lookup: it's synchronous, sends no PII, and needs no extra host
 * in the CSP `connect-src`. It's a default, never a lock.
 */
const TIMEZONE_PREFIXES: [
  string,
  SupportedCurrency,
][] = [
  ["Australia/", "aud"],
  ["Antarctica/Macquarie", "aud"],
  ["Pacific/Auckland", "nzd"],
  ["Pacific/Chatham", "nzd"],
  ["NZ", "nzd"],
  ["Europe/London", "gbp"],
  ["Europe/Belfast", "gbp"],
  ["Europe/Guernsey", "gbp"],
  ["Europe/Jersey", "gbp"],
  ["Europe/Isle_of_Man", "gbp"],
  ["GB", "gbp"],
  ["America/New_York", "usd"],
  ["America/Chicago", "usd"],
  ["America/Denver", "usd"],
  ["America/Phoenix", "usd"],
  ["America/Los_Angeles", "usd"],
  ["America/Anchorage", "usd"],
  ["America/Detroit", "usd"],
  ["America/Indiana/", "usd"],
  ["America/Kentucky/", "usd"],
  ["Pacific/Honolulu", "usd"],
  ["US/", "usd"],
];

/** Weaker fallback — "en-US" is the factory default on many non-US devices. */
const REGION_CURRENCIES: Record<
  string,
  SupportedCurrency
> = {
  AU: "aud",
  NZ: "nzd",
  GB: "gbp",
  UK: "gbp",
  US: "usd",
};

/*******************************************
 * Map an IANA timezone to a supported currency, or null if it isn't one of
 * ours. Only returns codes that are still in SUPPORTED_CURRENCIES, so trimming
 * that list never needs this table edited.
 */
export function currencyFromTimezone(
  timezone: string | null | undefined,
): SupportedCurrency | null {
  if (!timezone) return null;
  const match = TIMEZONE_PREFIXES.filter(
    ([prefix, code]) =>
      timezone.startsWith(prefix) &&
      isSupportedCurrency(code),
  ).sort((a, b) => b[0].length - a[0].length)[0];
  return match ? match[1] : null;
}

/*******************************************
 * Map a BCP 47 locale ("en-GB", "zh-Hans-NZ") to a supported currency.
 */
export function currencyFromLocale(
  locale: string | null | undefined,
): SupportedCurrency | null {
  if (!locale) return null;
  const region = locale
    .split("-")
    .slice(1)
    .map((part) => part.toUpperCase())
    .find(
      (part) =>
        part in REGION_CURRENCIES &&
        isSupportedCurrency(
          REGION_CURRENCIES[part],
        ),
    );
  return region
    ? REGION_CURRENCIES[region]
    : null;
}

/*******************************************
 * Best guess at the visitor's currency from the browser alone: timezone,
 * then locale, then base. Never throws.
 */
export function detectCurrency(): SupportedCurrency {
  if (typeof window === "undefined")
    return BASE_CURRENCY;

  try {
    const zone =
      Intl.DateTimeFormat().resolvedOptions()
        .timeZone;
    const fromZone = currencyFromTimezone(zone);
    if (fromZone) return fromZone;
  } catch {
    // Intl unavailable — fall through to locale.
  }

  const locales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const locale of locales) {
    const fromLocale = currencyFromLocale(locale);
    if (fromLocale) return fromLocale;
  }
  return BASE_CURRENCY;
}

export const CURRENCY_STORAGE_KEY =
  "preferred_currency";

/*******************************************
 * The currency the visitor picked by hand on a previous visit. Outranks
 * detection: an expat giving in GBP shouldn't have to re-pick every time.
 */
export function readStoredCurrency(): SupportedCurrency | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(
      CURRENCY_STORAGE_KEY,
    );
    return isSupportedCurrency(stored)
      ? stored
      : null;
  } catch {
    return null;
  }
}

/*******************************************
 * Persist a hand-picked currency. No-ops when storage is unavailable.
 */
export function storeCurrency(
  currency: SupportedCurrency,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CURRENCY_STORAGE_KEY,
      currency,
    );
  } catch {
    // Private mode — detection runs again next visit.
  }
}

/*******************************************
 * The currency to start in: a past explicit choice, else detection.
 */
export function resolveInitialCurrency(): SupportedCurrency {
  return readStoredCurrency() ?? detectCurrency();
}

/*******************************************
 * Options for a `react-select` / `LabelInput` dropdown.
 */
export function currencySelectOptions() {
  return SUPPORTED_CURRENCIES.map((code) => ({
    value: code,
    label: CURRENCIES[code].label,
  }));
}

/*******************************************
 * react-select `formatOptionLabel`: ticker alone in the closed control (it
 * usually sits inline beside an amount, where the full label won't fit on a
 * phone), full label in the open menu.
 */
export function formatCurrencyOption(
  option: { value: string; label: string },
  meta: { context: "menu" | "value" },
): string {
  return meta.context === "value"
    ? getCurrency(option.value).ticker
    : option.label;
}
