#!/usr/bin/env bun
/**
 * Repo partition — Phase 0.2 of the separation-of-concerns migration (#223).
 *
 * Replaces the filename heuristic in `docs/architecture/current-state.md` with
 * a real import-graph partition. Answers two questions:
 *
 *   1. Which modules would land in each of the five proposed repositories?
 *   2. Which import edges cross a proposed boundary IN THE WRONG DIRECTION?
 *
 * Question 2 is the point. That cross-edge list is Phase I's worklist: every
 * entry is a module that must move, a dependency that must invert, or a
 * documented exception.
 *
 * ## Three states, not two
 *
 * A module this tool cannot classify is reported as `unassigned`, never
 * silently bucketed into core. Same discipline as `readme-sections.ts`: "could
 * not determine" is a distinct answer from "determined to be core", and
 * collapsing the two is how a wrong partition looks like a clean one.
 *
 * Every assignment carries its provenance:
 *
 *   - `rule`    — an explicit path rule. Trustworthy.
 *   - `triage`  — a per-file judgement someone made by hand, by the bean
 *                 `dh4f` question: does this read or write PLATFORM, or
 *                 CONTENT? Recorded separately from `rule` so a decision
 *                 stays visible as a decision, and can be revisited without
 *                 first working out which entries were judgements.
 *   - `keyword` — a domain keyword in the path. Probable, worth a human look.
 *   - `default` — fell through to core because nothing else claimed it.
 *                 This is the weakest signal in the report and is counted
 *                 separately so it cannot be mistaken for evidence.
 *
 * Usage:
 *   bun run cat-harness/scripts/repo-partition.ts                 # summary to stdout
 *   bun run cat-harness/scripts/repo-partition.ts --edges         # + every cross-edge
 *   bun run cat-harness/scripts/repo-partition.ts --markdown      # report as Markdown
 *   bun run cat-harness/scripts/repo-partition.ts --repo sci      # one repo's modules
 *   bun run cat-harness/scripts/repo-partition.ts --strict        # exit 1 if cross-edges
 *
 * @module scripts/repo-partition
 * @covers code — every module and every edge between them; a module it cannot classify is
 *   `unassigned` and a finding
 */

import { SPEC, REPOS } from "./partition/instance-rules.js";
import {
  analyse as analyseWith,
  classify as classifyWith,
  UNASSIGNED,
  type Assignment,
  type CrossEdge,
  type PartitionReport,
  type Provenance,
} from "./partition/engine.js";

// ── The CLI, and nothing else ───────────────────────────────────
//
// This file was 1,194 lines: the algorithm, this instance's 272 lines of
// exception data, and 532 lines of rationale for that data, in one module.
// The algorithm is now `partition/engine.ts` and takes a spec; the data is
// `partition/instance-rules.ts` and keeps every comment, positioned where it
// was. What is left here is argument handling and the report — the two parts
// that are genuinely about running the tool from a terminal.
//
// `classify` and `analyse` are re-exported at their old names and old arity,
// bound to this instance's spec. Nothing imports them today (the partition
// tool is standalone; every other mention of it in the tree is prose), but
// the gate is invoked by name from CI and by hand constantly, and a rename
// nobody needed is a rename that costs somebody a confused minute.

/** Classify one repo-relative path against THIS instance's rules. */
export function classify(relPath: string): Assignment {
  return classifyWith(SPEC, relPath);
}

/** Analyse THIS instance. */
export function analyse(): PartitionReport {
  return analyseWith(SPEC);
}

export type { Assignment, CrossEdge, PartitionReport, Provenance };
// ── Reporting ───────────────────────────────────────────────────

function repoName(id: string): string {
  return REPOS.find((r) => r.id === id)?.name ?? UNASSIGNED;
}

