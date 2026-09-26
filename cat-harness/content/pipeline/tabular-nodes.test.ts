/**
 * A tabular source becomes graph nodes — bean `p67i`, shape from `jg8s`.
 *
 * The property under test is the owner's rule: **a sheet node appears iff the
 * SOURCE has sheets.** Not iff there are two or more — a one-sheet workbook
 * still has a sheet, and a CSV has none however many rows it holds.
 *
 * Verified against real ingested output as well as these fixtures: a real CSV
 * and a real two-sheet `.xlsx`, both run through `tabular-records.py`, gave
 * `manifest → table` and `manifest → sheet → table` respectively.
 *
 * @module content/pipeline/tabular-nodes.test
 */
import { describe, expect, test } from "bun:test";

import {
  SHEETED_FORMATS,
  buildTabularNodes,
  tabularShapeOf,
} from "./tabular-nodes.ts";

const iri = (rest: string) => `library/x/${rest}`;
const build = (shape: Parameters<typeof buildTabularNodes>[0]) =>
  Object.fromEntries(
    buildTabularNodes(shape, { title: "X", iri }).map((n) => [n.path, JSON.parse(n.content)]),
  );

const CSV_RECORD = {
  $schema: "folio-tabular-records/v1",
  format: "csv",
  sheets: [{ name: "coverage", headers: ["country", "iso3"] }],
};
const XLSX_RECORD = {
  $schema: "folio-tabular-records/v1",
  format: "xlsx",
  sheets: [
    { name: "Coverage", headers: ["country"] },
    { name: "Notes", headers: ["note"] },
  ],
};

describe("a sheet node appears IFF the source has sheets", () => {
  test("a CSV gets NO sheet — inventing one is the lie this rejects", () => {
    // `schemas/tabular-csvw.ts` already decided this a level down, setting
    // `fac:anchor.sheet` to null for a CSV: "a CSV genuinely has no sheet, and
    // writing `Sheet1` would invent one."
    const nodes = build({ hasSheets: false, sheets: [{ name: "coverage", headers: ["a"] }] });
    expect(Object.keys(nodes).sort()).toEqual(["blocks/table-001.jsonld", "manifest.jsonld"]);
    expect(nodes["manifest.jsonld"].contains).toEqual(["library/x/blocks/table-001"]);
  });

  test("a ONE-sheet workbook still gets its sheet", () => {
    // The case that separates "has sheets" from "has more than one". A
    // single-sheet workbook genuinely has a sheet, and discarding it would be
    // the opposite lie to the one above.
    const nodes = build({ hasSheets: true, sheets: [{ name: "Coverage", headers: ["a"] }] });
    expect(Object.keys(nodes).sort()).toEqual([
      "blocks/table-001.jsonld",
      "manifest.jsonld",
      "sheets/sheet-001.jsonld",
    ]);
    expect(nodes["manifest.jsonld"].contains).toEqual(["library/x/sheets/sheet-001"]);
    expect(nodes["sheets/sheet-001.jsonld"].contains).toEqual(["library/x/blocks/table-001"]);
  });

  test("a multi-sheet workbook nests each one, in order", () => {
    const nodes = build({
      hasSheets: true,
      sheets: [
        { name: "Coverage", headers: ["a"] },
        { name: "Notes", headers: ["b"] },
      ],
    });
    expect(nodes["manifest.jsonld"].contains).toEqual([
      "library/x/sheets/sheet-001",
      "library/x/sheets/sheet-002",
    ]);
    expect(nodes["sheets/sheet-002.jsonld"].title).toBe("Notes");
  });

  test("a sheet's `contains` is a LIST even at length one", () => {
    // `fac:anchor` exists because a sheet may hold several tables. A scalar
    // here would have to be widened the first time one does.
    const nodes = build({ hasSheets: true, sheets: [{ name: "S", headers: [] }] });
    expect(Array.isArray(nodes["sheets/sheet-001.jsonld"].contains)).toBe(true);
  });

  test("the depth is RECORDED, so a consumer need not infer it", () => {
    // A consumer that guesses the depth from the shape it happens to receive
    // breaks on the first source of the other kind.
    expect(build({ hasSheets: false, sheets: [{ name: "c", headers: [] }] })["manifest.jsonld"].meta.tabular_depth).toBe("table");
    expect(build({ hasSheets: true, sheets: [{ name: "S", headers: [] }] })["manifest.jsonld"].meta.tabular_depth).toBe("sheet");
  });

  test("headers reach the block — the findable surface", () => {
    // `p67i`: "a grep for a column header finds the dataset that has it".
    const nodes = build({ hasSheets: false, sheets: [{ name: "c", headers: ["country", "iso3"] }] });
    expect(nodes["blocks/table-001.jsonld"].headers).toEqual(["country", "iso3"]);
    expect(nodes["blocks/table-001.jsonld"].kind).toBe("table");
  });
});

