#!/usr/bin/env bun
/**
 * repin-train — the decisions behind the 2-hour re-pin train (issue #2873).
 *
 * Owner, 2026-11-01, card Q-SPD-3 B: re-pins stop chasing new merges. Every
 * two hours ONE train resolves each layer's newest `main` commit, writes those
 * pins once, and opens one PR. Nothing moves that PR's pins again. A train PR
 * may merge when its checks show NO NEW FAILURES compared with fa main.
 *
 *   bun .github/scripts/repin-train.ts decide  --tree <sha>   # open a train, or skip it?
 *   bun .github/scripts/repin-train.ts verdict --sha <sha>    # compare a train head with main
 *
 * `decide` prints `key=value` lines for `$GITHUB_OUTPUT`. `verdict` sets the
 * commit status `repin-train / no new failures` on the train head and keeps
 * one comment on the PR up to date. Both read GitHub through {@link Api}, the
 * only place this file reaches the network, so tests pass a stub.
 *
 * Imports nothing but `node:*`: the verdict workflow runs it without mounting
 * any layer.
 */

// ── The pure decisions ──────────────────────────────────────────────────────

export interface CheckRun {
  id: number;
  name: string;
  status: string; // queued | in_progress | completed | waiting | pending | requested
  conclusion: string | null;
}

/** Conclusions that count as passing. A cancelled or timed-out check is not a pass. */
const PASSING = new Set(["success", "neutral", "skipped"]);

/** The newest run of each check name: a re-run supersedes the run it repeats. */
export function newestByName(runs: readonly CheckRun[]): Map<string, CheckRun> {
  const out = new Map<string, CheckRun>();
  for (const r of runs) {
    const had = out.get(r.name);
    if (!had || r.id > had.id) out.set(r.name, r);
  }
  return out;
}

export interface Verdict {
  state: "pending" | "success" | "failure";
  /** Checks still running on the train head. */
  pending: string[];
  /** Failing on the train head and NOT failing on main: these block the merge. */
  newFailures: string[];
  /** Failing on both: main's known debt, which does not block a train. */
  knownFailures: string[];
}

/**
 * Compare a train head's checks with main's. A failure is NEW when main's
 * baseline commit does not fail a check of the same name; that includes a
 * check main does not run at all (a PR-only check failing is new).
 */
export function compare(train: readonly CheckRun[], main: readonly CheckRun[]): Verdict {
  const t = newestByName(train);
  const m = newestByName(main);
  const pending: string[] = [];
  const newFailures: string[] = [];
  const knownFailures: string[] = [];
  for (const [name, run] of t) {
    if (run.status !== "completed") {
      pending.push(name);
      continue;
    }
    if (PASSING.has(run.conclusion ?? "")) continue;
    const base = m.get(name);
    if (base && base.status === "completed" && !PASSING.has(base.conclusion ?? "")) knownFailures.push(name);
    else newFailures.push(name);
  }
  pending.sort();
  newFailures.sort();
  knownFailures.sort();
  const state = newFailures.length > 0 ? "failure" : pending.length > 0 || t.size === 0 ? "pending" : "success";
  return { state, pending, newFailures, knownFailures };
}

/** The marker a train PR's body carries, so a later train can find the tree it tested. */
export const TREE_MARKER = /<!--\s*repin-train:tree=([0-9a-f]{40})\s*-->/;

export interface TrainPr {
  number: number;
  state: "open" | "closed";
  merged: boolean;
  body: string;
  /** The `repin-train / no new failures` status on its head, when one was set. */
  verdict?: "pending" | "success" | "failure" | "error";
}

export interface Decision {
  action: "open" | "skip";
  reason: string;
  /** Open train PRs the new train replaces (they failed, so nobody will merge them). */
  close: number[];
}

/**
 * Open a new train, or not.
 *
 * - The same tree was already tested by an earlier train: skip. Its checks
 *   would repeat a verdict that already exists.
 * - An open train is still being checked: skip. Its pins are frozen until its
 *   checks finish; a second train would only compete for runners.
 * - An open train passed and waits for a person's merge: skip, so the PR they
 *   are about to merge is not closed under them.
 * - An open train failed: the new train replaces it, and it is closed.
 */
