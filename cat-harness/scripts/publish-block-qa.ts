#!/usr/bin/env bun
/**
 * publish-block-qa — a folio's per-block QA verdicts, summarised into ONE
 * file a staging preview can publish. Bean `qbfi`, option 2.
 *
 * ## Why
 *
 * The review page's heat map had a QA column that could only say "not
 * published yet": the verdicts exist, as committed `block-qa/v1` sidecars in
 * the folio's repository, but no preview carried them. The owner chose to
 * publish them ("1 2"). This reads the committed sidecars; it runs no
 * checker and writes no verdict. It reports what the sweep last recorded.
 *
 * ## Four states per block, and a stale verdict is NOT a pass
 *
 * - `failing`: a FRESH verdict failed (with its severities).
 * - `stale`: nothing fresh failed, but at least one criterion's latest verdict
 *   predates the block's current files. Stale outranks passing.
 * - `passing`: every criterion's latest verdict is fresh, and none failed.
 * - `unaudited`: no sidecar at all.
 *
 * ## "Passing" says what was judged (bean `9791`)
 *
 * The sweep runs only criteria a script can check. The ones that need an
 * agent's judgement (voice traps, exposition clarity, adversarial review) are
 * reported as `needs-agent` and never written, so a block could read
 * "passing" with a third of its criteria never given a verdict. Each block
 * therefore also carries `needsAgent`: the applicable criteria DECLARED
 * `automated: false` that have no fresh verdict. Which criteria those are
 * comes from each criterion's own declaration, gated as the sweep gates it
 * (`applies_to` and the folio's active voices), never from a list here. A
 * verdict never given is not a pass.
 *
 * Freshness is the sweep's own rule (`summariseFreshness`: the criterion's
 * dependency hashes against the block's current files), not a second one.
 * A verdict older than its block rendered as a pass is the exact failure
 * this repository's QA design exists to prevent.
 *
 * ## Where the verdicts are: the instance root, and one transition read
 *
 * `blockQaPath` puts verdicts under `test/results/block-qa/` relative to the
 * INSTANCE root, and since bean `s3p2` (2026-09-23) the sweep anchors there.
 * Before that fix, a sweep of `folio/` anchored at `folio/` itself, because
 * the old walk stopped at the first directory whose ANCESTORS had a config,
 * and wrote `folio/test/results/block-qa/…`. A folio swept before the fix
 * still has its verdicts there. So this reads the instance root first and the
 * swept directory second. A summary that looked in one place would report
 * every such block unaudited, which reads as "nobody checked" when somebody
 * did. The legacy sibling beside each block is read by `existingBlockQaPath`
 * in both cases.
 *
 * ## Output
 *
 * `folio-block-qa-summary/v1`: `{ blocks: { <label>: { state, fails, warns,
 * worst, staleCriteria } }, counts }`. Keyed by label, which is how the
 * review page and `blocks.json` key everything.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { existingBlockQaPath, findContentRepoRoot } from "../content/pipeline/qa-paths.js";
import { hashBlockFiles, loadQaReport, summariseFreshness, walkBlocks } from "../content/pipeline/qa-utils.js";
import { usesGraphHash } from "../content/pipeline/uses-graph-hash.js";
import { qaCriteriaByIdFor, qaCriteriaFor } from "../content/pipeline/qa-criteria-registry.js";
import { voiceExcludesCriterion, type QaCriterionDefinition } from "../schemas/block-qa.js";
import { readActiveVoices } from "../schemas/voices.js";

export const BLOCK_QA_SUMMARY_SCHEMA = "folio-block-qa-summary/v1" as const;

export type BlockQaState = "failing" | "passing" | "stale" | "unaudited";
const SEVERITY_ORDER = ["critical", "major", "minor"] as const;
type Severity = (typeof SEVERITY_ORDER)[number];

export interface BlockQaSummary {
  state: BlockQaState;
  /** Fresh failing criteria. */
  fails: number;
  /** Fresh warning criteria. */
  warns: number;
  /** The worst severity among fresh fails and warns, or null. */
  worst: Severity | null;
  /** Criteria whose most recent verdict is stale. */
  staleCriteria: number;
  /**
   * Applicable criteria declared `automated: false` with no fresh verdict: an
   * agent's judgement was never given (bean `9791`). A `passing` block with
   * this above zero is passing on its script-checkable criteria only.
   */
  needsAgent: number;
}

export interface BlockQaSummaryFile {
  $schema: typeof BLOCK_QA_SUMMARY_SCHEMA;
  blocks: Record<string, BlockQaSummary>;
  counts: Record<BlockQaState, number>;
  /** Of the `passing` blocks, how many pass on script-checkable criteria only. */
  passingScriptsOnly: number;
}

/**
 * The criteria an agent must judge on a block of `kind`: declared
 * `automated: false`, applying to the kind, and not excluded by the folio's
 * voices. The same gates the sweep applies before it reports `needs-agent`.
 */
export function agentCriteriaFor(
  criteria: readonly QaCriterionDefinition[],
  kind: string,
  activeVoices: readonly string[] | undefined,
): string[] {
  return criteria
    .filter((c) => !c.automated)
    .filter((c) => !c.applies_to || c.applies_to.includes(kind))
    .filter((c) => !voiceExcludesCriterion(c, activeVoices))
    .map((c) => c.id);
}

