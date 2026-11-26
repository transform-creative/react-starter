import {
  formatMoney,
  formatMoneyWithBase,
  type BaseValueSource,
} from "~/data/Currency";

export interface MoneyAmountProps {
  /** As-charged amount in minor units of `currency`. */
  cents: number | null | undefined;
  /** ISO code, lower-case. Missing = base currency. */
  currency?: string | null;
  /** Settled base-currency equivalent, when captured. */
  centsBase?: number | null;
  /** Already-refunded amount, shown as a muted "refunded" line when > 0. */
  refundedCents?: number | null;
  align?: "left" | "right";
  className?: string;
}

/******************************
 * MoneyAmount component
 * Renders ONE payment's amount for tables, cards and modals: the as-charged
 * figure, the settled base equivalent beneath it for a foreign-currency
 * payment (`GBP £35` / `≈ AUD $68`), and a refunded line when relevant.
 * Stacks vertically so it fits a narrow table cell on a phone. Pure
 * presentational — no outlet context — so it works inside tables, portals and
 * modals alike.
 */
export function MoneyAmount({
  cents,
  currency,
  centsBase,
  refundedCents,
  align = "left",
  className = "",
}: MoneyAmountProps) {
  const row: BaseValueSource = {
    cents,
    currency,
    cents_base: centsBase,
  };
  const display = formatMoneyWithBase(row);
  const refunded =
    refundedCents && refundedCents > 0
      ? formatMoney(refundedCents, currency)
      : null;

  return (
    <div
      className={`col ${className}`}
      style={{
        textAlign: align,
        alignItems:
          align === "right"
            ? "flex-end"
            : "flex-start",
        minWidth: 0,
      }}
    >
      <p
        className="m0 bold"
        style={{ whiteSpace: "nowrap" }}
      >
        {display.charged}
      </p>
      {display.converted && (
        <p
          className="m0"
          style={{
            fontSize: "var(--text-xsm)",
            color: "var(--accent-lg)",
            whiteSpace: "nowrap",
          }}
          title="Settled amount in the base currency"
        >
          ≈ {display.converted}
        </p>
      )}
      {refunded && (
        <p
          className="m0"
          style={{
            fontSize: "var(--text-xsm)",
            color: "var(--danger)",
            whiteSpace: "nowrap",
          }}
        >
          {refunded} refunded
        </p>
      )}
    </div>
  );
}