export function decide(tree: string, prs: readonly TrainPr[]): Decision {
  const treeOf = (p: TrainPr) => TREE_MARKER.exec(p.body)?.[1];
  const same = prs.find((p) => treeOf(p) === tree);
  if (same) return { action: "skip", reason: `tree ${tree.slice(0, 10)} was already tested by #${same.number}`, close: [] };
  const open = prs.filter((p) => p.state === "open");
  const running = open.find((p) => p.verdict === undefined || p.verdict === "pending");
  if (running) return { action: "skip", reason: `train #${running.number} is still being checked; its pins stay frozen`, close: [] };
  const passed = open.find((p) => p.verdict === "success");
  if (passed) return { action: "skip", reason: `train #${passed.number} has no new failures and waits for a merge`, close: [] };
  return { action: "open", reason: "new pins", close: open.map((p) => p.number) };
}

/** The PR comment for a verdict. One comment, edited in place. */
export function verdictComment(v: Verdict, mainSha: string): string {
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `- \`${x}\``).join("\n") : "- none");
  const head =
    v.state === "success"
      ? "✅ **No new failures** compared with fa main. This train may merge."
      : v.state === "failure"
        ? "❌ **New failures** compared with fa main. This train must not merge; the next train replaces it."
        : "⏳ Checks are still running.";
  return [
    COMMENT_MARKER,
    head,
    "",
    `Compared with main at \`${mainSha.slice(0, 10)}\`.`,
    "",
    "**New failures (block the merge)**",
    list(v.newFailures),
    "",
    "**Known failures (also red on main)**",
    list(v.knownFailures),
    "",
    "**Still running**",
    list(v.pending),
    "",
    "---",
    "_Written by `repin-train-verdict.yml` (issue #2873)._",
  ].join("\n");
}

export const COMMENT_MARKER = "<!-- repin-train:verdict -->";
export const STATUS_CONTEXT = "repin-train / no new failures";
export const LABEL = "repin-train";

// ── The network, behind one seam ────────────────────────────────────────────

export interface Api {
  get<T>(path: string): Promise<T>;
  send<T>(method: "POST" | "PATCH", path: string, body: unknown): Promise<T>;
}

export function githubApi(token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN, base = process.env.GITHUB_API_URL ?? "https://api.github.com"): Api {
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const call = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${base}${path}`, { method, headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${await res.text()}`);
    return (await res.json()) as T;
  };
  return { get: (p) => call("GET", p), send: (m, p, b) => call(m, p, b) };
}

/** Every check run on a commit (paged). */
export async function checkRuns(api: Api, repo: string, sha: string): Promise<CheckRun[]> {
  const out: CheckRun[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await api.get<{ check_runs: CheckRun[] }>(`/repos/${repo}/commits/${sha}/check-runs?per_page=100&page=${page}`);
    out.push(...r.check_runs.map(({ id, name, status, conclusion }) => ({ id, name, status, conclusion })));
    if (r.check_runs.length < 100) break;
  }
  return out;
}

/**
 * Main's baseline: the newest of its last commits whose checks have all
 * finished. A commit still being checked would hide failures main has.
 */
export async function mainBaseline(api: Api, repo: string, depth = 15): Promise<{ sha: string; runs: CheckRun[] } | undefined> {
  const commits = await api.get<Array<{ sha: string }>>(`/repos/${repo}/commits?sha=main&per_page=${depth}`);
  for (const { sha } of commits) {
    const runs = await checkRuns(api, repo, sha);
    if (runs.length > 0 && runs.every((r) => r.status === "completed")) return { sha, runs };
  }
  return undefined;
}

async function statusOf(api: Api, repo: string, sha: string): Promise<TrainPr["verdict"]> {
  const r = await api.get<{ statuses: Array<{ context: string; state: string }> }>(`/repos/${repo}/commits/${sha}/status`);
  const s = r.statuses.find((x) => x.context === STATUS_CONTEXT);
  return s?.state as TrainPr["verdict"];
}

