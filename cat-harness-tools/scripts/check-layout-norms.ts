#!/usr/bin/env bun
/**
 * No declared directory sits inside another declared directory.
 *
 * ## The norm, in one sentence
 *
 * An instance's assets live at `<stub>/<asset>` — `cat-harness/skills/`,
 * `who-iris/library/`, `smart-base/methodologies/`. The owner, 2026-09-22:
 * *"dont bury sub-graph assets. same for `<stub>/skills`, etc."*
 *
 * ## What it measures, against the owner's NEWER ruling
 *
 * #980, 2026-09-22, ruled after this check was written: nesting IS allowed,
 * *"if there is a (Sub?)KGraph node within the first subdir that labels all the
 * other ones that exist within it"*, and a root declaration reaching down a
 * multi-level path is NOT allowed.
 *
 * This check measures the second half. Every pair it finds is two entries in a
 * ROOT declaration, one containing the other — precisely the forbidden shape —
 * so the two rulings agree on every case in the corpus today.
 *
 * **It does not yet know about the from-within node, and must learn it.** That
 * node's kind and name are explicitly left open to the owner, so nothing can
 * declare nesting from within today and no legitimate structure is being
 * flagged. The day it lands, a nesting it describes is sanctioned and this
 * check must stop reporting it, or it becomes an obstacle to the mechanism the
 * owner chose. Written down here rather than left to be rediscovered as a
 * false finding.
 *
 * ## Why the check is "nested inside another DECLARED directory"
 *
 * Depth is the wrong test and would produce false findings immediately.
 * `who-iris/library/` is two segments from the repository root and is exactly
 * right; `test/results/` is two segments from its instance root and is also
 * fine, because `test/` is not a graph. What is actually wrong is a declared
 * directory **contained by another declared directory** — then a consumer
 * scanning the outer one has to decide whether the inner one's nodes are also
 * its own, which is bean `x4v4`'s question, and every count computed from that
 * sweep depends on the answer.
 *
 * That relation is already derived, by `subgraphTree`, from the declared paths
 * and nothing else. So this check computes no geometry of its own: it asks the
 * schema the question the schema already answers, and reports the pairs.
 *
 * ## Enforcement is a RATCHET, not a gate on the whole corpus
 *
 * Four instances nest `skills/voices` inside `skills/` today — `agent-skills`,
 * `folio-assistant-core`, `folio-assistant-sci` and `who-iris` (which took
 * them over from `who-style-guide`, bean `qsx4`). (Three,
 * said this line when it was written from a hand audit; the check found the
 * fourth. The baseline is the list, not this sentence.) Failing on those
 * would make this the "check that cries wolf is a check somebody switches off"
 * failure `known-skills.ts` names, on its first run, over other people's
 * instances.
 *
 * So known pairs sit in a committed baseline and **anything not in it fails**.
 * `cat-harness` reached zero on 2026-09-22 and the baseline holds none of its
 * pairs, so any new nesting there is refused immediately. That is the same
 * shape `check-declared-paths` uses, chosen for the same reason: a corpus with
 * outstanding work still gets a gate against making it worse.
 *
 * Removing a pair is progress and is NOT a failure — it prints as fixed, and
 * `--update` rewrites the baseline so the diff somebody reviews is the
 * shrinking list.
 *
 * Usage:
 *   bun run check:layout-norms
 *   bun run check:layout-norms -- --update    # rewrite the baseline
 *   bun run check:layout-norms -- --json      # sidecar only
 *   bun run check:layout-norms:check          # JUDGE: compute and judge, write nothing (the gate)
 *
 * Exit: 0 clean (or only known pairs), 1 a pair not in the baseline,
 *       2 could not determine. Judge mode (`--check`, bean `bo44`) keeps the
 *       same table and adds 2 for an unknown flag or a run that threw.
 *
 * @module scripts/check-layout-norms
 * @covers cat-harness
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
  resolveDirectories,
  subgraphTree,
} from "../../cat-harness/schemas/cat-harness.ts";
import {
  buildQaResult,
  concludeJudgement,
  judgementOf,
  judgeUsage,
  judging,
  writeQaResult,
  type Judgement,
  type QaResult,
} from "../../cat-harness/scripts/qa-results.ts";
import { HARNESS_ROOT } from "./lib/roots.ts";

const INSTANCE_ROOT = HARNESS_ROOT;
const REPO_ROOT = repoRootFor(INSTANCE_ROOT);

/**
 * Known pairs, committed.
 *
 * Beside this module rather than in the declaration: it records what has NOT
 * been done yet, which is a property of the work rather than of the graph, and
 * a declaration that carried its own exceptions would be asserting them as
 * intended layout.
 */
