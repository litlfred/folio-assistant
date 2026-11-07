#!/usr/bin/env bun
/**
 * One row per open PR, with the merge steward's "all green" verdict.
 *
 * @module scripts/merge-watch
 * @graphNode none — a read-only report over the GitHub API
 * @covers none — a merge-steward report: it judges open PRs' checks, no declared graph
 *
 * Reading 1 of `merge-manager-watcher` ("What it reads each time"), with
 * rule 1 of its §"Merge-sweep rules" applied to each PR's head SHA:
 *
 * | verdict | meaning |
 * |---|---|
 * | `draft` | the PR is a draft; nothing else is judged |
 * | `pending: <what>` | a check has not finished, or the full tier has not run |
 * | `red: <check names>` | the judge failed, or (with no judge) a check failed |
 * | `green` | every check finished, the full tier ran, and it is green as judged |
 * | `unknown: <why>` | the API could not be read; **never shown as red** |
 *
 * ## Green as judged
 *
 * Where a "No new failures" judge exists, its success is the verdict: a red
 * shard whose failures are all main's known failures is fine when the judge
 * passes. With no judge, every check must conclude success, skipped or
 * neutral. Either way, anything still queued or running blocks, and the full
 * tier must have run: the judge, or every shard `k/N` of each shard family
 * (`shard 2/4`, or a matrix name such as `bun test (head, 2/4)`).
 *
 * ## Superseded cancelled jobs
 *
 * Check runs are grouped by workflow (through the workflow run that owns
 * their check suite) and job name. A cancelled job is ignored when a later
 * run of the same workflow on the same head has that job; the later one is
 * then judged in its place. A cancelled job with no later run counts as red.
 *
 * Usage:
 *   bun run cat merge:watch -- --repo litlfred/cat-harness --repo litlfred/cat-harness-tools
 *   bun run cat merge:watch -- --repo litlfred/cat-harness --json
 *
 * Exit 0 printed · 2 usage error, or some PR's checks could not be read.
 */
import { spawnSync } from "node:child_process";

export interface CheckRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  check_suite?: { id: number } | null;
  app?: { slug: string } | null;
}

export interface WorkflowRun {
  id: number;
  workflow_id: number;
  check_suite_id: number;
}

export type Verdict =
  | { kind: "draft" }
  | { kind: "green" }
  | { kind: "pending"; what: string[] }
  | { kind: "red"; checks: string[] }
  | { kind: "unknown"; why: string };

const PASSING = new Set(["success", "skipped", "neutral"]);
const JUDGE = /No new failures/i;
const FAST_TIER = /fast tier only/i;
/** `shard 2/4`, or a matrix name such as `bun test (head, 2/4)`. */
const SHARD = /(?:shard |, )(\d+)\/(\d+)\b/i;

/** The checks that count: every run except a cancelled one a later run of the same workflow job supersedes. */
export function effectiveChecks(checks: readonly CheckRun[], runs: readonly WorkflowRun[]): CheckRun[] {
  const bySuite = new Map(runs.map((r) => [r.check_suite_id, r]));
  const place = (c: CheckRun): { group: string; order: number } => {
    const suite = c.check_suite?.id;
    const run = suite === undefined ? undefined : bySuite.get(suite);
    if (run) return { group: `wf:${run.workflow_id}`, order: run.id };
    return { group: `app:${c.app?.slug ?? "?"}`, order: suite ?? c.id };
  };
  return checks.filter((c) => {
    if (c.status !== "completed" || c.conclusion !== "cancelled") return true;
    const me = place(c);
    return !checks.some((o) => {
      if (o === c || o.name !== c.name) return false;
      const p = place(o);
      return p.group === me.group && p.order > me.order;
    });
  });
}

/** Did the full tier run: a judge, or every shard of each shard family? */
function fullTier(checks: readonly CheckRun[]): boolean {
  if (checks.some((c) => JUDGE.test(c.name))) return true;
  const families = new Map<string, { of: number; seen: Set<number> }>();
  for (const c of checks) {
    const m = SHARD.exec(c.name);
    if (!m) continue;
    const key = c.name.replace(SHARD, "shard");
    const f = families.get(key) ?? { of: Number(m[2]), seen: new Set<number>() };
    f.seen.add(Number(m[1]));
    families.set(key, f);
  }
  if (families.size === 0) return false;
  return [...families.values()].every((f) => f.seen.size >= f.of);
}

