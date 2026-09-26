/**
 * A criterion's declared `source_file` must be the file that actually
 * contains its checker.
 *
 * ## Why this test exists
 *
 * `getCriterionSourceFile()` resolves the path that `script_hash` is computed
 * over. That hash is the ONLY thing that makes a cached sidecar verdict go
 * stale when checker logic changes (`schemas/block-qa.ts` →
 * `QaReviewer.script_hash`).
 *
 * So a criterion pointed at a file that does not contain its checker never
 * invalidates. Its verdicts stay "fresh" indefinitely, and editing the real
 * checker changes nothing — the sweep keeps serving the answer it cached.
 * There is no error, no warning, and no symptom except a number that will
 * not move. A wrong `pass` is believed; a verdict that CANNOT GO STALE is
 * worse, because nothing about it ever looks wrong.
 *
 * Measured on `main`, 2026-09-18 (bean `b7yo`): 11 of 59 automated criteria
 * were in that state. Found by accident — a fix to `checkAuthorNotesPollution`
 * did not change its verdict, because the sidecar was hashing a file the fix
 * never touched.
 *
 * ## Why the candidate list is globbed, not written down
 *
 * The first version of this test hard-coded seven checker files. There are
 * TEN. `qa-checkers-render.ts`, `qa-checkers-q-usage.ts` and
 * `qa-checkers-vacuity.ts` were absent, so every criterion in them read as
 * "dispatcher not found" and was waved through — and that silence hid THREE
 * REAL MISMATCHES (`lean-no-vacuous-instance-data`,
 * `lean-no-definitional-laundering`, `lean-docstring-honesty`, all
 * dispatching from `qa-checkers-vacuity.ts` while declaring
 * `qa-checkers-extended.ts`).
 *
 * That is the same defect the test was written to catch — an allow-list that
 * falls through silently — reproduced in the guard itself. Hence the glob: a
 * checker file added tomorrow is covered without anyone remembering to add
 * it. Bean `fg6z`.
 *
 * ## Two dispatch styles, both covered
 *
 * 1. a dispatch-table entry keyed `"<criterion-id>":` (the voice / DAK / uses
 *    checkers); and
 * 2. an exported `check<PascalCaseId>` function called by name — how the ten
 *    `script-quality` Python criteria work. Probing only for (1) reported all
 *    ten as unlocatable when their `source_file` was in fact correct.
 *
 * Run via `bun test`.
 */
import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";

import { QA_CRITERIA_REGISTRY } from "../../content/pipeline/qa-criteria-registry.ts";
import { checkerFunctionName } from "../../content/pipeline/qa-checker-discovery.ts";
import {
  isCriterionSourceMiss,
  resolveCriterionSource,
} from "../../content/pipeline/criterion-source.ts";
import { instanceRootsIn } from "../../schemas/cat-harness.ts";
import { loadContributions } from "../../schemas/harness-config.ts";
import {
  ContributionRegistry,
  type FolioContribution,
} from "../../schemas/contributions.ts";

const ROOT = resolve(import.meta.dir, "../..");
const REPO = resolve(ROOT, "..");
const CHECKER_DIR = "content/pipeline";

/**
 * The dependency tree, so a CONTRIBUTED checker is found where it lives.
 *
 * Two criteria (`proof-compile-cost`, `proof-no-cost-regression`) declare
 * `checker_contributed`; their checkers are `folio-assistant-sci`'s. Without
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

  test("there are automated criteria to check", () => {
    expect(automated.length).toBeGreaterThan(40);
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
  test("the cascade REFUSES a checker_contributed criterion", async () => {
    // The whole hazard of this move, made unreachable rather than avoided.
    // Dropping a criterion from the cascade would land it on
    // `qa-checkers-extended.ts`, and `script_hash` over the wrong file is a
    // verdict that can never go stale — the state this file's header was
    // written about.
    const { getCriterionSourceFile } = await import(
      "../../content/pipeline/qa-criteria-registry.ts"
    );
    const contributed = QA_CRITERIA_REGISTRY.filter((d) => d.checker_contributed);
    expect(contributed.length).toBeGreaterThan(0);
    for (const def of contributed) {
      expect(() => getCriterionSourceFile(def.id)).toThrow(/checker_contributed/);
    }
  });

  test("and the resolver answers for exactly those, from the contributor", () => {
    for (const def of QA_CRITERIA_REGISTRY.filter((d) => d.checker_contributed)) {
      const located = resolveCriterionSource(def.id, ROOT, registry);
      expect(isCriterionSourceMiss(located)).toBe(false);
      const src = located as { root: string; label: string };
      // Not this instance: that is what "contributed" has to mean, or the flag
      // is decoration and the move never happened.
      expect(src.root).not.toBe(ROOT);
      expect(src.label.startsWith("folio-assistant-sci/")).toBe(true);
    }
  });
});
