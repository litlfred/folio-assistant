/**
 * Every file bootstrap-tools writes into bootstrap says so, and names
 * bootstrap-tools as the writer (owner, 2026-09-30, bean `xsqm`).
 *
 * The set is DERIVED from what is on disk, per kind, not listed file by file:
 * a new schema or a new diagram's picture is covered without an edit here,
 * and one that lacks the note fails.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { GENERATED_BY, TOOLS_REPOSITORY } from "./generated-by.ts";

const BOOTSTRAP = join(import.meta.dir, "..", "..", "bootstrap");
const inDir = (dir: string, ext: string) =>
  readdirSync(join(BOOTSTRAP, dir))
    .filter((f) => f.endsWith(ext))
    .map((f) => join(dir, f));

const GENERATED: Array<{ kind: string; files: string[] }> = [
  { kind: "published JSON Schemas", files: inDir("schemas", ".schema.json") },
  { kind: "the drawn schema page", files: ["schemas/README.md"] },
  { kind: "the vocabulary", files: ["ns.jsonld"] },
  { kind: "each Process's picture", files: inDir("processes", ".svg") },
];

describe("every generated file in bootstrap names bootstrap-tools as its writer", () => {
  for (const { kind, files } of GENERATED) {
    test(`${kind} (${files.length})`, () => {
      expect(files.length).toBeGreaterThan(0); // not vacuous
      const missing = files.filter((f) => !readFileSync(join(BOOTSTRAP, f), "utf-8").includes(GENERATED_BY));
      expect(missing).toEqual([]);
    });
  }

  test("the vocabulary also says it in RDF: prov:wasAttributedTo the tools repository", () => {
    const doc = JSON.parse(readFileSync(join(BOOTSTRAP, "ns.jsonld"), "utf-8")) as Record<string, unknown>;
    expect(doc["wasAttributedTo"]).toBe(TOOLS_REPOSITORY);
  });

  test("an AUTHORED file does not claim to be generated", () => {
    const authored = [...inDir("processes", ".bpmn"), "bootstrap.json", "README.md"];
    const claiming = authored.filter((f) => readFileSync(join(BOOTSTRAP, f), "utf-8").includes(GENERATED_BY));
    expect(claiming).toEqual([]);
  });
});
