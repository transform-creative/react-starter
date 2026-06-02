import { logError } from "~/database/Auth";

export const CONTACT = {
  devEmail: "support@transformcreative.com.au",
  orgEmail: "hello@example.com",
};

export function isMobileBrowser() {
  const userAgent =
    typeof window === "undefined" || typeof window.navigator === "undefined"
      ? ""
      : navigator.userAgent;
  return /iPhone|iPad|iPod|Android/i.test(userAgent);
}

/******************************************
 * Format a number with thousands separators (e.g. 12345 → "12,345").
 * Non-finite values return "0" so we never render "NaN" / "Infinity" to users.
 */
export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US", options);
}

/******************************************
 * Format a dollar amount (no `$` prefix) with grouping and fixed decimals.
 * e.g. 12345.6 → "12,345.60" (decimals=2) or "12,346" (decimals=0).
 */
export function formatDollars(
  value: number | null | undefined,
  decimals: number = 2,
): string {
  return formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/******************************************
 * Format a cents amount as dollars (no `$` prefix) with grouping.
 * e.g. 1234500 → "12,345.00".
 */
export function formatCents(
  cents: number | null | undefined,
  decimals: number = 2,
): string {
  return formatDollars((Number(cents) || 0) / 100, decimals);
}

/******************************************
 * Copy text to clipboard. Returns true on success, false on failure.
 */
export async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    logError("Could not copy", ["copyToClipboard"]);
    return false;
  }
}
