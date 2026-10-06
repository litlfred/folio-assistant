/**
 * `qa-criterion-source-file` tests whose subject is folio-assistant-sci's
 * contribution — the checkers this instance contributes for criteria declared
 * `checker_contributed` — moved here from
 * `cat-harness/scripts/tests/qa-criterion-source-file.test.ts` (bean `ho66`).
 * The code under test is cat-harness's, imported DOWN; what it is held against
 * is this instance's, so standing alone cat-harness has nothing for these to
 * read. The rest of that file's tests stay there.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

import { QA_CRITERIA_REGISTRY } from "../../../cat-harness/content/pipeline/qa-criteria-registry.ts";
import { checkerFunctionName } from "../../../cat-harness/content/pipeline/qa-checker-discovery.ts";
import {
  isCriterionSourceMiss,
  resolveCriterionSource,
} from "../../../cat-harness/content/pipeline/criterion-source.ts";
import { instanceRootsIn } from "../../../cat-harness/schemas/cat-harness.ts";
import { loadContributions } from "../../../cat-harness/schemas/harness-config.ts";
import {
  ContributionRegistry,
  type FolioContribution,
} from "../../../cat-harness/schemas/contributions.ts";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

const ROOT = resolve(ORIGIN_DIR, "../..");
const REPO = resolve(ROOT, "..");
const CHECKER_DIR = "content/pipeline";

/**
 * The dependency tree, so a CONTRIBUTED checker is found where it lives.
 *
 * Criteria declaring `checker_contributed` have their checkers in another
 * instance: `proof-compile-cost` and `proof-no-cost-regression` in
 * `folio-assistant-sci`, the five `dak-*` in `smart-base` (bean `1335`). Without
 * this the test would report them as having no checker anywhere — which is
 * what it says a defect looks like, so it would fail loudly rather than pass
 * vacuously, but for the wrong reason.
 */
const registry = await loadContributions<FolioContribution, ContributionRegistry>(
  REPO,
  new ContributionRegistry(),
);

/**
 * Every `qa-checkers-*.ts` in EVERY instance, discovered rather than listed.
 *
 * Globbing one directory was the previous version, and it stopped being
 * enough the moment a checker moved into another instance. Widening it to a
 * second hardcoded directory would reproduce the exact defect this test's own
 * header describes — an allow-list that falls through silently — so the
 * instance list comes from the declarations, and a checker file added in a
 * future contributor is covered without anyone remembering.
 *
 * Keys are the same labels `resolveCriterionSource` produces: bare and
 * repo-relative for core's own, `<contributor>/<path>` for a contributed one.
 */
function checkerFiles(): Array<{ label: string; abs: string }> {
  const out: Array<{ label: string; abs: string }> = [];
  for (const instance of instanceRootsIn(REPO)) {
    const dir = resolve(instance, CHECKER_DIR);
    if (!existsSync(dir)) continue;
    const name = instance.split("/").pop() ?? "";
    for (const f of readdirSync(dir).filter((x) => /^qa-checkers-.*\.ts$/.test(x))) {
      const rel = `${CHECKER_DIR}/${f}`;
      out.push({
        label: instance === ROOT ? rel : `${name}/${rel}`,
        abs: resolve(dir, f),
      });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

const sources = new Map<string, string>(
  checkerFiles().map((f) => [f.label, readFileSync(f.abs, "utf-8")]),
);

// The name convention is `qa-checker-discovery`'s, not this test's: discovery
// RESOLVES checkers by it at runtime, so a second copy here could drift and
// the drift would read as a passing test over a sweep that finds nothing.
const checkerFnName = checkerFunctionName;

/**
 * Files that contain `id`'s checker, by either dispatch style. Returns []
 * when none does — a real third state, reported rather than treated as
 * agreement.
 */
function hostFiles(id: string): string[] {
  const fn = checkerFnName(id);
  const out: string[] = [];
  for (const [f, s] of sources) {
    if (s.includes(`"${id}":`) || s.includes(`export function ${fn}(`)) out.push(f);
  }
  return out;
}

const automated = QA_CRITERIA_REGISTRY.filter((d) => d.automated);

describe("getCriterionSourceFile — declared source must host the checker", () => {
  test("the glob finds the checker files", () => {
    // Guards the guard. A renamed directory would otherwise leave every
    // criterion "undetermined" and let this suite pass on an empty set —
    // exactly how the hard-coded list hid three mismatches.
    expect(sources.size).toBeGreaterThanOrEqual(10);
  });

  test("every locatable automated criterion is hashed against its own file", () => {
    const mismatched: string[] = [];
    for (const def of automated) {
      // Asked through the ONE resolver the sweep uses, so this test cannot
      // agree with a path production does not take.
      const located = resolveCriterionSource(def.id, ROOT, registry);
      if (isCriterionSourceMiss(located)) {
        mismatched.push(`${def.id}: ${located.reason}`);
        continue;
      }
      const declared = located.label;
      const hosts = hostFiles(def.id);
      if (hosts.length === 0) continue; // reported separately below
      if (!hosts.includes(declared)) {
        mismatched.push(`${def.id}: declared ${declared}, found in ${hosts.join(", ")}`);
      }
    }
    // Named in the failure so a fix does not need a re-run to find them.
    expect(mismatched).toEqual([]);
  });

  test("an automated criterion with NO checker anywhere is a defect, not a pass", () => {
    // `qa-sweep` resolves `AUTOMATED_CHECKERS[id] ?? DAK_AUTOMATED_CHECKERS[id]`
    // and falls through to `needs-agent` when undefined. So `automated: true`
    // with no checker silently bills an agent adjudication for a check nobody
    // wrote, and is indistinguishable downstream from `automated: false`.
    //
    // `proof-no-placeholder-stub` was in exactly that state and is now
    // declared `automated: false`, which is what the runtime already did.
    const orphans = automated.filter((d) => hostFiles(d.id).length === 0);
    expect(orphans.map((d) => d.id)).toEqual([]);
  });
});

describe("a contributed checker cannot fall through to the default", () => {

  test("and the resolver answers for exactly those, from the contributor", () => {
    for (const def of QA_CRITERIA_REGISTRY.filter((d) => d.checker_contributed)) {
      const located = resolveCriterionSource(def.id, ROOT, registry);
      expect(isCriterionSourceMiss(located)).toBe(false);
      const src = located as { root: string; label: string };
      // Not this instance: that is what "contributed" has to mean, or the flag
      // is decoration and the move never happened.
      expect(src.root).not.toBe(ROOT);
      // Labelled `<contributor>/<path>` by the contributor that supplied it —
      // folio-assistant-sci for the cost checkers, smart-base for the DAK ones
      // since bean 1335.
      const who = registry.contributedQaCheckers().find((c) => c.criterion === def.id)?.contributor;
      expect(who).toBeDefined();
      expect(src.label.startsWith(`${who}/`)).toBe(true);
    }
  });
});
