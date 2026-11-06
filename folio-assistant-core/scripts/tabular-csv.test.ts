/**
 * tabular-csv and the column classifier it shares with tabular-xlsx (bean
 * `eief`). Each test pins one rule from the `tabular-metadata` skill.
 */
import { describe, expect, it } from "bun:test";

import { TabularCsvwTablesSchema, toCsvw } from "@litlfred/cat-harness-tools/schemas/library/tabular-csvw.js";
import { classifyColumn, columnNames, firstRowIsHeader } from "./tabular-columns.js";
import { extractCsv, NotATableError, parseDelimited, sniffDelimiter } from "./tabular-csv.js";

const opts = { url: "comments.csv", docId: "comments" };

// The shape of a public-comment export (schemas/public-comment.ts): an id, the
// section commented on, free text with commas and quotes, and a date.
const COMMENTS = [
  "id,section,comment,submitted,votes",
  '1,2.1,"Agree, with one caveat",2026-03-01,4',
  '2,2.3,"The term ""registry"" is undefined",2026-03-02,0',
  "3,3.1,Fine as is,2026-03-04,12",
  "",
].join("\r\n");

describe("parseDelimited (RFC 4180)", () => {
  it("handles quoted delimiters, doubled quotes, CRLF, and a newline inside a field", () => {
    expect(parseDelimited('a,"b,c","say ""hi"""\r\n"multi\nline",x,y\n', ",")).toEqual([
      ["a", "b,c", 'say "hi"'],
      ["multi\nline", "x", "y"],
    ]);
  });

  it("drops a UTF-8 BOM, and a trailing newline is not an extra record", () => {
    expect(parseDelimited("﻿a,b\n1,2\n", ",")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("routing is a content question", () => {
  it("finds the delimiter the rows agree on", () => {
    expect(sniffDelimiter("a;b;c\n1;2;3\n")).toBe(";");
    expect(sniffDelimiter("a\tb\n1\t2\n")).toBe("\t");
    expect(sniffDelimiter(COMMENTS)).toBe(",");
  });

  it("refuses a file whose rows split into one field: not shown to be a table", () => {
    expect(() => sniffDelimiter("just a line\nand another\n")).toThrow(NotATableError);
  });

  it("refuses when two delimiters agree on DIFFERENT widths, rather than picking one", () => {
    // Decimal commas in a semicolon file: ',' sees 3 fields, ';' sees 2.
    expect(() => sniffDelimiter("1,5;2,5\n3,5;4,5\n")).toThrow(/ambiguous/);
  });
});

describe("classifyColumn: never guess a datatype", () => {
  it("1, 2, 3, N/A is NOT an integer column", () => {
    expect(classifyColumn(["1", "2", "3", "N/A"])).toEqual({ datatype: "any", datatypeSource: "undetermined" });
  });

  it("integers with decimals widen to decimal, measured", () => {
    expect(classifyColumn(["1", "2.5", "-3"])).toEqual({ datatype: "decimal", datatypeSource: "measured" });
  });

  it("text is a reading, not a fallback", () => {
    expect(classifyColumn(["Agree", "Disagree"])).toEqual({ datatype: "string", datatypeSource: "measured" });
  });

  it("an empty value is absence, not evidence; an all-empty column is undetermined", () => {
    expect(classifyColumn(["2026-01-01", "", " "])).toEqual({ datatype: "date", datatypeSource: "measured" });
    expect(classifyColumn(["", ""])).toEqual({ datatype: "any", datatypeSource: "undetermined" });
  });

  it("zero-padded digit strings are codes: string, never integer (urat)", () => {
    expect(classifyColumn(["008", "012", "971"])).toEqual({ datatype: "string", datatypeSource: "measured" });
    expect(classifyColumn(["008", "1.5"])).toEqual({ datatype: "any", datatypeSource: "undetermined" });
    expect(classifyColumn(["0", "10", "0.5"])).toEqual({ datatype: "decimal", datatypeSource: "measured" });
  });

  it("dates mixed with integers do not widen", () => {
    expect(classifyColumn(["2026-01-01", "7"])).toEqual({ datatype: "any", datatypeSource: "undetermined" });
  });
});

describe("header and names", () => {
  it("a first row of numbers over a numeric column is data, not a header", () => {
    expect(firstRowIsHeader(["2024", "2025"], [["1", "2"], ["3", "4"]])).toBe(false);
    expect(firstRowIsHeader(["year", "count"], [["2024", "2"]])).toBe(true);
  });

  it("an empty or repeated title cell means row 1 is data", () => {
    expect(firstRowIsHeader(["a", ""], [["x", "y"]])).toBe(false);
    expect(firstRowIsHeader(["a", "a"], [["x", "y"]])).toBe(false);
  });

  it("names are tokens, unique, and CSVW's _col.N when there is no title", () => {
    expect(columnNames(["Submitted on", "", "a", "a"])).toEqual(["Submitted_on", "_col.2", "a", "a_2"]);
  });
});

describe("extractCsv", () => {
  it("reads a public-comment export into a valid record", () => {
    const r = extractCsv(COMMENTS, opts);
    expect(TabularCsvwTablesSchema.safeParse(r).success).toBe(true);
    const t = r.tables[0]!;
    expect(t.tableSchema.columns.map((c) => [c.name, c.datatype, c.datatypeSource])).toEqual([
      ["id", "integer", "measured"],
      ["section", "decimal", "measured"],
      ["comment", "string", "measured"],
      ["submitted", "date", "measured"],
      ["votes", "integer", "measured"],
    ]);
    expect(t["fac:headerRow"]).toBe(1);
    expect(t["fac:extent"]).toEqual({ rows: 3, columns: 5, source: "measured" });
  });

  it("a CSV's sheet and cell are a DETERMINED null, and its table starts at row 1, column 1", () => {
    expect(extractCsv(COMMENTS, opts).tables[0]!["fac:anchor"]).toEqual({ sheet: null, cell: null, row: 1, column: 1 });
  });

  it("is never a stub: no fac:stub, and columns are present", () => {
    const t = extractCsv(COMMENTS, opts).tables[0]!;
    expect(t["fac:stub"]).toBeUndefined();
    expect(t.tableSchema.columns.length).toBeGreaterThan(0);
  });

  it("a headerless numeric table gets headerRow null and _col.N names", () => {
    const t = extractCsv("1,2\n3,4\n", opts).tables[0]!;
    expect(t["fac:headerRow"]).toBeNull();
    expect(t.tableSchema.columns.map((c) => c.name)).toEqual(["_col.1", "_col.2"]);
    expect(t["fac:extent"]).toEqual({ rows: 2, columns: 2, source: "measured" });
  });

  it("ragged rows past the probe make the extent undetermined: BOTH null, never half-known", () => {
    const head = Array.from({ length: 25 }, (_, i) => `${i},x`).join("\n");
    const t = extractCsv(`a,b\n${head}\n99,x,extra\n`, opts).tables[0]!;
    expect(t["fac:extent"]).toEqual({ rows: null, columns: null, source: "undetermined" });
  });

  it("the derived CSVW carries no key of ours", () => {
    const csvw = toCsvw(extractCsv(COMMENTS, opts));
    expect(JSON.stringify(csvw)).not.toContain("fac:");
    expect(JSON.stringify(csvw)).not.toContain("datatypeSource");
  });
});
