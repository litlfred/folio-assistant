/**
 * `kg:validate` owns a NESTED instance's path, so every committed kg-audit
 * sidecar is validated for a consumer, not only proved current.
 *
 * ## The defect this pins (bean `676g`)
 *
 * `kg:validate` resolved every path against ONE root, its own instance
 * (`cat-harness/`). Measured on `main` `cf3e624`:
 *
 * ```
 * kg:validate cat-harness/test/results/kg-qa/processes/adjudication.kg-qa.json   ✓ [qa]
 * kg:validate smart-dak/test/results/kg-qa/scenarios/kg.kg-qa.json
 *   ? … could not determine: no declared directory owns this path
 * ```
 *
 * Fixing the owner exposed the second half: the `qa` kind's validator refs
 * (`schemas/kg-qa.ts#…`) are relative to the instance whose registry DEFINES
 * the kind, and resolving them against `smart-dak/` reported "does not exist".
 * Both halves are asserted here, over the REAL corpus, because the question is
 * whether the committed sidecars a reader picks up parse — not whether a
 * fixture does. `smart-dak` was retired since (D3, `26eabf673`), so the
 * nested example below is `smart-base`'s sidecar at the same relative path.
 *
 * ## Anti-vacuity
 *
 * A sweep over zero files passes. So the sweep must reach sidecars in several
 * instances OTHER than the auditor's own — the population this bean is about.
 *
 * @module test/kg-validate-nested-instances
 *
 * Moved here from
 * `cat-harness/scripts/tests/kg-validate-nested-instances.test.ts` to the
 * checkout's own test home `test/` (bean `7zz1`, owner ruling 2026-10-06
 * "Top-level instance"): every test in it validates the kg-audit sidecars of
 * every nested instance in the checkout, which only the whole checkout holds.
 * Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. Paths are
 * composed from ORIGIN_DIR, the directory it was written in, so nothing it
 * reads changed.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { instanceRootsIn, kgQaHomeFor } from "../cat-harness/schemas/cat-harness.js";
import { owningInstanceRoot, validatePath } from "../cat-harness/scripts/kg-validate.js";

/** The directory this test was written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move to the checkout's test home (bean `7zz1`). */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");


const REPO = resolve(ORIGIN_DIR, "../../..");
const HARNESS = join(REPO, "cat-harness");

/** Every committed kg-audit sidecar, keyed by the instance it is ABOUT. */
function sidecarsByInstance(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const inst of instanceRootsIn(REPO)) {
    const home = kgQaHomeFor(inst, HARNESS).root;
    if (!existsSync(home)) continue;
    const files: string[] = [];
    const manifest = join(home, "kg-qa.manifest.json");
    if (existsSync(manifest)) files.push(manifest);
    const tree = join(home, "kg-qa");
    if (existsSync(tree)) {
      for (const f of readdirSync(tree, { recursive: true }).map(String)) {
        if (f.endsWith(".kg-qa.json")) files.push(join(tree, f));
      }
    }
    if (files.length) out.set(relative(REPO, inst) || ".", files);
  }
  return out;
}

describe("kg:validate over nested instances (bean `676g`)", () => {
  test("a path is owned by the DEEPEST instance that contains it", () => {
    expect(owningInstanceRoot(join(REPO, "smart-base/test/results/kg-qa/scenarios/kg.kg-qa.json"), HARNESS)).toBe(
      join(REPO, "smart-base"),
    );
    expect(owningInstanceRoot(join(HARNESS, "test/results/kg-qa.manifest.json"), HARNESS)).toBe(HARNESS);
    // A file in no nested instance belongs to the instance AT the checkout root.
    expect(owningInstanceRoot(join(REPO, "package.json"), HARNESS)).toBe(REPO);
  });

  test("resolving against the auditor's own instance — the old behaviour — refuses a nested sidecar", async () => {
    // The falsifier: proves the sweep below is not passing for a reason that
    // has nothing to do with ownership.
    const nested = join(REPO, "smart-base/test/results/kg-qa/scenarios/kg.kg-qa.json");
    expect(existsSync(nested), "fixture sidecar moved — pick another nested one").toBe(true);
    expect((await validatePath(nested, HARNESS)).state).toBe("undetermined");
    // ...and a nested owner with the nested root as SCHEMA root is the second half.
    expect((await validatePath(nested, join(REPO, "smart-base"))).state).toBe("undetermined");
    expect((await validatePath(nested, join(REPO, "smart-base"), HARNESS)).state).toBe("valid");
  });

  test("every committed kg-audit sidecar, in every instance, validates", async () => {
    const byInstance = sidecarsByInstance();
    const others = [...byInstance.keys()].filter((k) => k !== "cat-harness");
    expect(others.length, `sidecars found only in: ${[...byInstance.keys()].join(", ")}`).toBeGreaterThanOrEqual(5);

    const offences: string[] = [];
    let n = 0;
    for (const files of byInstance.values()) {
      for (const f of files) {
        n++;
        const v = await validatePath(f, owningInstanceRoot(f, HARNESS), HARNESS);
        if (v.state !== "valid") {
          offences.push(
            `${relative(REPO, f)}: ${v.state}${v.state === "invalid" ? ` — ${v.problems.slice(0, 2).join("; ")}` : v.state === "undetermined" ? ` — ${v.reason}` : ""}`,
          );
        }
      }
    }
    expect(n).toBeGreaterThan(50);
    expect(offences).toEqual([]);
  }, 120_000);
});
