/**
 * The editor-checkers this instance declares (bean folio-assistant-4dx7):
 * - each node passes its validator;
 * - each code ref resolves to an exported function;
 * - the typology, validator and directory are declared together.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { EditorCheckerNodeSchema, codeRefs } from "./editor-checker";

const SCI = join(import.meta.dir, "..");
const declaration = JSON.parse(readFileSync(join(SCI, "folio-assistant-sci.json"), "utf8")) as {
  name: string;
  contentAdapters: { contentType: string }[];
  directories: { path: string; graphTypologies: string[] }[];
};
const dirOf = (typology: string) => declaration.directories.find((d) => d.graphTypologies.includes(typology))?.path;
const nodes = readdirSync(join(SCI, "editor-checkers"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ file: f, node: JSON.parse(readFileSync(join(SCI, "editor-checkers", f), "utf8")) }));

describe("editor-checkers", () => {
  test("are declared: the directory, its typology node and its validator node", () => {
    expect(dirOf("editor-checkers")).toBe("editor-checkers/");
    const kind = JSON.parse(readFileSync(join(SCI, dirOf("typologies")!, "editor-checkers.json"), "utf8"));
    expect(kind.kind).toBe("editor-checkers");
    expect(Object.keys(kind.nodeSchemas)).toEqual(["folio-editor-checker/v1"]);
    const v = JSON.parse(readFileSync(join(SCI, dirOf("validators")!, "editor-checker.json"), "utf8"));
    expect(v.validates).toEqual({ kind: "editor-checkers", family: "folio-editor-checker/v1" });
    expect(v.schema).toBe(`${declaration.name}:schemas/editor-checker.ts#EditorCheckerKind`);
  });

  test("there is at least one, and each passes its schema", () => {
    expect(nodes.length).toBeGreaterThan(0);
    for (const { file, node } of nodes) {
      const r = EditorCheckerNodeSchema.safeParse(node);
      expect({ file, ok: r.success, issues: r.success ? [] : r.error.issues }).toEqual({ file, ok: true, issues: [] });
      expect(file).toBe(`${node.id}.json`);
    }
  });

  test("each serves a content type this instance declares an adapter for", () => {
    const types = new Set(declaration.contentAdapters.map((a) => a.contentType));
    for (const { node } of nodes) expect(types.has(node.contentType)).toBe(true);
  });

  test("each code ref resolves to an exported function", async () => {
    for (const { node } of nodes) {
      for (const ref of codeRefs(EditorCheckerNodeSchema.parse(node))) {
        const [path, name] = ref.split("#") as [string, string];
        const mod = await import(join(SCI, path));
        expect({ ref, type: typeof mod[name] }).toEqual({ ref, type: "function" });
      }
    }
  });

  test("the schema refuses a path that climbs out of the instance", () => {
    const bad = { ...nodes[0]!.node, check: "../cat-harness-tools/x.ts#f" };
    expect(EditorCheckerNodeSchema.safeParse(bad).success).toBe(false);
  });
});