function main(): void {
  const args = process.argv.slice(2);
  const wantEdges = args.includes("--edges");
  const markdown = args.includes("--markdown");
  const strict = args.includes("--strict");
  const only = args[args.indexOf("--repo") + 1];

  const { modules, crossEdges, unresolvedEdges, totalEdges } = analyse();

  if (modules.size === 0) {
    console.error("repo-partition: scanned 0 modules — wrong root, or the tree moved.");
    process.exit(2);
  }

  if (only && args.includes("--repo")) {
    for (const [path, a] of [...modules].sort()) {
      if (a.repo === only) console.log(`${a.provenance.padEnd(8)} ${path}`);
    }
    return;
  }

  const H = markdown ? "## " : "";
  const counts = new Map<string, Record<Provenance, number>>();
  for (const [, a] of modules) {
    const key = a.repo;
    const c = counts.get(key) ?? { rule: 0, triage: 0, keyword: 0, default: 0 };
    c[a.provenance]++;
    counts.set(key, c);
  }

  console.log(`${H}Partition — ${modules.size} modules, ${totalEdges} internal import edges\n`);
  if (markdown) console.log("| repo | modules | by rule | hand-triaged | by keyword | fell through |\n|---|---:|---:|---:|---:|---:|");
  for (const id of [...REPOS.map((r) => r.id), "unassigned" as const]) {
    const c = counts.get(id) ?? { rule: 0, triage: 0, keyword: 0, default: 0 };
    const total = c.rule + c.triage + c.keyword + c.default;
    if (markdown) console.log(`| \`${repoName(id)}\` | ${total} | ${c.rule} | ${c.triage} | ${c.keyword} | ${c.default} |`);
    else console.log(`  ${repoName(id).padEnd(20)} ${String(total).padStart(4)}  (rule ${c.rule}, triage ${c.triage}, keyword ${c.keyword}, unclaimed ${c.default})`);
  }

  console.log(`\n${H}Wrong-direction edges: ${crossEdges.length}\n`);
  if (crossEdges.length > 0) {
    const byPair = new Map<string, CrossEdge[]>();
    for (const e of crossEdges) {
      const k = `${e.fromRepo}->${e.toRepo}`;
      byPair.set(k, [...(byPair.get(k) ?? []), e]);
    }
    if (markdown) console.log("| importer repo | imports from | edges |\n|---|---|---:|");
    for (const [pair, es] of [...byPair].sort((a, b) => b[1].length - a[1].length)) {
      const [f, t] = pair.split("->") as [string, string];
      if (markdown) console.log(`| \`${repoName(f)}\` | \`${repoName(t)}\` | ${es.length} |`);
      else console.log(`  ${repoName(f)} → ${repoName(t)}: ${es.length}`);
    }
    if (wantEdges) {
      const un = [...new Set(unresolvedEdges.flatMap((e) => [e.from, e.to]))]
        .filter((m) => modules.get(m)?.repo === "unassigned")
        .sort();
      if (un.length) console.log(`\n${markdown ? "### " : ""}Unassigned modules\n${un.map((m) => `  ${m}`).join("\n")}`);
      console.log(`\n${markdown ? "### " : ""}Every wrong-direction edge\n`);
      for (const e of crossEdges.sort((a, b) => a.from.localeCompare(b.from))) {
        console.log(`${markdown ? "- " : "  "}\`${e.from}\` (${repoName(e.fromRepo)}) → \`${e.to}\` (${repoName(e.toRepo)})`);
      }
    }
  }

  console.log(`\n${H}Edges touching an unassigned module: ${unresolvedEdges.length}`);
  console.log("These are not cross-edges — they are edges this tool declined to judge.");
  console.log("Classify the endpoints, then re-run; do not read them as clean.");

  // ── What this gate ENFORCES. Both axes, as of 2026-09-20.
  //
  // `check:partition` ran in CI WITHOUT `--strict`, so its only failing path
  // was one nothing invoked: it reported 8 wrong-direction edges and exited 0
  // while the board read 43/43, and three of those edges had been introduced
  // that morning. A gate that CANNOT fail is indistinguishable, from the
  // outside, from one that passed — bean `xom7`, one level up from the
  // workflow it was written about.
  //
  // The repository's precedent for switching a reporter into an enforcer is
  // the ruff comment in `code-quality-gates.yml`: **a check is an error only
  // once its count is zero.** Turning a red gate on just teaches the next
  // agent to append `|| true`.
  //
  // So it was applied per axis as each reached zero. Unassigned reached zero
  // first (bean `4j3h`) and was enforced then; the comment there said to
  // delete the distinction once the edges followed. They have — `jcmx`
  // retired the last one, `src/types.ts -> schemas/types.ts`, by declaring
  // the structural minimum a harness signature needs instead of importing
  // the content model. Both axes are now zero and both are enforced.
  //
  // `--strict` is kept as an accepted no-op so existing invocations do not
  // break; there is no longer a laxer mode for it to select.
  const unassigned = [...modules].filter(([, a]) => a.repo === "unassigned").map(([m]) => m);
  let failed = false;
  if (unassigned.length > 0) {
    failed = true;
    console.error(`\n\u2717 ${unassigned.length} module(s) fell through every rule:`);
    for (const m of unassigned.sort()) console.error(`    ${m}`);
    console.error("    Classify each in REPO_RULES. An unassigned module is not a clean result.");
  }
  if (crossEdges.length > 0) {
    failed = true;
    console.error(`\n\u2717 ${crossEdges.length} wrong-direction edge(s):`);
    for (const e of crossEdges) {
      console.error(`    ${e.from} [${repoName(e.fromRepo)}] -> ${e.to} [${repoName(e.toRepo)}]`);
    }
    console.error(
      "    A repo may not import one that depends on it. Either the CLASSIFICATION is wrong —" +
        "\n    check the target's layer before the importer's — or the import is.",
    );
  }
  if (failed) process.exit(1);
  void strict;
}

if (import.meta.main) main();
