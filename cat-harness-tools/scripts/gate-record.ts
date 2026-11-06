/**
 * A tree-keyed record of a local gate run: which tree was judged, which gates
 * the set held, how each came out, and with which tools.
 *
 * Written by `scripts/pre-push-gates.ts` after `bun run cat gates` passes on
 * the tree being pushed. It serves two readers:
 *
 * 1. **The next push of the same tree** (the Claude Code hook runs before
 *    `git push`, then git's own pre-push hook runs inside it): a record that
 *    covers the tree means the gates are not asked twice.
 * 2. **CI, with deferred verification** (design in bean `cat-tools-pp9g`): a
 *    record attached to the commit as a git note (`refs/notes/cat-gates`)
 *    lets a PR's critical path skip the gates it covers, and a sweep off the
 *    critical path re-runs them and compares — the trust model agent-built
 *    previews already use. That CI side is a follow-up in folio-assistant;
 *    nothing here makes CI skip anything.
 *
 * Only a PASS is recorded. A record is a claim that the gates are green on
 * this tree, so a fail, a not-clean run or an undetermined one leaves no
 * record and everything downstream runs as if there were none.
 *
 * Why the tree and not the commit: the gates judge files, and the same tree
 * reached by a rebase or an amend of the message is the same judgment. Why
 * the Bun version: the same tree under another runtime is not the same run.
 * The workflow and `bun.lock` are files of the tree, so the gate list and the
 * dependency set are fixed by the key already.
 *
 * Deliberately free of package imports, so the git hook runs it in a checkout
 * that has not installed anything.
 *
 * @module scripts/gate-record
 * @graphNode none — a helper of the pre-push hook, not a gate itself
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

export const LOCAL_GATE_RECORD_SCHEMA = "cat-local-gate-record/v1";
/** The notes ref a record is attached under, so it can travel with a push. */
export const RECORD_NOTES_REF = "refs/notes/cat-gates";

/** What `bun run cat gates --report` writes (`schemas/sdlc/gates-report.ts`), the fields read here. */
export interface GatesReportLike {
  $schema: string;
  outcome: "pass" | "fail" | "not-clean" | "undetermined";
  exitCode: 0 | 1 | 2;
  set: "fast" | "whole";
  gates: number;
  commands?: string[];
  heldOut?: string[];
  failed: { command: string; job: string; step: string; why: string[] }[];
  skipped: { command: string; why: string }[];
  mutatedBy?: string[];
  undetermined: string[];
}

export interface ToolVersions {
  bun: string;
  git: string;
  platform: string;
}

export interface LocalGateRecord {
  $schema: typeof LOCAL_GATE_RECORD_SCHEMA;
  /** The tree judged: `git rev-parse <commit>^{tree}`. The key. */
  tree: string;
  /** The commit the run was made for. Informative only; the tree is the key. */
  commit: string;
  set: "fast" | "whole";
  outcome: "pass";
  /** Every gate in the set, in workflow order. */
  gates: string[];
  /** Gates of the set this run did not run (`gates --except`): the record does not cover them, CI runs them. */
  heldOut: string[];
  /**
   * The affected-test selection that ran in place of a held-out whole suite
   * (`scripts/affected-tests.ts`): what it ran, and that it passed. Never the
   * suite's verdict.
   */
  affectedTests?: { files: number; passed: boolean } | { all: string };
  /** Gates not asked because the input-hash cache (bean `f017`) holds a pass on identical inputs. */
  skipped: { command: string; why: string }[];
  tools: ToolVersions;
  /** `agent` when a Claude Code session ran it (CLAUDECODE set), else `human`. */
  runBy: "agent" | "human";
  startedAt: string;
  finishedAt: string;
}

/** Run git in `root`; the trimmed stdout, or undefined when git exits non-zero. */
export function git(root: string, args: readonly string[]): string | undefined {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf-8" });
  return r.status === 0 ? r.stdout.trim() : undefined;
}

/** The directory records and logs live in: `<common git dir>/cat-gates`, shared by every worktree. */
export function stateDir(root: string): string {
  const common = git(root, ["rev-parse", "--git-common-dir"]);
  if (common === undefined) throw new Error(`${root} is not inside a git repository`);
  return join(resolve(root, common), "cat-gates");
}