/** The last train PRs, open and closed, with the verdict on each open one's head. */
export async function trainPrs(api: Api, repo: string): Promise<TrainPr[]> {
  const issues = await api.get<Array<{ number: number; state: "open" | "closed"; body: string | null; pull_request?: { merged_at: string | null } }>>(
    `/repos/${repo}/issues?labels=${LABEL}&state=all&per_page=30`,
  );
  const out: TrainPr[] = [];
  for (const i of issues) {
    if (!i.pull_request) continue;
    const pr: TrainPr = { number: i.number, state: i.state, merged: Boolean(i.pull_request.merged_at), body: i.body ?? "" };
    if (i.state === "open") {
      const p = await api.get<{ head: { sha: string } }>(`/repos/${repo}/pulls/${i.number}`);
      pr.verdict = await statusOf(api, repo, p.head.sha);
    }
    out.push(pr);
  }
  return out;
}

// ── The CLI ─────────────────────────────────────────────────────────────────

function arg(argv: string[], flag: string): string {
  const i = argv.indexOf(flag);
  const v = i >= 0 ? argv[i + 1] : undefined;
  if (!v) throw new Error(`${flag} is required`);
  return v;
}

async function main(argv: string[]): Promise<number> {
  const repo = process.env.GITHUB_REPOSITORY ?? "litlfred/folio-assistant";
  const api = githubApi();
  const cmd = argv[0];
  if (cmd === "decide") {
    const tree = arg(argv, "--tree");
    const d = decide(tree, await trainPrs(api, repo));
    console.log(`action=${d.action}`);
    console.log(`reason=${d.reason}`);
    console.log(`close=${d.close.join(" ")}`);
    return 0;
  }
  if (cmd === "verdict") {
    const sha = arg(argv, "--sha");
    const pulls = await api.get<Array<{ number: number; head: { sha: string; ref: string }; labels: Array<{ name: string }> }>>(`/repos/${repo}/commits/${sha}/pulls`);
    const pr = pulls.find((p) => p.head.sha === sha && p.labels.some((l) => l.name === LABEL));
    if (!pr) {
      console.log(`no open train PR has head ${sha.slice(0, 10)}; nothing to judge`);
      return 0;
    }
    const base = await mainBaseline(api, repo);
    if (!base) {
      // Could not determine is never green.
      await api.send("POST", `/repos/${repo}/statuses/${sha}`, { state: "pending", context: STATUS_CONTEXT, description: "no finished main run to compare with yet" });
      console.log("no main commit with finished checks; status left pending");
      return 0;
    }
    const v = compare(await checkRuns(api, repo, sha), base.runs);
    const description =
      v.state === "success"
        ? `no new failures vs main ${base.sha.slice(0, 7)} (${v.knownFailures.length} known)`
        : v.state === "failure"
          ? `${v.newFailures.length} new failure(s) vs main ${base.sha.slice(0, 7)}`
          : `${v.pending.length} check(s) still running`;
    await api.send("POST", `/repos/${repo}/statuses/${sha}`, { state: v.state, context: STATUS_CONTEXT, description: description.slice(0, 140) });
    const body = verdictComment(v, base.sha);
    const comments = await api.get<Array<{ id: number; body: string }>>(`/repos/${repo}/issues/${pr.number}/comments?per_page=100`);
    const mine = comments.find((c) => c.body.startsWith(COMMENT_MARKER));
    if (mine) await api.send("PATCH", `/repos/${repo}/issues/comments/${mine.id}`, { body });
    else await api.send("POST", `/repos/${repo}/issues/${pr.number}/comments`, { body });
    console.log(`#${pr.number}: ${v.state} — ${description}`);
    return 0;
  }
  console.error("usage: repin-train.ts decide --tree <sha> | verdict --sha <sha>");
  return 2;
}

if (import.meta.main) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(`repin-train: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(2);
    },
  );
}
