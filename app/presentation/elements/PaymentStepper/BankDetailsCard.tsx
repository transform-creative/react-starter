import { useState } from "react";
import { Icon } from "../Icon";

export interface BankDetailsCardProps {
  bankDetails: { name: string; bsb: string; account: string };
  /** Optional disclaimer text shown beneath the bank details. */
  disclaimer?: string;
}

/******************************
 * BankDetailsCard component
 * Displays bank transfer details in a formatted card with copy-to-clipboard
 * functionality for each field. Includes a disclaimer about direct transfers.
 */
export function BankDetailsCard({
  bankDetails,
  disclaimer,
}: BankDetailsCardProps) {
  const [copied, setCopied] = useState<string | null>(null);

  /***********************************
   * Copies a value to the clipboard and shows a brief confirmation
   */
  function handleCopy(value: string, key: string) {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const rows: { label: string; value: string; key: string }[] = [
    { label: "Name:", value: bankDetails.name, key: "name" },
    { label: "BSB", value: bankDetails.bsb, key: "bsb" },
    {
      label: "Account number",
      value: bankDetails.account,
      key: "account",
    },
  ];

  return (
    <div className="col gap-10">
      <h3>Give by electronic transfer</h3>
      <div
        className="col outline-secondary r-default"
        style={{ overflow: "hidden" }}
      >
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="row between middle p-10"
            style={{
              borderBottom:
                i < rows.length - 1
                  ? "1px solid var(--accent-md)"
                  : undefined,
            }}
          >
            <h4 style={{ minWidth: 120 }}>{row.label}</h4>
            <div className="row middle gap-10">
              <p style={{}}>{row.value}</p>
              <Icon
                name={
                  copied === row.key
                    ? "checkmark-circle-outline"
                    : "copy-outline"
                }
                size={14}
                color={
                  copied === row.key ? "var(--safe)" : "var(--txt)"
                }
                onClick={() => handleCopy(row.value, row.key)}
              />
            </div>
          </div>
        ))}
      </div>
      {disclaimer && (
        <div className="col gap-10 mt-5 boxed p-10">
          <p style={{ color: "var(--accent-high)", lineHeight: 1.5 }}>
            {disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
