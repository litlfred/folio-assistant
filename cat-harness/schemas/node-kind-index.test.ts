import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { GraphTypologyRegistry } from "./graph-typology-registry";
import { kindAndSubclasses, newUnkinded, nodeKindIndex } from "./node-kind-index";

/**
 * Issue #2195: node kinds are found THROUGH the typologies. A module of kinds
 * is written beside this file (not in the OS temp directory) so its `zod`
 * import resolves to the checkout's.
 */
const dir = mkdtempSync(join(import.meta.dir, ".tmp-node-kind-index-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));
writeFileSync(
  join(dir, "kinds.ts"),
  `import { z } from "zod";
import { nodeKind } from ${JSON.stringify(join(import.meta.dir, "node-kind.ts"))};
export const Base = nodeKind("base/v1", [], { a: z.string() });
export const Child = nodeKind("child/v1", [Base], { b: z.string() });
export const Grandchild = nodeKind("grandchild/v1", [Child], { c: z.string() });
export const Plain = z.object({ x: z.string() });
`,
);

const def = (extra: object) => ({ renderable: false, holds: "content" as const, summary: "x", ...extra });
const registry = new GraphTypologyRegistry({
  widgets: def({
    nodeSchemas: {
      "child/v1": { validator: "kinds.ts#Child" },
      "grandchild/v1": { validator: "kinds.ts#Grandchild" },
      "plain/v1": { validator: "kinds.ts#Plain" },
      "none/v1": {},
      "https://json-schema.org/draft/2020-12/schema": { external: "JSON Schema 2020-12" },
    },
  }),
  solo: def({ validator: "kinds.ts#Base" }),
  prose: def({}),
});

describe("nodeKindIndex", async () => {
  const index = await nodeKindIndex(registry, dir, dir);
  const byId = new Map(index.kinds.map((k) => [k.id, k]));

  test("a family whose validator is a nodeKind() is a node kind, holding that family", () => {
    expect(byId.get("child/v1")?.holdings).toEqual([{ typology: "widgets", family: "child/v1" }]);
    expect(byId.get("child/v1")?.module).toBe("kinds.ts");
  });

  test("a typology with no families is judged on its kind-level validator", () => {
    expect(byId.get("base/v1")?.holdings).toEqual([{ typology: "solo" }]);
  });

  test("parents and subclasses are both recorded, so the tree reads either way", () => {
    expect(byId.get("child/v1")?.parents).toEqual(["base/v1"]);
    expect(byId.get("base/v1")?.subclasses).toEqual(["child/v1"]);
    expect(kindAndSubclasses(index, "base/v1")).toEqual(["base/v1", "child/v1", "grandchild/v1"]);
  });

  test("a bare Zod schema and a missing validator are UNKINDED, each with its reason", () => {
    expect(index.unkinded).toEqual([
      { typology: "widgets", family: "none/v1", reason: "no-validator" },
      { typology: "widgets", family: "plain/v1", reason: "zod-schema", ref: "kinds.ts#Plain" },
    ]);
  });

  test("an external standard and a typology with nothing to type are not counted at all", () => {
    expect(index.unkinded.some((u) => u.typology === "prose" || u.family?.startsWith("https:"))).toBe(false);
  });

  test("no collisions when one kind is reached twice", () => {
    expect(index.collisions).toEqual([]);
  });
});

describe("the ratchet", async () => {
  const index = await nodeKindIndex(registry, dir, dir);

  test("a family unkinded now and absent from the baseline is NEW", () => {
    expect(newUnkinded(index, { unkinded: [{ typology: "widgets", family: "plain/v1", reason: "zod-schema" }] })).toEqual(["widgets#none/v1"]);
  });

  test("a baselined family is not new, and one that became a kind simply leaves", () => {
    const baseline = { unkinded: [...index.unkinded, { typology: "widgets", family: "child/v1", reason: "zod-schema" as const }] };
    expect(newUnkinded(index, baseline)).toEqual([]);
  });
});