const BASELINE = join(INSTANCE_ROOT, "scripts", "layout-norms-baseline.json");

/**
 * `<instance>: <outer path> contains <inner path>` — the stable spelling of a pair.
 *
 * KEYED ON PATHS, NOT IDS, and that is a correction rather than a preference.
 * `resolveDirectories` merges an instance's DECLARED directories with the
 * conventional ones, existence-filtered. Where an instance declares a
 * directory the convention also supplies — `agent-skills` declares
 * `skills/voices/` while `skills/` arrives as the default `cat-harness` entry
 * — the same physical nesting surfaces under more than one id, and an
 * id-keyed report counted a fixture's single nesting FOUR times.
 *
 * A nesting is a fact about two directories. Two ids for one directory is a
 * property of how the set was assembled, and letting it into the count would
 * make the number this check reports meaningless — the "never quote a count
 * from prose" rule, arriving in a script instead.
 */
export function pairKey(instance: string, parentPath: string, childPath: string): string {
  const trim = (p: string): string => p.replace(/\/+$/, "");
  return `${instance}: ${trim(parentPath)} contains ${trim(childPath)}`;
}

export interface LayoutReport {
  undetermined: boolean;
  instances: number;
  /** Every nested pair found, as `pairKey` strings. */
  found: string[];
  /** Found and not in the baseline — these fail. */
  unexpected: string[];
  /** In the baseline and no longer found — progress, never a failure. */
  fixed: string[];
}

export function readBaseline(file = BASELINE): string[] {
  if (!existsSync(file)) return [];
  const raw = JSON.parse(readFileSync(file, "utf-8")) as { pairs?: string[] };
  return raw.pairs ?? [];
}

export function checkLayoutNorms(repoRoot = REPO_ROOT, baselineFile = BASELINE): LayoutReport {
  const roots = instanceRootsIn(repoRoot);
  const r: LayoutReport = {
    undetermined: roots.length === 0,
    instances: 0,
    found: [],
    unexpected: [],
    fixed: [],
  };
  if (r.undetermined) return r;

  for (const root of roots) {
    const decl = readDeclaration(root);
    if (decl === undefined) continue;
    r.instances += 1;
    const name = decl.name ?? basename(root);
    const dirs = resolveDirectories([{ name, root, own: true }]);
    const pathOf = new Map(dirs.map((d) => [d.id, d.path]));
    // Nesting declared FROM WITHIN (the owner's #980 ruling; bean cmsl): the
    // inner directory is named by a declaration file inside the outer one, so
    // the pair is the sanctioned shape and never a finding.
    const withinOf = new Map(dirs.map((d) => [d.id, d.within]));
    for (const rel of subgraphTree(dirs)) {
      const parentPath = pathOf.get(rel.parent);
      if (parentPath === undefined) continue;
      for (const child of rel.children) {
        const childPath = pathOf.get(child);
        if (childPath === undefined) continue;
        // By PATH, not id: two ids may name one directory (core's `core-skills`
        // and the default `skills` are both `skills/`), and the nesting is a
        // fact about the place.
        const within = withinOf.get(child);
        if (within !== undefined && pathOf.get(within) === parentPath) continue;
        r.found.push(pairKey(name, parentPath, childPath));
      }
    }
  }
  // Deduplicated: see `pairKey` on why one nesting can surface under several ids.
  r.found = [...new Set(r.found)].sort();

  const known = new Set(readBaseline(baselineFile));
  r.unexpected = r.found.filter((p) => !known.has(p));
  const seen = new Set(r.found);
  r.fixed = [...known].filter((p) => !seen.has(p)).sort();
  return r;
}

