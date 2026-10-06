/**
 * An instance staged here ahead of leaving for its own repository reaches the
 * platform through ONE file: its `platform.ts`.
 *
 * `check:import-direction` already asks whether an instance CAN be lifted out:
 * nothing it loads may live outside what it `needs`. This asks the next
 * question, the one the move itself pays for — how many edits does it take?
 * Every relative import that climbs out of the instance directory is one, and
 * the smart-* plan names the cost of missing one
 * (`cat-harness/docs/proposals/smart-separation-2026-10-01.md`, "a gate that
 * cannot pass in a fork"). So the climb happens in one place,
 * `<instance>/platform.ts`, re-exporting what the instance uses — a folio's
 * `../schemas/builders` shim, for the same reason — and re-pointing the
 * platform is a one-file edit.
 *
 * **Every staged instance, not only the ones that opted in.** Until
 * 2026-10-04 the rule applied only to an instance that already had a
 * `platform.ts`, so an instance with ONE climb and no shim was invisible to
 * it — and that is exactly the climb PR #2082 measured failing in the seeded
 * smart-trust fork (`pages-markdown.test.ts` → `fhir-harness/…`). Opt-in made
 * the guard silent in the one case it exists for. Now every instance whose
 * declaration names a `repository` other than its `livesAt` is covered, with
 * two explicit, checked lists:
 *
 * - `PLATFORM_LAYERS` — the layers other instances build ON (cat-harness,
 *   folio-assistant-core, fhir-harness, …). They import EACH OTHER by design
 *   and are governed by `check:import-direction` and the separation arc;
 *   requiring a shim of them would be a second, louder answer to a question
 *   already answered.
 * - `NOT_YET_SHIMMED` — a covered instance that still climbs, with its count
 *   as a ceiling that may only fall. A new climb anywhere else fails.
 *
 * Both lists are checked against the declarations, so a stale name fails
 * rather than exempting nothing.
 *
 * Measured 2026-10-02: six climbs in three files before stage D (#1767)
 * moved smart-trust's themes/ and the DAK schemas and scripts into
 * smart-base; after it, 25 climbs in 10 smart-base files, all now through
 * smart-base/platform.ts. Later the same day main moved the DAK block and QA
 * code in as well, and 17 more arrived with the merge, also rerouted. A merge
 * from main is where new climbs arrive, so this test failing after one is the
 * expected signal to reroute them, not a regression in the rule.
 *
 * @module cat-harness/scripts/tests/instance-separation-imports.test
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { specifiersOf } from "../../../bootstrap-tools/scripts/check-closure.js";
import { declarationPathIn } from "../../schemas/cat-harness.js";
import { inAggregate } from "../../test/support/checkout.js";

const ROOT = resolve(import.meta.dir, "..", "..", "..");
const SHIM = "platform.ts";
const CODE = /\.(ts|tsx|mts|js|mjs)$/;

/** Instances that declare a `repository` other than the one they live in. */
function stagedInstances(): string[] {
  const out: string[] = [];
  for (const e of readdirSync(ROOT, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const decl = declarationPathIn(join(ROOT, e.name));
    if (!decl || !existsSync(decl)) continue;
    try {
      const d = JSON.parse(readFileSync(decl, "utf-8")) as { repository?: string; livesAt?: { repository?: string } };
      if (d.repository && d.livesAt?.repository && d.repository !== d.livesAt.repository) out.push(e.name);
    } catch {
      // an unparseable declaration is `kg:schema:check`'s finding, not this one's
    }
  }
  return out.sort();
}

/** The instance's code files, as git tracks them. */
function codeFiles(instance: string): string[] {
  const ls = spawnSync("git", ["ls-files", "-z", "--", instance], { cwd: ROOT, encoding: "utf-8" });
  if (ls.status !== 0) throw new Error(`git ls-files ${instance} failed: ${ls.stderr}`);
  return ls.stdout.split("\0").filter((f) => f && CODE.test(f) && !f.split("/").includes("node_modules"));
}

/** Each relative import in `instance` (other than its shim) that resolves outside it. */
function climbsOutOf(instance: string): string[] {
  const home = join(ROOT, instance);
  const out: string[] = [];
  for (const rel of codeFiles(instance)) {
    if (rel === `${instance}/${SHIM}`) continue;
    const abs = join(ROOT, rel);
    for (const spec of specifiersOf(readFileSync(abs, "utf-8"))) {
      if (!spec.startsWith(".")) continue;
      const inside = relative(home, resolve(dirname(abs), spec));
      if (inside.startsWith("..")) out.push(`${rel} → ${spec}`);
    }
  }
  return out;
}

/**
 * Staged instances that are platform, not content: other instances build on
 * them, and they import each other by design (see the module doc).
 */
const PLATFORM_LAYERS = new Set([
  "cat-harness",
  "cat-harness-tools",
  "cat-openapi",
  "fhir-harness",
  "folio-assistant-core",
  "folio-assistant-sci",
]);

/**
 * Covered instances that still climb without a shim, each with its measured
 * climb count as a CEILING. Lower it when climbs are rerouted; remove the
 * entry when it reaches zero. who-iris was 18 on 2026-10-04, 19 when this
 * guard reached `main` on 2026-10-05, 7 later that day (issue #2228, bean
 * `lffo`), and 0 on 2026-10-06 (bean `g8jp`), when its theme module and
 * three tests moved onto `who-iris/platform.ts` — so it left this list.
 */
const NOT_YET_SHIMMED: Record<string, number> = {};

/**
 * The SHIM's own climbs, per instance, that land outside every instance the
 * declaration `needs` — a ceiling that may only fall, like the one above.
 *
 * A shim that routes every climb but reaches past what its instance declares
 * still cannot leave: the lifted repository mounts what it `needs` and
 * nothing else, so a climb into a layer reached only transitively resolves to
 * nothing there. Owner, 2026-10-06 (bean `g8jp`): *"who-iris depends on
 * folio-asst-core"* — never on cat-harness directly; a symbol from a lower
 * layer comes through the needed layer's own surface
 * (`folio-assistant-core/scripts/platform.ts`). who-iris is held at zero by
 * being absent from this map. smart-base and smart-trust were measured, not
 * fixed, when the check landed; their cutover (PR #2320) retires both.
 */
const SHIM_BEYOND_NEEDS: Record<string, number> = {
  "smart-base": 31,
  "smart-trust": 2,
};

/** The instances `instance`'s declaration `needs`. */
function needsOf(instance: string): string[] {
  const decl = declarationPathIn(join(ROOT, instance));
  if (!decl || !existsSync(decl)) return [];
  const d = JSON.parse(readFileSync(decl, "utf-8")) as { needs?: string[] };
  return d.needs ?? [];
}

/** Each relative import in `instance/platform.ts` that lands outside the instance AND every instance it `needs`. */
function shimClimbsBeyondNeeds(instance: string): string[] {
  const shim = join(ROOT, instance, SHIM);
  if (!existsSync(shim)) return [];
  const allowed = [instance, ...needsOf(instance)].map((i) => join(ROOT, i));
  const out: string[] = [];
  for (const spec of specifiersOf(readFileSync(shim, "utf-8"))) {
    if (!spec.startsWith(".")) continue;
    const target = resolve(dirname(shim), spec);
    if (!allowed.some((a) => !relative(a, target).startsWith(".."))) out.push(`${instance}/${SHIM} → ${spec}`);
  }
  return out;
}

// Every subject here is ANOTHER instance's code (smart-base, smart-trust,
// who-iris), so the guard has nothing to read when cat-harness stands alone
// (bean `ho66`): skipped visibly there rather than failing or passing vacuously.
describe.skipIf(!inAggregate())("staged instances reach the platform only through platform.ts", () => {
  const staged = stagedInstances();
  const covered = staged.filter((i) => !PLATFORM_LAYERS.has(i));

  test("every exempted name is a staged instance (no list exempts nothing)", () => {
    const listed = [...PLATFORM_LAYERS, ...Object.keys(NOT_YET_SHIMMED), ...Object.keys(SHIM_BEYOND_NEEDS)];
    expect(listed.filter((i) => !staged.includes(i))).toEqual([]);
    expect(Object.keys(NOT_YET_SHIMMED).filter((i) => PLATFORM_LAYERS.has(i))).toEqual([]);
  });

  test("smart-base and smart-trust are covered and route through a shim (the rule is not vacuous)", () => {
    // smart-trust had no shim from stage D (#1767) until 2026-10-04, and the
    // opt-in guard let its one climb through — the one PR #2082 measured
    // failing in the fork. Pinned so that cannot recur quietly.
    for (const i of ["smart-base", "smart-trust"]) {
      expect(covered).toContain(i);
      expect(existsSync(join(ROOT, i, SHIM))).toBe(true);
    }
  });

  test("in every covered instance, no file but platform.ts imports from outside it", () => {
    // The whole list on a failure: each line is an edit the separation would
    // have to find, and the fix is to route it through `<instance>/platform.ts`
    // (create one if the instance has none).
    const climbs = covered.filter((i) => !(i in NOT_YET_SHIMMED)).flatMap(climbsOutOf);
    expect(climbs).toEqual([]);
  });

  test("a not-yet-shimmed instance never gains a climb", () => {
    for (const [i, ceiling] of Object.entries(NOT_YET_SHIMMED)) {
      const n = climbsOutOf(i).length;
      expect({ instance: i, climbs: n, overCeiling: n > ceiling, shimmed: n === 0 }).toEqual({
        instance: i,
        climbs: n,
        overCeiling: false,
        shimmed: false,
      });
    }
  });

  test("every shim reaches only the instances its declaration needs", () => {
    // who-iris is the case this exists for: it `needs` folio-assistant-core
    // and reaches cat-harness only through core's surface. The whole list on
    // a failure — each line is a symbol to re-export from the needed layer.
    const beyond = covered.filter((i) => !(i in SHIM_BEYOND_NEEDS)).flatMap(shimClimbsBeyondNeeds);
    expect(beyond).toEqual([]);
    expect(covered).toContain("who-iris");
    expect(needsOf("who-iris")).toEqual(["folio-assistant-core"]);
  });

  test("an instance over the needs line never gains a climb past it", () => {
    for (const [i, ceiling] of Object.entries(SHIM_BEYOND_NEEDS)) {
      const n = shimClimbsBeyondNeeds(i).length;
      expect({ instance: i, beyond: n, overCeiling: n > ceiling }).toEqual({ instance: i, beyond: n, overCeiling: false });
    }
  });
});
