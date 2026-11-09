/**
 * The formal-edge driver's pure parts. Running the extractor needs a Lean
 * toolchain and a built folio, so that half was measured on #1492's
 * 691-declaration qou cluster instead (172/172 of LeanArchitect's edges);
 * what is pinned here is everything the driver decides WITHOUT Lean.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import {
  IMPORTS_MARKER,
  TEMPLATE_PATH,
  builtModules,
  fillTemplate,
  parseRows,
  toIngestRecords,
} from "./formal-edges";

const TMP = join(import.meta.dir, "__test_formal_edges__");
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("the shipped template", () => {
  const tpl = readFileSync(TEMPLATE_PATH, "utf-8");

  test("templateHasMarkerOnce", () => {
    expect(tpl.split(IMPORTS_MARKER).length - 1).toBe(1);
  });

  test("templateReadsBothEnvVars", () => {
    expect(tpl).toContain('"FORMAL_EDGES_TAGGED"');
    expect(tpl).toContain('"FORMAL_EDGES_OUT"');
  });

  test("templateReportsMissingNames", () => {
    expect(tpl).toContain('("missing", Json.bool true)');
  });
});

describe("fillTemplate", () => {
  test("fillPutsOneImportPerModule", () => {
    const out = fillTemplate(`/- doc -/\n${IMPORTS_MARKER}\nimport Lean\n`, ["A.B", "C"]);
    expect(out).toBe("/- doc -/\nimport A.B\nimport C\nimport Lean\n");
  });

  test("fillRefusesNoMarker", () => {
    expect(() => fillTemplate("import Lean\n", ["A"])).toThrow(IMPORTS_MARKER);
  });
});

describe("builtModules", () => {
  test("builtModulesFromOleansSorted", () => {
    const lib = join(TMP, "proj", ".lake", "build", "lib", "lean");
    mkdirSync(join(lib, "QOU", "Mass"), { recursive: true });
    writeFileSync(join(lib, "QOU.olean"), "");
    writeFileSync(join(lib, "QOU", "Mass", "Tower.olean"), "");
    writeFileSync(join(lib, "QOU", "Mass", "Tower.ilean"), ""); // not a module
    expect(builtModules(join(TMP, "proj"))).toEqual(["QOU", "QOU.Mass.Tower"]);
  });

  test("unbuiltProjectHasNoModules", () => {
    expect(builtModules(join(TMP, "never-built"))).toEqual([]);
  });
});

describe("toIngestRecords", () => {
  const rows = parseRows(
    [
      '{"decl":"Q.b","kind":"theorem","type_deps":["Q.z","Q.a"],"value_deps":[]}',
      '{"decl":"Q.gone","missing":true}',
      '{"decl":"Q.a","kind":"def","type_deps":[],"value_deps":[]}',
      "",
    ].join("\n"),
  );

  test("missingDeclNeverEmptyRecord", () => {
    const { records, missing } = toIngestRecords(rows, []);
    expect(missing).toEqual(["Q.gone"]);
    expect(records.map((r) => r.decl)).toEqual(["Q.b", "Q.a"]);
  });

  test("depsSortedLeanPathCarried", () => {
    const { records } = toIngestRecords(rows, [{ decl: "Q.b", leanPath: "folio/p/b.lean" }]);
    expect(records[0]).toEqual({ decl: "Q.b", type_deps: ["Q.a", "Q.z"], value_deps: [], lean_path: "folio/p/b.lean" });
    expect(records[1]).toEqual({ decl: "Q.a", type_deps: [], value_deps: [] });
  });
});
