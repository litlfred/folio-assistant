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
    // `qa` is deliberately undeclared — its module exports interfaces only.
    expect(r.undeclared).toContain("qa");
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
