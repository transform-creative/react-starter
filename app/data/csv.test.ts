import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { toCsv, csvFileName } from "./csv";

type Row = { name: string | null; cents: number };
const COLUMNS = [
  { header: "Name", value: (r: Row) => r.name },
  { header: "Cents", value: (r: Row) => r.cents },
];

/******************************
 * toCsv — escaping and formula-injection guard
 */
describe("toCsv", () => {
  it("starts with a BOM and always emits the header row", () => {
    const csv = toCsv<Row>([], COLUMNS);
    expect(csv).toBe("﻿Name,Cents");
  });

  it("quotes commas, quotes and newlines", () => {
    const csv = toCsv<Row>(
      [{ name: 'A "B", C\nD', cents: 5 }],
      COLUMNS,
    );
    expect(csv).toContain('"A ""B"", C\nD",5');
  });

  it("neutralises formula-leading text but not numbers", () => {
    const csv = toCsv<Row>(
      [
        { name: '=HYPERLINK("x")', cents: -5 },
        { name: "@sum", cents: 1 },
      ],
      COLUMNS,
    );
    expect(csv).toContain("\"'=HYPERLINK(");
    expect(csv).toContain("'@sum,1");
    expect(csv).toContain(",-5");
  });

  it("writes null as an empty field and preserves padded spaces", () => {
    const csv = toCsv<Row>(
      [
        { name: null, cents: 1 },
        { name: " x ", cents: 2 },
      ],
      COLUMNS,
    );
    expect(csv).toContain('\r\n,1\r\n" x ",2');
  });
});

/******************************
 * csvFileName
 */
describe("csvFileName", () => {
  it("date-stamps the base name", () => {
    expect(
      csvFileName(
        "donations",
        DateTime.fromISO("2026-10-01"),
      ),
    ).toBe("donations-2026-10-01.csv");
  });
});
