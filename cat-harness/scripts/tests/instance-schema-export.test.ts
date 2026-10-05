/**
 * Each instance publishes its own schema directory — bean `4ak5` item 1, the
 * "and a schema" half (owner ruling 2026-10-05, option B).
 *
 * Three things are pinned here, each for a reason:
 *
 * - the generalised builder over a FIXTURE instance, so the `$id` rule is
 *   tested against inputs this file controls rather than whatever the corpus
 *   holds today;
 * - the host's outputs are what they were, because the generalisation's
 *   promise was "the host path byte-identical";
 * - a real foreign instance's contracts mint under ITS publication identity,
 *   not this site's — guarded by `inAggregate()`, since it reads other
 *   instances' files (standalone rule, bean `ho66`).
 *
 * @module scripts/tests/instance-schema-export
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  buildDeclarationSchema,
  buildInstanceSchemas,
  buildSkillIoContracts,
  instanceSchemaBase,
  instanceSchemaIndexIri,
  skillIoIri,
  type InstanceIdentity,
} from "../harness-schema-export.js";
import { publishedIdentity, publishedInstanceSchemas } from "../kg-export.js";
import { readDeclaration } from "../../schemas/cat-harness.js";
import { INSTANCE, checkoutHolding, inAggregate } from "../../test/support/checkout.js";

const SITE = "https://site.example/pub";

/** A fixture instance holding two contracts, one carrying a hand-written (wrong) `$id`. */
function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "instance-schema-"));
  const skill = join(root, "schemas", "skills", "widget");
  mkdirSync(skill, { recursive: true });
  writeFileSync(join(skill, "input.schema.json"), JSON.stringify({ $id: "https://wrong.example/x.json", type: "object" }));
  writeFileSync(join(skill, "output.schema.json"), JSON.stringify({ type: "string" }));
  return root;
}
const roots: string[] = [];
afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});
function fx(): string {
  const r = fixture();
  roots.push(r);
  return r;
}

describe("the schema base sits beside the instance's document", () => {
  test("an instance published under this site: <site>/<stub>/schema", () => {
    const id: InstanceIdentity = { stub: "fx", base: SITE, docPath: "fx/fx.jsonld" };
    expect(instanceSchemaBase(id)).toBe(`${SITE}/fx/schema`);
    expect(instanceSchemaIndexIri(id)).toBe(`${SITE}/fx/schema/fx.schema.json`);
  });

  test("an instance with its own canonicalUrl: <canonicalUrl>/schema — its publication identity, not the staging path", () => {
    const id: InstanceIdentity = { stub: "fx", base: "https://own.example/fx", docPath: "fx.jsonld" };
    expect(instanceSchemaBase(id)).toBe("https://own.example/fx/schema");
  });

  test("no base: no $id at all, never a relative one", () => {
    expect(instanceSchemaBase({ stub: "fx", base: "", docPath: "fx/fx.jsonld" })).toBe("");
    expect(instanceSchemaIndexIri({ stub: "fx", base: "", docPath: "fx/fx.jsonld" })).toBeUndefined();
  });
});