/** Rule 1 of merge-manager-watcher, as a pure function of the PR and the checks on its head. */
export function verdictOf(pr: { draft: boolean }, checks: readonly CheckRun[], runs: readonly WorkflowRun[]): Verdict {
  if (pr.draft) return { kind: "draft" };
  if (checks.length === 0) return { kind: "pending", what: ["no checks"] };
  const live = effectiveChecks(checks, runs);
  const unfinished = live.filter((c) => c.status !== "completed").map((c) => c.name);
  const judges = live.filter((c) => JUDGE.test(c.name));
  const failed = (cs: readonly CheckRun[]) => cs.filter((c) => c.status === "completed" && !PASSING.has(c.conclusion ?? "")).map((c) => c.name);

  if (judges.length > 0) {
    const redJudges = failed(judges);
    if (redJudges.length > 0) return { kind: "red", checks: uniq(redJudges) };
    if (unfinished.length > 0) return { kind: "pending", what: uniq(unfinished) };
    if (judges.some((j) => j.conclusion !== "success")) return { kind: "pending", what: ["full tier (judge did not run)"] };
    return { kind: "green" };
  }

  const red = failed(live);
  if (red.length > 0) return { kind: "red", checks: uniq(red) };
  if (unfinished.length > 0) return { kind: "pending", what: uniq(unfinished) };
  if (!fullTier(live)) {
    return { kind: "pending", what: [live.some((c) => FAST_TIER.test(c.name)) ? "fast tier only" : "full tier not run"] };
  }
  return { kind: "green" };
}

function uniq(xs: readonly string[]): string[] {
  return [...new Set(xs)];
}

export function formatVerdict(v: Verdict): string {
  switch (v.kind) {
    case "draft":
    case "green":
      return v.kind;
    case "pending":
      return `pending: ${v.what.join(", ")}`;
    case "red":
      return `red: ${v.checks.join(", ")}`;
    case "unknown":
      return `unknown: ${v.why}`;
  }
}

// ── I/O ─────────────────────────────────────────────────────────────────

/** `gh api --paginate` with a `--jq` that emits one JSON value per line. */
function ghLines<T>(path: string, jq: string): T[] {
  const r = spawnSync("gh", ["api", "--paginate", path, "--jq", jq], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error((r.stderr || r.error?.message || `gh exited ${r.status}`).trim().split("\n")[0]);
  return r.stdout.split("\n").filter((l) => l.trim() !== "").map((l) => JSON.parse(l) as T);
}

export interface Row {
  repo: string;
  number: number;
  draft: boolean;
  headSha: string;
  mergeableState: string;
  verdict: string;
}

function rowsFor(repo: string): Row[] {
  const prs = ghLines<{ number: number }>(`repos/${repo}/pulls?state=open&per_page=100`, ".[] | {number}");
  return prs.map(({ number }) => {
    let headSha = "";
    let draft = false;
    let mergeableState = "?";
    let verdict: Verdict;
    try {
      // `mergeable_state` is printed as served, never judged: `unknown` means
      // GitHub has not finished computing it, and a merged PR keeps serving
      // its pre-merge value (bean fx5r). The verdict reads the checks only.
      const [pr] = ghLines<{ draft: boolean; sha: string; mergeable_state: string | null }>(
        `repos/${repo}/pulls/${number}`,
        "{draft, sha: .head.sha, mergeable_state}",
      );
      headSha = pr.sha;
      draft = pr.draft;
      mergeableState = pr.mergeable_state ?? "unknown"; // as served, possibly stale (fx5r)
      const checks = ghLines<CheckRun>(
        `repos/${repo}/commits/${headSha}/check-runs?per_page=100`,
        ".check_runs[] | {id, name, status, conclusion, check_suite: {id: .check_suite.id}, app: {slug: .app.slug}}",
      );
      const runs = ghLines<WorkflowRun>(
        `repos/${repo}/actions/runs?head_sha=${headSha}&per_page=100`,
        ".workflow_runs[] | {id, workflow_id, check_suite_id}",
      );
      verdict = verdictOf(pr, checks, runs);
    } catch (err: unknown) {
      verdict = { kind: "unknown", why: err instanceof Error ? err.message : String(err) };
    }
    return { repo, number, draft, headSha, mergeableState, verdict: formatVerdict(verdict) };
  });
}

function main(argv: readonly string[]): number {
  const repos: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--repo" && argv[i + 1]) repos.push(argv[++i]);
  }
  if (repos.length === 0) {
    console.error("usage: merge:watch --repo <owner/name> [--repo …] [--json]");
    return 2;
  }
  const rows = repos.flatMap((repo) => {
    try {
      return rowsFor(repo);
    } catch (err: unknown) {
      const why = err instanceof Error ? err.message : String(err);
      return [{ repo, number: 0, draft: false, headSha: "", mergeableState: "?", verdict: `unknown: ${why}` }];
    }
  });
  if (argv.includes("--json")) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    for (const repo of repos) {
      console.log(`== ${repo}`);
      for (const r of rows.filter((x) => x.repo === repo)) {
        const pr = r.number === 0 ? "-" : `#${r.number}`;
        console.log([pr, r.draft ? "draft" : "ready", r.headSha.slice(0, 7) || "-", r.mergeableState, r.verdict].join("\t"));
      }
    }
  }
  return rows.some((r) => r.verdict.startsWith("unknown")) ? 2 : 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