export function treeOf(root: string, rev: string): string | undefined {
  return git(root, ["rev-parse", "--verify", "--quiet", `${rev}^{tree}`]);
}

export function toolVersions(root: string): ToolVersions {
  return {
    bun: typeof Bun !== "undefined" ? Bun.version : "none",
    git: (git(root, ["--version"]) ?? "unknown").replace(/^git version /, ""),
    platform: `${process.platform}-${process.arch}`,
  };
}

export function recordPath(root: string, tree: string): string {
  if (!/^[0-9a-f]{40,64}$/.test(tree)) throw new Error(`not a tree id: ${tree}`);
  return join(stateDir(root), "records", `${tree}.json`);
}

/** The record for a passing report, or undefined when the report is not a pass. */
export function buildRecord(
  report: GatesReportLike,
  ctx: { tree: string; commit: string; tools: ToolVersions; runBy: "agent" | "human"; startedAt: string; finishedAt: string },
): LocalGateRecord | undefined {
  if (report.outcome !== "pass" || report.exitCode !== 0) return undefined;
  // A pass over a set nobody can name is not something to vouch for: the
  // record has to say what it covers.
  if (report.commands === undefined || report.commands.length !== report.gates || report.gates === 0) return undefined;
  return {
    $schema: LOCAL_GATE_RECORD_SCHEMA,
    tree: ctx.tree,
    commit: ctx.commit,
    set: report.set,
    outcome: "pass",
    gates: [...report.commands],
    heldOut: [...(report.heldOut ?? [])],
    skipped: report.skipped.map((s) => ({ command: s.command, why: s.why })),
    tools: ctx.tools,
    runBy: ctx.runBy,
    startedAt: ctx.startedAt,
    finishedAt: ctx.finishedAt,
  };
}

export function writeRecord(root: string, rec: LocalGateRecord): string {
  const p = recordPath(root, rec.tree);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(rec, null, 2) + "\n");
  return p;
}

