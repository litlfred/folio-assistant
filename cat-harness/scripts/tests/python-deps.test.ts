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
import { repoRootFor } from "../../schemas/cat-harness.js";

// TWO ROOTS, because this file asks two questions of two different trees.
//
// `requirements.txt` is the REPOSITORY's — it sits beside `package.json` and
// CI installs it as `pip install -r requirements.txt` from the checkout root.
// The `.py` files that import those packages are the INSTANCE's, under
// `cat-harness/scripts/`. One `ROOT` answered both when this arrived from
// main, and pointing it at either alone breaks the other half: at the
// instance, `requirements.txt` is ENOENT; at the repository, the
// `scripts/**/*.py` glob matches nothing and the scan reports 0 imports —
// which the vacuity guard below is there to refuse.
const INSTANCE = resolve(import.meta.dir, "../..");
const REPO_ROOT = repoRootFor(INSTANCE);

describe("the declaration matches what the scripts actually import", () => {
  test("nothing imported is undeclared, and nothing declared is dead", () => {
    const r = checkPythonDeps(INSTANCE);
    expect(r.undeclared.map((u) => u.module)).toEqual([]);
    expect(r.unused.map((u) => u.distribution)).toEqual([]);
  });

  test("the scan finds real imports — not a vacuous pass", () => {
    // A scan returning nothing would satisfy the assertion above trivially.
    // `pymupdf` is the one this bean exists for, so it is named explicitly.
    const found = scanImports(INSTANCE);
    expect(found.length).toBeGreaterThan(5);
    expect(found.map((f) => f.module)).toContain("pymupdf");
  });

  test("local sibling modules are NOT treated as dependencies", () => {
    // The first scan reported 13 packages; five were files inside
    // `scripts/translation/` imported flat. Declaring them would have put
    // phantom entries into requirements.txt.
    const names = scanImports(INSTANCE).map((f) => f.module);
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
    expect(scanImports(INSTANCE).map((f) => f.module)).not.toContain("PIL");
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
    const body = readFileSync(join(REPO_ROOT, "requirements.txt"), "utf-8");
    for (const d of depsForTier("lean")) expect(body).toContain(`\n${d.distribution}\n`);
    // And the expensive one is NOT in it.
    expect(body).not.toContain("\ncamelot-py\n");
  });
});

describe("the generated files cannot drift from the declaration", () => {
  test("both are current", () => {
    expect(staleTiers(REPO_ROOT)).toEqual([]);
  });

  test("generation is deterministic — byte-identical on a re-run", () => {
    for (const tier of DEP_TIERS) expect(requirementsBody(tier)).toBe(requirementsBody(tier));
  });

  test("each file says it is generated and names its source", () => {
    for (const tier of DEP_TIERS) {
      const body = readFileSync(join(REPO_ROOT, requirementsPath(tier)), "utf-8");
      expect(body).toContain("GENERATED");
      expect(body).toContain("schemas/python-deps.ts");
    }
  });

  test("every package carries a machine-readable `# imports:` line", () => {
    // The reason above is for a PERSON. This one is for
    // `scripts/tests/python-deps-importable.test.py`, which reads the
    // distribution -> module mapping back out and tries each import for real.
    // Emitted for every package, including where it equals the distribution
    // name: a parser with a default path cannot tell a missing line from an
    // unremarkable one, so a dropped line would silently become a weaker check.
    for (const tier of DEP_TIERS) {
      const body = requirementsBody(tier);
      const emitted = [...body.matchAll(/^# imports: (\S+)$/gm)].map((m) => m[1]);
      expect(emitted).toEqual(
        [...depsForTier(tier)]
          .sort((a, b) => a.distribution.localeCompare(b.distribution))
          .map(importNameOf),
      );
    }
  });

  test("the mapping that differs is the mapping that matters", () => {
    // Three distributions here do not import under their own name. If this
    // list ever went empty the importability check would still pass while
    // testing nothing interesting, so name them.
    const body = requirementsBody("lean");
    for (const [dist, mod] of [
      ["pillow", "PIL"],
      ["PyYAML", "yaml"],
      ["pdfminer.six", "pdfminer"],
    ]) {
      expect(body).toContain(`# imports: ${mod}\n${dist}\n`);
    }
  });

  test("every package's reason travels into the file with it", () => {
    // A requirements file is where somebody lands when an install fails, and
    // "what is this for" is the question they have.
    const body = readFileSync(join(REPO_ROOT, "requirements.txt"), "utf-8");
    for (const d of depsForTier("lean")) expect(body).toContain(`# ${d.distribution}:`);
  });
});
