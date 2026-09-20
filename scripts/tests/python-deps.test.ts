/**
 * The Python dependency declaration, and the two checks that keep it true.
 *
 * Bean `68dt`. The declaration is only worth having if it cannot quietly
 * diverge from what the scripts import, so the interesting tests are the ones
 * that prove divergence is CAUGHT.
 *
 * @module scripts/tests/python-deps
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  DEP_TIERS,
  PYTHON_DEPS,
  PythonDepSchema,
  depsForTier,
  importNameOf,
  requirementsPath,
} from "../../schemas/python-deps.ts";
import { checkPythonDeps, scanImports } from "../check-python-deps.ts";
import { requirementsBody, staleTiers } from "../gen-python-deps.ts";

const ROOT = resolve(import.meta.dir, "../..");

describe("the declaration matches what the scripts actually import", () => {
  test("nothing imported is undeclared, and nothing declared is dead", () => {
    const r = checkPythonDeps(ROOT);
    expect(r.undeclared.map((u) => u.module)).toEqual([]);
    expect(r.unused.map((u) => u.distribution)).toEqual([]);
  });

  test("the scan finds real imports — not a vacuous pass", () => {
    // A scan returning nothing would satisfy the assertion above trivially.
    // `pymupdf` is the one this bean exists for, so it is named explicitly.
    const found = scanImports(ROOT);
    expect(found.length).toBeGreaterThan(5);
    expect(found.map((f) => f.module)).toContain("pymupdf");
  });

  test("local sibling modules are NOT treated as dependencies", () => {
    // The first scan reported 13 packages; five were files inside
    // `scripts/translation/` imported flat. Declaring them would have put
    // phantom entries into requirements.txt.
    const names = scanImports(ROOT).map((f) => f.module);
    for (const local of ["translation_config", "translation_security", "pull_translations"]) {
      expect(names).not.toContain(local);
    }
  });

  test("import name and distribution name are allowed to differ", () => {
    // Three of them do, and a checker without this mapping reports three
    // false gaps — which is how a checker gets switched off.
    const byDist = new Map(PYTHON_DEPS.map((d) => [d.distribution, d]));
    expect(importNameOf(byDist.get("PyYAML")!)).toBe("yaml");
    expect(importNameOf(byDist.get("pdfminer.six")!)).toBe("pdfminer");
    expect(importNameOf(byDist.get("camelot-py")!)).toBe("camelot");
    // …and the common case still works.
    expect(importNameOf(byDist.get("lxml")!)).toBe("lxml");
  });
});

describe("a transitive dependency is declared, not inferred", () => {
  test("Pillow is declared transitive and says what needs it", () => {
    const pillow = PYTHON_DEPS.find((d) => d.distribution === "pillow");
    expect(pillow?.transitive).toBe(true);
    // No `import PIL` exists anywhere, so without the flag this reads as dead
    // weight and gets removed — and `pypdf` then raises at the point of use.
    expect(scanImports(ROOT).map((f) => f.module)).not.toContain("PIL");
  });

  test("the schema refuses a transitive entry whose `why` does not say what requires it", () => {
    const bad = { distribution: "x", tier: "lean" as const, transitive: true, why: "it is nice" };
    expect(PythonDepSchema.safeParse(bad).success).toBe(false);
    const good = { ...bad, why: "required by y, which imports it" };
    expect(PythonDepSchema.safeParse(good).success).toBe(true);
  });
});

describe("the two tiers, and what each costs", () => {
  test("camelot is the only extended entry, and it is the expensive one", () => {
    expect(depsForTier("extended").map((d) => d.distribution)).toEqual(["camelot-py"]);
    // The reason has to carry the measurement — a tier with no stated cost is
    // a judgement nobody can check.
    expect(depsForTier("extended")[0].why).toMatch(/\d+ ?MB/);
  });

  test("every lean entry is installable by CI's own file", () => {
    const body = readFileSync(join(ROOT, "requirements.txt"), "utf-8");
    for (const d of depsForTier("lean")) expect(body).toContain(`\n${d.distribution}\n`);
    // And the expensive one is NOT in it.
    expect(body).not.toContain("\ncamelot-py\n");
  });
});

describe("the generated files cannot drift from the declaration", () => {
  test("both are current", () => {
    expect(staleTiers(ROOT)).toEqual([]);
  });

  test("generation is deterministic — byte-identical on a re-run", () => {
    for (const tier of DEP_TIERS) expect(requirementsBody(tier)).toBe(requirementsBody(tier));
  });

  test("each file says it is generated and names its source", () => {
    for (const tier of DEP_TIERS) {
      const body = readFileSync(join(ROOT, requirementsPath(tier)), "utf-8");
      expect(body).toContain("GENERATED");
      expect(body).toContain("schemas/python-deps.ts");
    }
  });

  test("every package's reason travels into the file with it", () => {
    // A requirements file is where somebody lands when an install fails, and
    // "what is this for" is the question they have.
    const body = readFileSync(join(ROOT, "requirements.txt"), "utf-8");
    for (const d of depsForTier("lean")) expect(body).toContain(`# ${d.distribution}:`);
  });
});
