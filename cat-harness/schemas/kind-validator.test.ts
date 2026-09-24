/**
 * Resolving a graph kind's validator — and above all, the three states.
 *
 * Bean `folio-assistant-i31r`. The assertion that matters is that
 * **undeclared is not success**: 14 of 16 kinds are in that state, so a
 * resolver that collapsed it into a pass would report a clean sweep over
 * most of the corpus.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  ValidatorRefError,
  isZodSchema,
  parseValidatorRef,
  resolveKindValidator,
} from "./kind-validator";
import { GraphKindRegistry, type GraphKindDef } from "./cat-harness";

const INSTANCE = resolve(import.meta.dir, "..");

function registryWith(def: Partial<GraphKindDef> & { validator?: string }): GraphKindRegistry {
  const r = new GraphKindRegistry({});
  r.register("test-kind", {
    type: "urn:x:TestGraph",
    renderable: false,
    summary: "a kind for tests",
    ...def,
  } as GraphKindDef);
  return r;
}

describe("parseValidatorRef", () => {
  test("`module#Export` splits", () => {
    expect(parseValidatorRef("schemas/x.ts#XSchema")).toEqual({
      module: "schemas/x.ts",
      exportName: "XSchema",
    });
  });

  test("a bare module is REFUSED — the export is not optional", () => {
    // `schemas/health-report.ts` exports five schemas. A default would pick
    // one silently, which is how a validator checks the wrong shape and passes.
    expect(() => parseValidatorRef("schemas/x.ts")).toThrow(ValidatorRefError);
    expect(() => parseValidatorRef("schemas/x.ts")).toThrow(/#Export/);
  });

  test("an absolute or escaping module is refused", () => {
    // It would resolve into whatever checkout is next door.
    expect(() => parseValidatorRef("/etc/x.ts#S")).toThrow(/instance-relative/);
    expect(() => parseValidatorRef("../other/x.ts#S")).toThrow(/instance-relative/);
  });

  test("an empty half is refused", () => {
    expect(() => parseValidatorRef("#S")).toThrow(ValidatorRefError);
    expect(() => parseValidatorRef("schemas/x.ts#")).toThrow(ValidatorRefError);
  });
});

describe("isZodSchema", () => {
  test("an interface-shaped object is not one", () => {
    // The `qa` case: its declared module exports TypeScript interfaces, which
    // document a shape and cannot check one.
    expect(isZodSchema({})).toBe(false);
    expect(isZodSchema(undefined)).toBe(false);
    expect(isZodSchema({ safeParse: () => ({}) })).toBe(true);
  });
});

describe("resolveKindValidator — three states", () => {
  test("undeclared is its OWN state, not a pass and not a failure", async () => {
    const r = await resolveKindValidator("test-kind", INSTANCE, registryWith({}));
    expect(r.state).toBe("undeclared");
    if (r.state === "undeclared") expect(r.reason).toMatch(/declares no validator/);
  });

  test("a declared validator that loads resolves to something runnable", async () => {
    const r = await resolveKindValidator(
      "test-kind",
      INSTANCE,
      registryWith({ validator: "schemas/health-report.ts#HealthReportSchema" }),
    );
    expect(r.state).toBe("resolved");
    if (r.state === "resolved") expect(typeof r.schema.safeParse).toBe("function");
  });

  test("a missing module is unresolvable, and says which path", async () => {
    const r = await resolveKindValidator(
      "test-kind",
      INSTANCE,
      registryWith({ validator: "schemas/nope.ts#S" }),
    );
    expect(r.state).toBe("unresolvable");
    if (r.state === "unresolvable") expect(r.reason).toMatch(/nope\.ts/);
  });

  test("a missing export is unresolvable", async () => {
    const r = await resolveKindValidator(
      "test-kind",
      INSTANCE,
      registryWith({ validator: "schemas/health-report.ts#NotAThing" }),
    );
    expect(r.state).toBe("unresolvable");
    if (r.state === "unresolvable") expect(r.reason).toMatch(/exports no NotAThing/);
  });

  test("an export that is not a Zod schema is unresolvable, not silently accepted", async () => {
    // The distinction the two fields exist to keep apart: a module can name
    // where a shape is DEFINED without offering anything to run.
    const r = await resolveKindValidator(
      "test-kind",
      INSTANCE,
      registryWith({ validator: "schemas/health-report.ts#HEALTH_CHECKS" }),
    );
    expect(r.state).toBe("unresolvable");
    if (r.state === "unresolvable") expect(r.reason).toMatch(/not a Zod schema|exports no/);
  });

  test("an unknown kind is unresolvable rather than undeclared", async () => {
    // The two would otherwise be indistinguishable, and they are different
    // mistakes: a typo in the kind, versus a kind with nothing to run.
    const r = await resolveKindValidator("ghost", INSTANCE, registryWith({}));
    expect(r.state).toBe("unresolvable");
  });
});

describe("this instance's own kinds", () => {
  test("every declared validator resolves, and the count is not asserted", async () => {
    // Named states rather than a count: a number here reports a new graph
    // kind as a failure. What must hold is that nothing DECLARED is broken.
    const { sweep } = await import("../scripts/check-kind-validators");
    const r = await sweep(INSTANCE);
    expect(r.unresolvable).toEqual([]);
    expect(r.resolved.length + r.undeclared.length).toBeGreaterThan(0);
    // `qa` has no kind-level validator — its families differ — so it is
    // checked per `$schema` family instead (bean `rdkm`), never "undeclared".
    expect(r.undeclared).not.toContain("qa");
    expect(r.resolved).toContain("qa (per $schema family)");
  });
});

describe("kindForPath", () => {
  test("the LONGEST matching directory wins, because declarations nest", async () => {
    const { kindForPath } = await import("../scripts/kg-validate");
    const root = mkdtempSync(join(tmpdir(), "kfp-"));
    mkdirSync(join(root, "beans", "defs"), { recursive: true });
    writeFileSync(join(root, "beans", "defs", "a.md"), "");
    const dirs = [
      { path: "beans/", graphKinds: ["beans"] },
      { path: "beans/defs/", graphKinds: ["bean-defs"] },
    ];
    expect(kindForPath(join(root, "beans", "defs", "a.md"), root, dirs)).toBe("bean-defs");
    rmSync(root, { recursive: true, force: true });
  });

  test("a directory declaring SEVERAL graphs yields nothing, rather than guessing", async () => {
    // `schemas/` declares two. Picking one would be the lie of precision the
    // `cat-harness` kind's own doc comment warns about.
    const { kindForPath } = await import("../scripts/kg-validate");
    const root = mkdtempSync(join(tmpdir(), "kfp2-"));
    mkdirSync(join(root, "schemas"), { recursive: true });
    const dirs = [{ path: "schemas/", graphKinds: ["schemas", "cat-harness"] }];
    expect(kindForPath(join(root, "schemas", "x.ts"), root, dirs)).toBeUndefined();
    rmSync(root, { recursive: true, force: true });
  });

  test("a path outside the root belongs to no kind", async () => {
    const { kindForPath } = await import("../scripts/kg-validate");
    expect(kindForPath("/etc/passwd", "/tmp/x", [{ path: "a/", graphKinds: ["beans"] }]))
      .toBeUndefined();
  });
});

describe("per-family node schemas (bean rdkm)", () => {
  const HARNESS = resolve(import.meta.dir, "..");

  test("qa names every family, and each resolves to a schema, a shape, or a recorded absence", async () => {
    const { resolveNodeSchemas } = await import("./kind-validator");
    const fams = await resolveNodeSchemas("qa", HARNESS);
    expect(fams.map((f) => f.tag).sort()).toEqual([
      "block-qa/v1", "folio-detangle-sidecar/v1", "folio-qa-index/v1", "folio-test-run/v1", "kg-qa/v1",
      "qa-results/v1", "qa-witness/v1", "translation-qa/v1", "viewer-nav-qa/v1",
    ]);
    expect(fams.filter((f) => f.state === "unresolvable")).toEqual([]);
    expect(fams.find((f) => f.tag === "kg-qa/v1")?.state).toBe("resolved");
    expect(fams.find((f) => f.tag === "qa-witness/v1")?.state).toBe("shape");
    expect(fams.find((f) => f.tag === "folio-qa-index/v1")?.state).toBe("untyped");
  });

  test("a shape is read from source, fields and optionality included", async () => {
    const { readShape } = await import("./kind-validator");
    const dir = mkdtempSync(join(tmpdir(), "shape-"));
    writeFileSync(join(dir, "m.ts"), "export interface Thing { id: string; note?: number }\n");
    const r = readShape(dir, "m.ts#Thing");
    expect(r).toEqual({
      ref: { module: "m.ts", exportName: "Thing" },
      fields: [
        { name: "id", optional: false, type: "string" },
        { name: "note", optional: true, type: "number" },
      ],
    });
    expect(typeof readShape(dir, "m.ts#Missing")).toBe("string");
    rmSync(dir, { recursive: true, force: true });
  });

  test("kg-validate routes a qa node by its $schema tag", async () => {
    const { validatePath } = await import("../scripts/kg-validate");
    const dir = join(HARNESS, "test", "results");
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const find = (d: string, tag: string): string | undefined => {
      for (const e of readdirSync(d)) {
        const p = join(d, e);
        if (statSync(p).isDirectory()) { const hit = find(p, tag); if (hit) return hit; continue; }
        if (!p.endsWith(".json")) continue;
        try {
          if (JSON.parse(readFileSync(p, "utf8"))?.$schema === tag) return p;
        } catch {
          // not a node
        }
      }
      return undefined;
    };
    const kg = find(dir, "kg-qa/v1");
    expect(kg).toBeDefined();
    expect((await validatePath(kg!, HARNESS)).state).toBe("valid");
    const witness = find(dir, "qa-witness/v1");
    expect(witness).toBeDefined();
    const v = await validatePath(witness!, HARNESS);
    expect(v.state).toBe("undetermined");
  });
});

describe("instance-qualified references (bean quda)", () => {
  test("`name:module#Export` resolves through the instance that declares the name", async () => {
    const { parseValidatorRef, rootOf } = await import("./kind-validator");
    expect(parseValidatorRef("folio-assistant-core:schemas/catalogue.ts#CatalogueSchema")).toEqual({
      instance: "folio-assistant-core",
      module: "schemas/catalogue.ts",
      exportName: "CatalogueSchema",
    });
    const here = resolve(import.meta.dir, "..");
    expect(rootOf("folio-assistant-core", here)).toBe(resolve(here, "..", "folio-assistant-core"));
    expect(rootOf("no-such-instance", here)).toBeUndefined();
    expect(rootOf(undefined, here)).toBe(here);
  });

  test("an escaping path is still refused — the name is the only way out", async () => {
    const { parseValidatorRef } = await import("./kind-validator");
    expect(() => parseValidatorRef("../folio-assistant-core/schemas/catalogue.ts#CatalogueSchema")).toThrow();
  });

  test("top-level `_` annotations are dropped before a node is checked", async () => {
    const { stripAnnotations } = await import("./kind-validator");
    expect(stripAnnotations({ _comment: "x", a: 1, b: { _keep: 2 } })).toEqual({ a: 1, b: { _keep: 2 } });
    expect(stripAnnotations([1])).toEqual([1]);
  });
});
