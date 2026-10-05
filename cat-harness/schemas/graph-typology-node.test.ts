/**
 * Graph typologies declared as nodes (bean dmx1): loaded from each instance's
 * `typologies/` graph on first use, refused when two files claim one name.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GraphTypologyNodeSchema } from "./graph-typology-node";
import { GraphTypologyRegistry } from "./graph-typology-registry";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

const node = (name: string, holds = "derived") => ({
  $schema: "folio-graph-typology/v1",
  kind: name,
  renderable: false,
  holds,
  summary: `the ${name} kind`,
});

/** A checkout whose instances each declare a typologies/ graph holding `typologies`. */
function checkout(instances: Record<string, Record<string, unknown>[]>): string {
  const root = mkdtempSync(join(tmpdir(), "kinds-"));
  made.push(root);
  for (const [name, kinds] of Object.entries(instances)) {
    const dir = join(root, name);
    mkdirSync(join(dir, "typologies"), { recursive: true });
    writeFileSync(join(dir, `${name}.json`), JSON.stringify({ name, directories: [{ id: `${name}-typologies`, path: "typologies/", graphTypologies: ["typologies"] }] }));
    kinds.forEach((k, i) => writeFileSync(join(dir, "typologies", `${(k as { kind?: string }).kind ?? i}.json`), JSON.stringify(k)));
  }
  return root;
}

describe("a declared kind", () => {
  test("is loaded on first use, with the file that declared it", () => {
    const root = checkout({ alpha: [node("widget")] });
    const r = new GraphTypologyRegistry({}, root);
    expect(r.get("widget")?.holds).toBe("derived");
    expect(r.declaredBy("widget")).toBe(join(root, "alpha", "typologies", "widget.json"));
    expect(r.names()).toContain("widget");
  });
  test("is unknown to a registry that declares no checkout", () => {
    expect(new GraphTypologyRegistry({}).has("widget")).toBe(false);
  });
  test("two files claiming one name are refused, naming both", () => {
    const root = checkout({ alpha: [node("widget")], beta: [node("widget", "content")] });
    expect(() => new GraphTypologyRegistry({}, root).get("widget")).toThrow(/alpha.*beta|declared by/);
  });
  test("a declared name that the code also lists is refused", () => {
    const root = checkout({ alpha: [node("widget")] });
    expect(() => new GraphTypologyRegistry({ widget: { renderable: false, holds: "content", summary: "x" } }, root).names()).toThrow(/base layer/);
  });
  test("a node that does not parse throws with its path", () => {
    const root = checkout({ alpha: [{ $schema: "folio-graph-typology/v1", kind: "widget" }] });
    expect(() => new GraphTypologyRegistry({}, root).has("widget")).toThrow(/widget\.json/);
  });
});

describe("the node schema", () => {
  test("a node is never mistaken for an instance declaration (it carries no `name`)", async () => {
    const root = checkout({ alpha: [node("widget")] });
    const { findDeclarationFile } = await import("./instance-roots");
    expect(findDeclarationFile(join(root, "alpha", "typologies"))).toBeUndefined();
  });
  test("refuses an unknown field and an upper-case name", () => {
    expect(GraphTypologyNodeSchema.safeParse({ ...node("widget"), extra: 1 }).success).toBe(false);
    expect(GraphTypologyNodeSchema.safeParse(node("Widget")).success).toBe(false);
  });
});

describe("this checkout", () => {
  test("fhir-harness declares ig-pages and ig-ast, with their avatars", async () => {
    const { defaultGraphTypologies } = await import("./graph-typology-registry");
    const { hasAvatar } = await import("./avatars");
    for (const k of ["ig-pages", "ig-ast"]) {
      expect(defaultGraphTypologies.declaredBy(k)).toMatch(/fhir-harness[/\\]typologies[/\\]/);
      expect(hasAvatar(k)).toBe(true);
    }
  });
});

describe("validators as nodes (bean riit): the validator names the family", () => {
  /** A checkout with one instance declaring kinds/ and validators/. */
  function withValidators(kinds: Record<string, unknown>[], validators: Record<string, unknown>[]): string {
    const root = mkdtempSync(join(tmpdir(), "validators-"));
    made.push(root);
    const dir = join(root, "alpha");
    mkdirSync(join(dir, "typologies"), { recursive: true });
    mkdirSync(join(dir, "validators"), { recursive: true });
    writeFileSync(
      join(dir, "alpha.json"),
      JSON.stringify({
        name: "alpha",
        directories: [
          { id: "k", path: "typologies/", graphTypologies: ["typologies"] },
          { id: "v", path: "validators/", graphTypologies: ["validators"] },
        ],
      }),
    );
    for (const k of kinds) writeFileSync(join(dir, "typologies", `${(k as { kind: string }).kind}.json`), JSON.stringify(k));
    validators.forEach((v, i) => writeFileSync(join(dir, "validators", `${(v as { id?: string }).id ?? i}.json`), JSON.stringify(v)));
    return root;
  }
  const famKind = { ...node("widget"), nodeSchemas: { "widget/v1": {} } };
  const v = (id: string, family?: string, schema = "alpha:schemas/w.ts#WidgetSchema") => ({
    $schema: "folio-validator/v1",
    id,
    validates: { kind: "widget", ...(family ? { family } : {}) },
    schema,
  });
  test("a listed family takes the validator a node names for it", () => {
    const r = new GraphTypologyRegistry({}, withValidators([famKind], [v("widget", "widget/v1")]));
    expect(r.get("widget")?.nodeSchemas?.["widget/v1"]?.validator).toBe("alpha:schemas/w.ts#WidgetSchema");
    expect(r.validatorNodeFor("widget", "widget/v1")?.node.id).toBe("widget");
  });
  test("a kind-level validator fills a kind with no families", () => {
    const r = new GraphTypologyRegistry({}, withValidators([node("widget")], [v("widget")]));
    expect(r.get("widget")?.validator).toBe("alpha:schemas/w.ts#WidgetSchema");
  });
  test("a validator for a family the kind does not list is refused", () => {
    expect(() => new GraphTypologyRegistry({}, withValidators([famKind], [v("widget", "other/v1")])).get("widget")).toThrow(/does not list/);
  });
  test("two validators for one family are refused, naming both", () => {
    expect(() =>
      new GraphTypologyRegistry({}, withValidators([famKind], [v("a", "widget/v1"), v("b", "widget/v1", "alpha:x.ts#Other")])).get("widget"),
    ).toThrow(/two validators/);
  });
  test("a family that already names DIFFERENT code is two answers, and refused", () => {
    const coded = { ...node("widget"), nodeSchemas: { "widget/v1": { validator: "alpha:old.ts#OldSchema" } } };
    expect(() => new GraphTypologyRegistry({}, withValidators([coded], [v("widget", "widget/v1")])).get("widget")).toThrow(/two answers/);
  });
  test("a kind registered in code after load is joined too (core's folio)", () => {
    const r = new GraphTypologyRegistry({}, withValidators([], [v("widget")]));
    r.names();
    r.register("widget", { renderable: false, holds: "content", summary: "late" });
    expect(r.get("widget")?.validator).toBe("alpha:schemas/w.ts#WidgetSchema");
  });
});