export function readRecord(root: string, tree: string): LocalGateRecord | undefined {
  const p = recordPath(root, tree);
  if (!existsSync(p)) return undefined;
  try {
    const r = JSON.parse(readFileSync(p, "utf-8")) as LocalGateRecord;
    return r.$schema === LOCAL_GATE_RECORD_SCHEMA && r.tree === tree ? r : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether a record covers `tree` for a push now: it is a pass on that tree,
 * under the Bun that would run the gates now. Returns the reason either way.
 */
export function covers(rec: LocalGateRecord | undefined, tree: string, now: ToolVersions): { covered: boolean; why: string } {
  if (rec === undefined) return { covered: false, why: "no local gate record for this tree" };
  if (rec.tree !== tree) return { covered: false, why: `the record is for tree ${rec.tree}` };
  if (rec.outcome !== "pass") return { covered: false, why: `the record's outcome is ${rec.outcome}` };
  if (rec.tools.bun !== now.bun) return { covered: false, why: `the record was made under bun ${rec.tools.bun}, this is ${now.bun}` };
  return { covered: true, why: `gates passed on this tree at ${rec.finishedAt} (${rec.gates.length} gate(s), ${rec.set} set)` };
}

/** Attach the record to its commit as a git note, so a push of the notes ref carries it. */
export function attachNote(root: string, rec: LocalGateRecord): boolean {
  const r = spawnSync("git", ["notes", `--ref=${RECORD_NOTES_REF}`, "add", "-f", "-F", "-", rec.commit], {
    cwd: root,
    input: JSON.stringify(rec) + "\n",
    encoding: "utf-8",
  });
  return r.status === 0;
}

/** One line of the push log: every bypass, refusal and undetermined push is written here. */
export function logPush(root: string, entry: Record<string, unknown>): string {
  const p = join(stateDir(root), "push.log");
  mkdirSync(dirname(p), { recursive: true });
  appendFileSync(p, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
  return p;
}

// ── Per-gate outcomes, pass or fail (the "no new failures" baseline) ─────
//
// A fresh agent container is not CI: measured 2026-11-05 (folio-assistant
// #2946), `CI=1 bun run cat gates` there reddened 11 `bun test` cases that
// pass in CI on the same tree, for want of the publish-time pages and of a
// faster machine. A red here is therefore a finding about THIS PUSH only when
// the same gate was green on the push's base in the same environment, which
// is the rule CI's own "no new failures" jobs apply. So every run records how
// each gate came out, keyed by tree, and a push compares against its base.

export const LOCAL_GATE_RESULTS_SCHEMA = "cat-local-gate-results/v1";

export type GateOutcomeHere = "pass" | "fail" | "skipped";

export interface LocalGateResults {
  $schema: typeof LOCAL_GATE_RESULTS_SCHEMA;
  tree: string;
  tools: ToolVersions;
  at: string;
  outcomes: Record<string, GateOutcomeHere>;
}

/** Each gate's outcome in a report, or undefined when the report cannot name its gates or reached no verdict. */
export function outcomesOf(report: GatesReportLike): Record<string, GateOutcomeHere> | undefined {
  if (report.commands === undefined || report.exitCode === 2 || report.outcome === "undetermined") return undefined;
  const failed = new Set(report.failed.map((f) => f.command));
  const skipped = new Set(report.skipped.map((s) => s.command));
  const out: Record<string, GateOutcomeHere> = {};
  for (const c of report.commands) out[c] = failed.has(c) ? "fail" : skipped.has(c) ? "skipped" : "pass";
  return out;
}

export function resultsPath(root: string, tree: string): string {
  if (!/^[0-9a-f]{40,64}$/.test(tree)) throw new Error(`not a tree id: ${tree}`);
  return join(stateDir(root), "results", `${tree}.json`);
}

export function writeResults(root: string, r: LocalGateResults): void {
  const p = resultsPath(root, r.tree);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(r, null, 2) + "\n");
}

/** The outcomes recorded for `tree`; a passing record stands for them when no results file was written. */
export function readResults(root: string, tree: string): LocalGateResults | undefined {
  try {
    const r = JSON.parse(readFileSync(resultsPath(root, tree), "utf-8")) as LocalGateResults;
    if (r.$schema === LOCAL_GATE_RESULTS_SCHEMA && r.tree === tree) return r;
  } catch {
    // fall through to the record
  }
  const rec = readRecord(root, tree);
  if (rec === undefined) return undefined;
  const skipped = new Set(rec.skipped.map((s) => s.command));
  const outcomes: Record<string, GateOutcomeHere> = {};
  for (const c of rec.gates) outcomes[c] = skipped.has(c) ? "skipped" : "pass";
  return { $schema: LOCAL_GATE_RESULTS_SCHEMA, tree, tools: rec.tools, at: rec.finishedAt, outcomes };
}

/**
 * The gates red now that were green (passed, or skipped on a pass) on the
 * base, in the same Bun. Only these are this push's. A gate red on both, or
 * one the base has no result for, is not decided here: CI decides it.
 */
export function newFailures(failedNow: readonly string[], base: LocalGateResults | undefined, now: ToolVersions): string[] {
  if (base === undefined || base.tools.bun !== now.bun) return [];
  return failedNow.filter((c) => base.outcomes[c] === "pass" || base.outcomes[c] === "skipped");
}

// ── Class B entries: one verdict per gate, under its derived key ─────────
//
// "Cache-First CI" (CI speed 14, 2026-11-05): keyed reuse goes through one
// key, `bun run cat cache:key <script>` (cat-harness-tools#1511), the `f017`
// fingerprint. A committer's verdict is Class B: CI cannot check it without
// re-running it, so it is never a `cached-step` hit; only the cqg judge
// reads it, under its pending → re-verify rule (folio-assistant #2957/#2958).
//
// The keys are not computed again here. A passing `gates` run has already
// written each gate's fingerprint into the f017 cache (`checks`), and only
// for a gate that passed with its inputs the same before and after
// (`recordCheckRun`): exactly the verdicts a key can vouch for. A gate with
// no such fingerprint (no input declaration, inputs moved under it, held out)
// gets no entry, as `cache:key` would answer `undetermined`.

export const LOCAL_GATE_VERDICT_SCHEMA = "cat-local-gate-verdict/v1";
/** Where a Class B entry lives: never read by `cached-step` as a hit. */
export const LOCAL_VERDICT_REF_PREFIX = "refs/cat-gates/local/";
/** `build/regen-cache/input-hashes.json`, as `input-hash.ts` `CACHE_FILE` names it. */
const F017_CACHE = join("build", "regen-cache", "input-hashes.json");

export interface LocalGateVerdict {
  schema: typeof LOCAL_GATE_VERDICT_SCHEMA;
  /** The gate's command, as the workflow runs it. */
  gate: string;
  /** `cache:key <script>`: the f017 fingerprint of the gate's derived inputs. */
  key: string;
  verdict: "pass";
  source: "local";
  runBy: "agent" | "human";
  tools: ToolVersions;
  /** The tree the run judged: informative; the key is what a lookup matches. */
  tree: string;
  startedAt: string;
  finishedAt: string;
}

/** The script a gate runs, when the gate is exactly `bun run [cat] <script>`: the only gates `cache:key` keys. */
export function scriptOfGate(command: string): string | undefined {
  return /^bun run (?:cat )?([A-Za-z0-9:_-]+)\s*$/.exec(command.trim())?.[1];
}

/** `refs/cat-gates/local/<script>/<key>`; `:` is not allowed in a ref, so it is written `--`. */
export function verdictRef(script: string, key: string): string {
  if (!/^[0-9a-f]{16,128}$/.test(key)) throw new Error(`not a cache key: ${key}`);
  return `${LOCAL_VERDICT_REF_PREFIX}${script.replace(/:/g, "--")}/${key}`;
}

/** Each check's fingerprint at its last green run, from the f017 cache; empty when there is none. */
export function f017Keys(root: string): Record<string, string> {
  try {
    return (JSON.parse(readFileSync(join(root, F017_CACHE), "utf-8")) as { checks?: Record<string, string> }).checks ?? {};
  } catch {
    return {};
  }
}

/** One entry for each gate of a passing record that has a key. */
export function verdictsFor(rec: LocalGateRecord, keys: Readonly<Record<string, string>>): LocalGateVerdict[] {
  const out: LocalGateVerdict[] = [];
  for (const gate of rec.gates) {
    const script = scriptOfGate(gate);
    const key = script === undefined ? undefined : keys[script];
    if (key === undefined || !/^[0-9a-f]{16,128}$/.test(key)) continue;
    out.push({
      schema: LOCAL_GATE_VERDICT_SCHEMA,
      gate,
      key,
      verdict: "pass",
      source: "local",
      runBy: rec.runBy,
      tools: rec.tools,
      tree: rec.tree,
      startedAt: rec.startedAt,
      finishedAt: rec.finishedAt,
    });
  }
  return out;
}

/** Store each entry as a blob under its ref; the refs written. A push of `refs/cat-gates/local/*` carries them. */
export function writeVerdictRefs(root: string, verdicts: readonly LocalGateVerdict[]): string[] {
  const refs: string[] = [];
  for (const v of verdicts) {
    const blob = spawnSync("git", ["hash-object", "-w", "--stdin"], { cwd: root, input: JSON.stringify(v) + "\n", encoding: "utf-8" });
    if (blob.status !== 0) continue;
    const ref = verdictRef(scriptOfGate(v.gate)!, v.key);
    if (git(root, ["update-ref", ref, blob.stdout.trim()]) !== undefined) refs.push(ref);
  }
  return refs;
}

/** The entry stored for `script` under `key`, or undefined. What the judge reads after fetching the ref. */
export function readVerdict(root: string, script: string, key: string): LocalGateVerdict | undefined {
  const text = git(root, ["cat-file", "blob", verdictRef(script, key)]);
  if (text === undefined) return undefined;
  try {
    const v = JSON.parse(text) as LocalGateVerdict;
    return v.schema === LOCAL_GATE_VERDICT_SCHEMA && v.key === key && scriptOfGate(v.gate) === script ? v : undefined;
  } catch {
    return undefined;
  }
}
