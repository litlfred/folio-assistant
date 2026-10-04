/**
 * Graph kinds declared as nodes (bean dmx1): loaded from each instance's
 * `kinds/` graph on first use, refused when two files claim one name.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GraphKindNodeSchema } from "./graph-kind-node";
import { GraphKindRegistry } from "./graph-kind-registry";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

const node = (name: string, holds = "derived") => ({
  $schema: "folio-graph-kind/v1",
  kind: name,
  renderable: false,
  holds,
  summary: `the ${name} kind`,
});

/** A checkout whose instances each declare a kinds/ graph holding `kinds`. */
function checkout(instances: Record<string, Record<string, unknown>[]>): string {
  const root = mkdtempSync(join(tmpdir(), "kinds-"));
  made.push(root);
  for (const [name, kinds] of Object.entries(instances)) {
    const dir = join(root, name);
    mkdirSync(join(dir, "kinds"), { recursive: true });
    writeFileSync(join(dir, `${name}.json`), JSON.stringify({ name, directories: [{ id: `${name}-kinds`, path: "kinds/", graphKinds: ["kinds"] }] }));
    kinds.forEach((k, i) => writeFileSync(join(dir, "kinds", `${(k as { kind?: string }).kind ?? i}.json`), JSON.stringify(k)));
  }
  return root;
}

describe("a declared kind", () => {
  test("is loaded on first use, with the file that declared it", () => {
    const root = checkout({ alpha: [node("widget")] });
    const r = new GraphKindRegistry({}, root);
    expect(r.get("widget")?.holds).toBe("derived");
    expect(r.declaredBy("widget")).toBe(join(root, "alpha", "kinds", "widget.json"));
    expect(r.names()).toContain("widget");
  });
  test("is unknown to a registry that declares no checkout", () => {
    expect(new GraphKindRegistry({}).has("widget")).toBe(false);
  });
  test("two files claiming one name are refused, naming both", () => {
    const root = checkout({ alpha: [node("widget")], beta: [node("widget", "content")] });
    expect(() => new GraphKindRegistry({}, root).get("widget")).toThrow(/alpha.*beta|declared by/);
  });
  test("a declared name that the code also lists is refused", () => {
    const root = checkout({ alpha: [node("widget")] });
    expect(() => new GraphKindRegistry({ widget: { renderable: false, holds: "content", summary: "x" } }, root).names()).toThrow(/base layer/);
  });
  test("a node that does not parse throws with its path", () => {
    const root = checkout({ alpha: [{ $schema: "folio-graph-kind/v1", kind: "widget" }] });
    expect(() => new GraphKindRegistry({}, root).has("widget")).toThrow(/widget\.json/);
  });
});

describe("the node schema", () => {
  test("a node is never mistaken for an instance declaration (it carries no `name`)", async () => {
    const root = checkout({ alpha: [node("widget")] });
    const { findDeclarationFile } = await import("./instance-roots");
    expect(findDeclarationFile(join(root, "alpha", "kinds"))).toBeUndefined();
  });
  test("refuses an unknown field and an upper-case name", () => {
    expect(GraphKindNodeSchema.safeParse({ ...node("widget"), extra: 1 }).success).toBe(false);
    expect(GraphKindNodeSchema.safeParse(node("Widget")).success).toBe(false);
  });
});

describe("this checkout", () => {
  test("fhir-harness declares ig-pages and ig-ast, with their avatars", async () => {
    const { defaultGraphKinds } = await import("./graph-kind-registry");
    const { hasAvatar } = await import("./avatars");
    for (const k of ["ig-pages", "ig-ast"]) {
      expect(defaultGraphKinds.declaredBy(k)).toMatch(/fhir-harness[/\\]kinds[/\\]/);
      expect(hasAvatar(k)).toBe(true);
    }
  });
});