/** The sidecar document for a report. Pure, so the judge and the writer render ONE computation. */
export function layoutNormsDocument(r: LayoutReport): QaResult {
  return buildQaResult({
    script: "cat-harness/scripts/check-layout-norms.ts",
    scriptAbsPath: fileURLToPath(import.meta.url),
    subject: { kind: "corpus", id: "declared-directories" },
    families: {
      "nested-declaration": {
        summary:
          "A declared directory contained by another declared directory — an asset buried below its " +
          "stub instead of sitting at `<stub>/<asset>`. A consumer scanning the outer graph must then " +
          "decide whether the inner one's nodes are also its own (bean `x4v4`), and every count " +
          "computed from that sweep depends on the answer. Known pairs are baselined so outstanding " +
          "work does not fail the gate; a pair not in the baseline does.",
        entries: r.found.map((pair) => ({ pair, known: !r.unexpected.includes(pair) })),
      },
    },
  });
}

/** Bean `bo44`'s four states over a report: only a pair NOT in the baseline is a finding. */
export function judgeLayoutNorms(r: LayoutReport): Judgement {
  return judgementOf({ failing: r.unexpected.length, undetermined: r.undetermined });
}

if (import.meta.main) {
  const GATE = "check:layout-norms";
  if (judging()) {
    // Judge mode: compute, judge, write NOTHING — neither the sidecar nor the
    // baseline (bean `bo44`). `--update` is a writer's flag and is refused here.
    const usage = judgeUsage(GATE, process.argv.slice(2), []);
    if (usage !== undefined) process.exit(usage);
    let jr: LayoutReport;
    try {
      jr = checkLayoutNorms();
    } catch (e) {
      process.exit(concludeJudgement({ gate: GATE, judgement: "error", detail: (e as Error).message }));
    }
    for (const p of jr.unexpected) console.error(`  ✗ not in the baseline: ${p}`);
    for (const p of jr.fixed) console.log(`  ✓ FIXED, no longer nested: ${p} (shrink the baseline with --update)`);
    process.exit(
      concludeJudgement({
        gate: GATE,
        judgement: judgeLayoutNorms(jr),
        detail: jr.undetermined
          ? "no instance declaration found under the repository root"
          : `${jr.instances} instance(s), ${jr.found.length} nested pair(s), ${jr.unexpected.length} not baselined`,
        ...(jr.undetermined
          ? {}
          : { committed: { root: INSTANCE_ROOT, stem: "layout-norms", fresh: layoutNormsDocument(jr), writer: GATE } }),
      }),
    );
  }

  const r = checkLayoutNorms();

  if (r.undetermined) {
    console.error("UNDETERMINED: no instance declaration found under the repository root.");
    console.error("This is not a pass — nothing was checked.");
    process.exit(2);
  }

  writeQaResult(INSTANCE_ROOT, "layout-norms", layoutNormsDocument(r));

  if (process.argv.includes("--update")) {
    writeFileSync(
      BASELINE,
      `${JSON.stringify(
        {
          _comment:
            "Nested declared directories that EXIST and are not yet resolved. Not intended layout — " +
            "see scripts/check-layout-norms.ts. Anything not listed here fails the check, so this file " +
            "only ever shrinks. Written by `bun run check:layout-norms -- --update`.",
          pairs: r.found,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Baseline written: ${r.found.length} known pair(s).`);
    process.exit(0);
  }

  if (!process.argv.includes("--json")) {
    console.log(`layout norms — ${r.instances} instance declaration(s) read\n`);
    if (r.found.length === 0) {
      console.log("  ✓ no declared directory sits inside another, in any instance");
    }
    for (const p of r.found) {
      console.log(`  ${r.unexpected.includes(p) ? "✗" : "·"} ${p}`);
    }
    for (const p of r.fixed) console.log(`  ✓ FIXED, no longer nested: ${p}`);
    if (r.fixed.length > 0) {
      console.log("\n  Re-run with --update to shrink the baseline — the diff is the progress.");
    }
    if (r.unexpected.length > 0) {
      console.log(
        `\n  ${r.unexpected.length} pair(s) not in the baseline. An asset belongs at ` +
          "`<stub>/<asset>`; a package subdirectory of an already-declared graph needs no " +
          "declaration of its own, and a second one declares the directory twice.",
      );
    }
  }

  if (r.unexpected.length > 0) process.exit(1);
}