/** Summarise one report against the block's current file hashes. Pure. */
export function summariseBlock(
  report: ReturnType<typeof loadQaReport>,
  current: ReturnType<typeof hashBlockFiles>,
  agentCriteria: readonly string[] = [],
  criteriaById?: Record<string, QaCriterionDefinition>,
): BlockQaSummary {
  if (!report) return { state: "unaudited", fails: 0, warns: 0, worst: null, staleCriteria: 0, needsAgent: agentCriteria.length };
  let fails = 0;
  let warns = 0;
  let stale = 0;
  let fresh = 0;
  let worst: Severity | null = null;
  const rank = (s: Severity | undefined) => (s ? SEVERITY_ORDER.indexOf(s) : SEVERITY_ORDER.length);
  const judged = new Set<string>();
  for (const f of summariseFreshness(report, current, undefined, criteriaById)) {
    const last = f.most_recent;
    if (!last) continue;
    if (!f.fresh_entries.includes(last)) {
      stale++;
      continue;
    }
    fresh++;
    judged.add(f.criterion);
    if (last.result === "fail") fails++;
    else if (last.result === "warn") warns++;
    else continue;
    const sev = last.severity ?? (last.result === "fail" ? "major" : "minor");
    if (rank(sev) < rank(worst ?? undefined)) worst = sev;
  }
  // Failing outranks stale, and stale outranks passing: a block whose prose
  // changed after its checks is not "passing" because its manifest-only checks
  // are still fresh. Measured: after one sentence was added to a swept block,
  // 24 criteria went stale and it still read "passing".
  const state: BlockQaState = fails > 0 ? "failing" : stale > 0 ? "stale" : fresh > 0 ? "passing" : "unaudited";
  const needsAgent = agentCriteria.filter((id) => !judged.has(id)).length;
  return { state, fails, warns, worst, staleCriteria: stale, needsAgent };
}

/** Every labelled block under `folioDir`, summarised. `repoRoot` is where the sidecars resolve from. */
export function publishBlockQa(repoRoot: string, folioDir: string): BlockQaSummaryFile {
  const blocks: Record<string, BlockQaSummary> = {};
  const counts: Record<BlockQaState, number> = { failing: 0, passing: 0, stale: 0, unaudited: 0 };
  // Graph-scoped criteria (the detangler's, `foreshadows-point-forward`) are
  // fresh against the hash of the whole `uses` graph, exactly as the sweep
  // records them. Left out, every one of them reads stale the moment after a
  // sweep, which is how this was found.
  const graph = usesGraphHash(folioDir);
  const criteria = qaCriteriaFor(repoRoot);
  const criteriaById = qaCriteriaByIdFor(repoRoot);
  const voices = readActiveVoices(repoRoot);
  let passingScriptsOnly = 0;
  for (const b of walkBlocks(folioDir, { verify: false, onLoadFailure: () => {} })) {
    const path = existingBlockQaPath(repoRoot, b.root) ?? existingBlockQaPath(folioDir, b.root);
    const s = summariseBlock(
      path ? loadQaReport(path) : undefined,
      { ...hashBlockFiles(b.companions), graph },
      agentCriteriaFor(criteria, b.kind, voices),
      criteriaById,
    );
    blocks[b.label] = s;
    counts[s.state]++;
    if (s.state === "passing" && s.needsAgent > 0) passingScriptsOnly++;
  }
  return { $schema: BLOCK_QA_SUMMARY_SCHEMA, blocks, counts, passingScriptsOnly };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  if (args.includes("--help") || !opt("folio") || !opt("out")) {
    console.error("usage: bun run cat-harness/scripts/publish-block-qa.ts --folio <folio dir> --out <block-qa.json> [--repo <folio instance root; default: found from --folio, as the sweep finds it>]");
    process.exit(args.includes("--help") ? 0 : 2);
  }
  // declared-path-literal: "folio" is the COMMAND-LINE FLAG's name, not a
  // directory. The directory is whatever the caller passes, and the staging
  // workflow passes the one the folio declares.
  const folio = resolve(opt("folio")!);
  // The instance root, found exactly as the sweep finds it (`s3p2`). It
  // defaulted to ".", the repository root. A folio in a subfolder (ojcx's
  // real run: `handbook/`) then had every block reported unaudited after a
  // sweep that had written verdicts under `handbook/test/results/`.
  const repo = opt("repo") ? resolve(opt("repo")!) : findContentRepoRoot(folio, process.cwd());
  const f = publishBlockQa(repo, folio);
  mkdirSync(dirname(resolve(opt("out")!)), { recursive: true });
  writeFileSync(opt("out")!, JSON.stringify(f) + "\n");
  const c = f.counts;
  console.error(
    `✓ block QA: ${c.failing} failing, ${c.passing} passing (${f.passingScriptsOnly} on scripts only: ` +
      `criteria that need an agent have no verdict), ${c.stale} stale, ${c.unaudited} unaudited → ${opt("out")}`,
  );
}
