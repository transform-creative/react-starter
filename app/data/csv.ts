import { DateTime } from "luxon";

/******************************
 * CSV serialisation + browser download for admin exports (finance tab,
 * people lists, etc). `toCsv` is pure (no DOM) so escaping is testable.
 */

/** One output column: a header and a getter run against each row. */
export interface CsvColumn<T> {
  header: string;
  value: (
    row: T,
  ) =>
    | string
    | number
    | boolean
    | null
    | undefined;
}

/**
 * Excel only reads a CSV as UTF-8 when it starts with a byte order mark;
 * without it, accented names arrive garbled.
 */
const BOM = "﻿";

/**
 * Neutralise a value Excel would evaluate as a formula. User-entered text
 * ends up in a spreadsheet an admin opens, so a leading =, +, -, @, tab or CR
 * gets an apostrophe. Numbers are ours and never touched.
 */
function neutraliseFormula(text: string): string {
  if (/^[=+\-@\t\r]/.test(text))
    return `'${text}`;
  return text;
}

/**
 * Quote a field per RFC 4180. Leading/trailing spaces are quoted too so they
 * survive a round trip through Excel.
 */
function escapeField(
  value:
    | string
    | number
    | boolean
    | null
    | undefined,
): string {
  if (value === null || value === undefined)
    return "";

  const raw =
    typeof value === "string"
      ? neutraliseFormula(value)
      : String(value);

  if (
    /[",\r\n]/.test(raw) ||
    raw !== raw.trim()
  ) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

/******************************
 * Build a CSV document from rows and a column spec. Always emits the header
 * row, so an empty export still opens as a valid, self-describing file.
 */
export function toCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
): string {
  const lines = [
    columns
      .map((c) => escapeField(c.header))
      .join(","),
    ...rows.map((row) =>
      columns
        .map((c) => escapeField(c.value(row)))
        .join(","),
    ),
  ];

  return BOM + lines.join("\r\n");
}

/******************************
 * Date-stamp an export's name so repeated downloads don't overwrite each other.
 */
export function csvFileName(
  base: string,
  now: DateTime = DateTime.now(),
): string {
  return `${base}-${now.toFormat("yyyy-MM-dd")}.csv`;
}

/******************************
 * Save a CSV string to the user's downloads. The anchor must be in the
 * document before it is clicked for Firefox to honour it.
 */
export function downloadCsv(
  fileName: string,
  csv: string,
): void {
  const url = URL.createObjectURL(
    new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    }),
  );

  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
