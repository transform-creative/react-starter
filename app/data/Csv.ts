/******************************
 * csvCell
 * Escapes one value for CSV. Quotes cells containing commas, quotes or line
 * breaks, and prefixes cells starting with = + - @ so Excel/Sheets never run
 * user-supplied text as a formula (CSV injection). Numbers are left alone.
 */
export function csvCell(value: unknown): string {
  if (value == null) return "";
  let text = String(value);
  if (
    typeof value !== "number" &&
    /^[=+\-@\t\r]/.test(text)
  )
    text = `'${text}`;
  return /[",\r\n]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

/******************************
 * toCsv
 * Builds a CSV string from a header row and data rows (CRLF line endings).
 */
export function toCsv(
  headers: string[],
  rows: unknown[][],
): string {
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

/******************************
 * downloadCsv
 * Triggers a browser download of a CSV. A BOM is added so Excel reads UTF-8.
 */
export function downloadCsv(
  filename: string,
  csv: string,
) {
  const url = URL.createObjectURL(
    new Blob(["﻿", csv], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
