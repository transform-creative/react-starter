import {
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import {
  BASE_CURRENCY,
  CURRENCIES,
  currencyFromLocale,
  currencyFromTimezone,
  formatCurrencyOption,
  formatMoney,
  formatMoneyUnits,
  formatMoneyWithBase,
  getCurrency,
  moneyPrefix,
  netBaseCents,
  readStoredCurrency,
  settledBaseCents,
  storeCurrency,
  sumBaseCents,
} from "./Currency";

/******************************
 * Formatting: base renders bare, everything else ticker-first
 */
describe("formatMoney", () => {
  it("renders the base currency bare", () => {
    expect(formatMoney(6800, "aud")).toBe("$68");
  });

  it("ticker-prefixes non-base currencies", () => {
    expect(formatMoney(3550, "gbp")).toBe(
      "GBP £35.50",
    );
    expect(formatMoney(6000, "nzd")).toBe(
      "NZD $60",
    );
  });

  it("respects the ticker and decimals overrides", () => {
    expect(
      formatMoney(6800, "aud", { ticker: true }),
    ).toBe("AUD $68");
    expect(
      formatMoney(6000, "gbp", { ticker: false }),
    ).toBe("£60");
    expect(
      formatMoney(6800, "aud", { decimals: 2 }),
    ).toBe("$68.00");
  });

  it("puts the sign in front of the prefix", () => {
    expect(formatMoney(-500, "gbp")).toBe(
      "-GBP £5",
    );
  });

  it("treats junk as zero and unknown codes as base", () => {
    expect(formatMoney(NaN)).toBe("$0");
    expect(formatMoney(null, "jpy")).toBe("$0");
    expect(formatMoney(100, "GBP")).toBe(
      "GBP £1",
    );
  });

  it("formats whole units without float drift", () => {
    expect(formatMoneyUnits(10.1, "aud")).toBe(
      "$10.10",
    );
  });
});

describe("moneyPrefix / getCurrency", () => {
  it("falls back to the base currency", () => {
    expect(getCurrency(undefined).code).toBe(
      BASE_CURRENCY,
    );
    expect(moneyPrefix("xyz")).toBe("$");
  });
});

/******************************
 * Base-currency totals never mix currencies
 */
describe("settledBaseCents / netBaseCents", () => {
  it("uses cents for a base-currency row", () => {
    expect(
      settledBaseCents({
        cents: 1000,
        currency: "aud",
      }),
    ).toBe(1000);
    expect(
      settledBaseCents({ cents: 1000 }),
    ).toBe(1000);
  });

  it("uses the captured base figure for a foreign row", () => {
    expect(
      settledBaseCents({
        cents: 500,
        currency: "gbp",
        cents_base: 980,
      }),
    ).toBe(980);
  });

  it("returns null, not the raw foreign figure, when unsettled", () => {
    expect(
      settledBaseCents({
        cents: 500,
        currency: "gbp",
      }),
    ).toBeNull();
  });

  it("nets refunds in the matching denomination", () => {
    expect(
      netBaseCents({
        cents: 1000,
        currency: "aud",
        refunded_cents: 250,
      }),
    ).toBe(750);
    expect(
      netBaseCents({
        cents: 500,
        currency: "gbp",
        cents_base: 1000,
        refunded_cents: 100,
        refunded_cents_base: 200,
      }),
    ).toBe(800);
  });
});

describe("sumBaseCents", () => {
  it("skips unknown rows and counts them", () => {
    expect(
      sumBaseCents([
        { cents: 1000, currency: "aud" },
        {
          cents: 500,
          currency: "gbp",
          cents_base: 980,
        },
        { cents: 500, currency: "gbp" },
      ]),
    ).toEqual({ total: 1980, unknownCount: 1 });
  });

  it("handles empty input", () => {
    expect(sumBaseCents(null)).toEqual({
      total: 0,
      unknownCount: 0,
    });
  });
});

describe("formatMoneyWithBase", () => {
  it("shows only the charged figure for base rows", () => {
    expect(
      formatMoneyWithBase({
        cents: 6800,
        currency: "aud",
      }),
    ).toEqual({
      charged: "$68",
    });
  });

  it("adds a ticker-prefixed base figure once settled", () => {
    expect(
      formatMoneyWithBase({
        cents: 3500,
        currency: "gbp",
        cents_base: 6800,
      }),
    ).toEqual({
      charged: "GBP £35",
      converted: "AUD $68",
    });
  });

  it("omits the converted figure when unsettled", () => {
    expect(
      formatMoneyWithBase({
        cents: 3500,
        currency: "gbp",
      }),
    ).toEqual({
      charged: "GBP £35",
    });
  });
});

/******************************
 * Detection
 */
describe("currency detection", () => {
  it("maps timezones, longest prefix first", () => {
    expect(
      currencyFromTimezone("Australia/Adelaide"),
    ).toBe("aud");
    expect(
      currencyFromTimezone("Pacific/Auckland"),
    ).toBe("nzd");
    expect(
      currencyFromTimezone("Europe/London"),
    ).toBe("gbp");
    expect(
      currencyFromTimezone(
        "America/Indiana/Indianapolis",
      ),
    ).toBe("usd");
    expect(
      currencyFromTimezone("Europe/Berlin"),
    ).toBeNull();
    expect(
      currencyFromTimezone(undefined),
    ).toBeNull();
  });

  it("maps locale regions", () => {
    expect(currencyFromLocale("en-GB")).toBe(
      "gbp",
    );
    expect(currencyFromLocale("zh-Hans-NZ")).toBe(
      "nzd",
    );
    expect(currencyFromLocale("de")).toBeNull();
  });
});

describe("stored currency", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("round-trips a supported currency and ignores junk", () => {
    storeCurrency("gbp");
    expect(readStoredCurrency()).toBe("gbp");
    window.localStorage.setItem(
      "preferred_currency",
      "jpy",
    );
    expect(readStoredCurrency()).toBeNull();
  });

  it("survives storage throwing", () => {
    vi.spyOn(
      Storage.prototype,
      "getItem",
    ).mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readStoredCurrency()).toBeNull();
  });
});

describe("formatCurrencyOption", () => {
  it("shows the ticker closed and the label open", () => {
    const option = {
      value: "gbp",
      label: CURRENCIES.gbp.label,
    };
    expect(
      formatCurrencyOption(option, {
        context: "value",
      }),
    ).toBe("GBP");
    expect(
      formatCurrencyOption(option, {
        context: "menu",
      }),
    ).toBe(CURRENCIES.gbp.label);
  });
});
