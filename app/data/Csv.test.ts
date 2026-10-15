import { csvCell, toCsv } from "~/data/Csv";

/******************************
 * CSV helper tests
 */
describe("csvCell", () => {
  it("handles null and plain values", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell("abc")).toBe("abc");
    expect(csvCell(-5)).toBe("-5");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it("neutralises formula injection", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(
      '"\'=HYPERLINK(""x"")"',
    );
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
});

describe("toCsv", () => {
  it("joins header and rows with CRLF", () => {
    expect(toCsv(["a", "b"], [[1, "x,y"]])).toBe(
      'a,b\r\n1,"x,y"',
    );
  });
});
