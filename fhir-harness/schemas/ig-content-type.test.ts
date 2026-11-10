/**
 * `contentTypes.ig`: the IG marker, and the paths it declares.
 *
 * Calibrated: making `igDeclares` return `true` for every path fails the
 * "not declared" tests, and dropping the `include` check in `parseIgSection`
 * fails the "a bare section declares nothing" test.
 */
import { afterAll, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ContentTypeRegistry, describeRepository } from "@litlfred/cat-harness-tools/schemas/content/content-type.js";
import {
  IG_INDEX_SECTION,
  IG_TYPE,
  assertIgDeclares,
  igDeclares,
  parseIgSection,
  readIgSection,
  registerIgContentType,
} from "./ig-content-type";

const dirs: string[] = [];
function repo(index: unknown): string {
  const d = mkdtempSync(join(tmpdir(), "ig-content-type-"));
  dirs.push(d);
  writeFileSync(join(d, "index.config.json"), typeof index === "string" ? index : JSON.stringify(index));
  return d;
}
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

const declared = { include: ["sushi-config.yaml", "input/fsh/", "input/pagecontent/"] };

describe("the ig marker", () => {
  it("registeredAsIndexSection", () => {
    const r = new ContentTypeRegistry();
    registerIgContentType(r);
    expect(r.get("ig")?.filename).toEqual({ indexSection: IG_INDEX_SECTION });
    registerIgContentType(r); // a diamond registers it twice
    expect(r.ids()).toEqual(["ig"]);
  });

  it("contentTypesIgMarksAnIg", () => {
    const r = new ContentTypeRegistry();
    registerIgContentType(r);
    const yes = describeRepository(repo({ contentTypes: { ig: declared } }), r);
    expect(yes.types.map((t) => [t.id, t.type, t.marker])).toEqual([["ig", IG_TYPE, "index.config.json#contentTypes.ig"]]);
    expect(describeRepository(repo({ contentTypes: { other: {} } }), r).types).toEqual([]);
  });

  it("sushiConfigAloneIsNotIg", () => {
    const r = new ContentTypeRegistry();
    registerIgContentType(r);
    const d = repo({});
    writeFileSync(join(d, "sushi-config.yaml"), "id: example\n");
    expect(describeRepository(d, r).types).toEqual([]);
  });
});

describe("the section declares what the harness reads", () => {
  const s = { include: declared.include };

  it("coversDeclaredFilesAndDirs", () => {
    expect(igDeclares(s, "sushi-config.yaml")).toBe(true);
    expect(igDeclares(s, "input/fsh/profiles/a.fsh")).toBe(true);
    expect(igDeclares(s, "./input/pagecontent/index.md")).toBe(true);
    expect(igDeclares(s, "input/fsh")).toBe(true);
  });

  it("doesNotCoverUndeclared", () => {
    expect(igDeclares(s, "input/images/logo.png")).toBe(false);
    expect(igDeclares(s, "input/fshx/a.fsh")).toBe(false);
    expect(igDeclares(s, "sushi-config.yaml.bak")).toBe(false);
    expect(() => assertIgDeclares(s, "README.md")).toThrow(/not declared in contentTypes\.ig\.include/);
  });

  it("bareSectionDeclaresNothing", () => {
    expect(parseIgSection({})).toEqual({ problems: [expect.stringMatching(/include is missing/)] });
    expect(parseIgSection({ include: [] })).toEqual({ problems: [expect.stringMatching(/include is empty/)] });
  });

  it("refusesEscapingOrAmbiguousEntries", () => {
    const r = parseIgSection({ include: ["/etc/x", "../other/", "input//fsh/", "input\\fsh", "ok/"] });
    expect("problems" in r && r.problems.length).toBe(4);
  });

  it("readsSectionFromIndexConfig", () => {
    expect(readIgSection(repo({ contentTypes: { ig: declared } }))).toEqual({ section: declared });
    expect(readIgSection(repo({ contentTypes: {} }))).toBeUndefined();
    expect(readIgSection(repo("{ not json"))).toEqual({ problems: [expect.stringMatching(/does not parse/)] });
  });
});