describe("buildInstanceSchemas over a fixture instance", () => {
  test("contracts are read from that instance, and their $id is computed, never trusted from the file", () => {
    const root = fx();
    const id: InstanceIdentity = { stub: "fx", base: SITE, docPath: "fx/fx.jsonld", docIri: `${SITE}/fx/fx.jsonld` };
    const built = buildInstanceSchemas(root, id);
    expect(built.contracts.map((c) => [c.source, c.published])).toEqual([
      [join("schemas", "skills", "widget", "input.schema.json"), join("skills", "widget", "input.schema.json")],
      [join("schemas", "skills", "widget", "output.schema.json"), join("skills", "widget", "output.schema.json")],
    ]);
    for (const c of built.contracts) {
      expect(c.schema.$id).toBe(skillIoIri(`${SITE}/fx/schema`, c.skill, c.io));
    }
    // The file's own content survives; only the identity is replaced.
    expect(built.contracts[0]!.schema.type).toBe("object");
  });

  test("the index $refs the SHARED declaration schema and lists every contract by $id", () => {
    const root = fx();
    const id: InstanceIdentity = { stub: "fx", base: SITE, docPath: "fx/fx.jsonld", docIri: `${SITE}/fx/fx.jsonld` };
    const built = buildInstanceSchemas(root, id, { baseUrl: SITE });
    const [name, index] = built.files[0]!;
    expect(name).toBe("fx.schema.json");
    expect(index.$id).toBe(built.indexIri);
    expect(index.allOf).toEqual([{ $ref: buildDeclarationSchema({ baseUrl: SITE }).$id }]);
    expect(index.$defs).toEqual({
      "skills/widget/input": { $ref: `${SITE}/fx/schema/skills/widget/input.schema.json` },
      "skills/widget/output": { $ref: `${SITE}/fx/schema/skills/widget/output.schema.json` },
    });
    // Public Zod schemas are not looked for, and the index says so rather
    // than presenting an empty list as "there are none".
    expect(index.omitted).toEqual(["schemas"]);
    expect(index.$comment).toBe(`Instance graph: ${SITE}/fx/fx.jsonld`);
    expect(built.files.map(([f]) => f)).toEqual(["fx.schema.json", ...built.contracts.map((c) => c.published)]);
  });

  test("with no base the index still lists every contract, by the path both share", () => {
    const built = buildInstanceSchemas(fx(), { stub: "fx", base: "", docPath: "fx/fx.jsonld" });
    const [, index] = built.files[0]!;
    expect(index.$id).toBeUndefined();
    for (const c of built.contracts) expect(c.schema.$id).toBeUndefined();
    expect(Object.values(index.$defs as Record<string, { $ref: string }>).map((d) => d.$ref)).toEqual([
      "skills/widget/input.schema.json",
      "skills/widget/output.schema.json",
    ]);
  });

  test("an instance with no contracts still gets an index", () => {
    const empty = mkdtempSync(join(tmpdir(), "instance-schema-empty-"));
    roots.push(empty);
    const built = buildInstanceSchemas(empty, { stub: "e", base: SITE, docPath: "e/e.jsonld" });
    expect(built.contracts).toEqual([]);
    expect(built.files.map(([f]) => f)).toEqual(["e.schema.json"]);
  });
});

describe("the host's schema outputs are unchanged by the generalisation", () => {
  test("the default root IS the host: same contracts, same $ids, same paths", () => {
    const base = readDeclaration(INSTANCE)?.canonicalUrl ?? SITE;
    const byDefault = buildSkillIoContracts({ baseUrl: base });
    expect(byDefault.length).toBeGreaterThan(0);
    expect(buildSkillIoContracts({ baseUrl: base, root: INSTANCE })).toEqual(byDefault);
    for (const c of byDefault) {
      // Instance-relative source and the host's flat `skills/` publish path,
      // exactly as before the generalisation.
      expect(c.source.split("\\").join("/")).toBe(`schemas/skills/${c.skill}/${c.io}.schema.json`);
      expect(c.published.split("\\").join("/")).toBe(`skills/${c.skill}/${c.io}.schema.json`);
      expect(c.schema.$id).toBe(skillIoIri(base, c.skill, c.io));
      // Byte-for-byte means key ORDER too: the computed `$id` replaces the
      // stored one in place. A first draft of the no-base fix moved it to the
      // end and changed every published host contract; this is what caught it.
      const source = JSON.parse(readFileSync(join(INSTANCE, c.source), "utf-8")) as Record<string, unknown>;
      expect(Object.keys(c.schema)).toEqual(Object.keys(source));
      expect({ ...c.schema, $id: source.$id }).toEqual(source);
    }
  });
});

describe.skipIf(!inAggregate())("a real foreign instance mints under its OWN base", () => {
  const repo = checkoutHolding(INSTANCE);

  test("smart-base declares its own canonicalUrl, so its contracts are under it — not under this site", () => {
    const root = resolve(repo, "smart-base");
    const own = readDeclaration(root)?.canonicalUrl;
    expect(own).toBeTruthy();
    const built = publishedInstanceSchemas(root, SITE);
    expect(built.contracts.length).toBeGreaterThan(0);
    for (const c of built.contracts) {
      expect(String(c.schema.$id)).toBe(skillIoIri(`${own!.replace(/\/+$/, "")}/schema`, c.skill, c.io));
      expect(String(c.schema.$id).startsWith(SITE)).toBe(false);
    }
  });

  test("folio-assistant-core has no base of its own, so it publishes under the given site, in its own segment", () => {
    const root = resolve(repo, "folio-assistant-core");
    const built = publishedInstanceSchemas(root, SITE);
    expect(built.contracts.length).toBeGreaterThan(0);
    for (const c of built.contracts) expect(c.schema.$id).toBe(skillIoIri(`${SITE}/folio-assistant-core/schema`, c.skill, c.io));
    // The same identity the document's `@id` is minted from.
    expect(built.indexIri).toBe(instanceSchemaIndexIri(publishedIdentity(root, SITE)));
  });

  test("folio-assistant-sci's contracts are found although its declared `schemas` graph is `sources/`", () => {
    const built = publishedInstanceSchemas(resolve(repo, "folio-assistant-sci"), SITE);
    expect(built.contracts.length).toBeGreaterThan(0);
  });
});