describe("either record reduces to the same shape — two readers, on purpose", () => {
  test("`folio-tabular-records/v1`: format decides, not sheet count", () => {
    expect(tabularShapeOf(CSV_RECORD)?.hasSheets).toBe(false);
    expect(tabularShapeOf(XLSX_RECORD)?.hasSheets).toBe(true);
    // A one-sheet xlsx is still sheeted.
    expect(tabularShapeOf({ ...XLSX_RECORD, sheets: [XLSX_RECORD.sheets[0]] })?.hasSheets).toBe(true);
  });

  test("`folio-tabular-csvw/v1`: `fac:anchor.sheet` decides", () => {
    // CSVW itself cannot say whether the source had sheets — in CSVW the table
    // IS the file. `fac:anchor` was added for exactly this, and its `sheet` is
    // a determined null for a CSV.
    const csvw = (sheet: string | null) => ({
      $schema: "folio-tabular-csvw/v1",
      tables: [
        {
          url: "x.csv",
          tableSchema: { columns: [{ name: "country", titles: "country" }] },
          "fac:anchor": { sheet, cell: null, row: 1, column: 1 },
        },
      ],
    });
    expect(tabularShapeOf(csvw(null))?.hasSheets).toBe(false);
    expect(tabularShapeOf(csvw("Sheet1"))?.hasSheets).toBe(true);
    expect(tabularShapeOf(csvw(null))?.sheets[0].headers).toEqual(["country"]);
  });

  test("an unrecognised record is UNDEFINED, never an empty document", () => {
    // "could not read it" and "it has no sheets" are different facts, and a
    // caller that cannot tell them apart reports a clean run over a file it
    // failed to parse.
    expect(tabularShapeOf({ $schema: "something-else/v1" })).toBeUndefined();
    expect(tabularShapeOf(null)).toBeUndefined();
    expect(tabularShapeOf({ $schema: "folio-tabular-records/v1" })).toBeUndefined();
  });

  test("a CSV is not in SHEETED_FORMATS, and the workbook formats are", () => {
    expect(SHEETED_FORMATS).not.toContain("csv");
    expect(SHEETED_FORMATS).toContain("xlsx");
    expect(SHEETED_FORMATS).toContain("ods");
  });
});

// ── the wiring exposed two things nothing could see while nothing called it ──

describe("every node is loadable JSON-LD", () => {
  // `@context` was missing while the emitter was unreached. Every other node
  // under `library/` carries it, and without it `kind`, `contains` and
  // `headers` stay bare strings to a loader.
  test("@context is on EVERY emitted node, not just the manifest", () => {
    const files = buildTabularNodes(
      { hasSheets: true, sheets: [{ name: "Coverage", headers: ["iso3"] }] },
      { iri: (r) => `library/d/${r}` },
    );
    expect(files.length).toBe(3); // block, sheet, manifest
    for (const f of files) {
      expect(JSON.parse(f.content)["@context"]).toBe(
        "https://litlfred.github.io/folio-assistant/ns/content/v1.jsonld",
      );
    }
  });
});

describe("the title comes from the record, or from nowhere", () => {
  test("`source.file` is the document's name", () => {
    const shape = tabularShapeOf({
      $schema: "folio-tabular-records/v1",
      format: "csv",
      source: { file: "coverage.csv" },
      sheets: [{ name: "coverage", headers: ["iso3"] }],
    });
    expect(shape?.title).toBe("coverage.csv");
  });

  test("a record with no `source.file` names nothing — the CALLER falls back", () => {
    // Not the entry id invented here: this module cannot know it, and a title
    // guessed at this level would be indistinguishable from one the record
    // actually carried.
    const shape = tabularShapeOf({
      $schema: "folio-tabular-records/v1",
      format: "csv",
      sheets: [{ name: "coverage", headers: ["iso3"] }],
    });
    expect(shape?.title).toBeUndefined();
  });

  test("CSVW carries no document title, and that is not an empty string", () => {
    const shape = tabularShapeOf({
      $schema: "folio-tabular-csvw/v1",
      tables: [{ url: "coverage.csv", tableSchema: { columns: [{ name: "iso3" }] } }],
    });
    expect(shape?.title).toBeUndefined();
  });
});
