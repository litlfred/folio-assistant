/**
 * Core's fill of the `tabular-csvw` pipeline slot (bean `urat`): routing by
 * sniffed content, `null` for anything this reader does not take, and the
 * `pipeline-plugins/` node naming an export that exists.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { TABULAR_CSVW_SCHEMA_ID } from "@litlfred/cat-harness-tools/schemas/library/tabular-csvw.js";
import * as slots from "./plugin-slots.ts";

const { extract } = slots.PIPELINE_IMPLEMENTATIONS["tabular-csvw"];

describe("tabular-csvw", () => {
  it("reads text with no magic bytes as delimited text", () => {
    const r = extract(Buffer.from("name,age\nada,36\nalan,41\n"), { url: "p.csv", docId: "p", mimetype: null });
    expect(r?.$schema).toBe(TABULAR_CSVW_SCHEMA_ID);
    expect(JSON.stringify(r)).toContain("p.csv");
  });

  it("is null for text that does not split into a table", () => {
    expect(extract(Buffer.from("just a line of prose\n"), { url: "a.txt", docId: "a", mimetype: null })).toBeNull();
  });

  it("is null for a declared workbook that is not one, rather than throwing", () => {
    expect(extract(Buffer.from("not a zip"), { url: "b.xlsx", docId: "b", mimetype: slots.XLSX_MIMETYPE })).toBeNull();
  });

  it("is null for a mimetype it has no reader for (an OpenDocument spreadsheet)", () => {
    const ods = "application/vnd.oasis.opendocument.spreadsheet";
    expect(extract(Buffer.from("PK"), { url: "c.ods", docId: "c", mimetype: ods })).toBeNull();
  });

  it("the pipeline-plugins node names this table", () => {
    const node = JSON.parse(readFileSync(join(import.meta.dir, "..", "pipeline-plugins", "tabular-csvw.json"), "utf-8"));
    expect(node.slot).toBe("tabular-csvw");
    const [file, name] = String(node.implementation).split("#");
    expect(file).toBe("pipeline/plugin-slots.ts");
    expect(name in slots).toBe(true);
  });
});
