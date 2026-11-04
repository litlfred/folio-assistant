#!/usr/bin/env bun
/**
 * repin-train — the decisions behind the 2-hour re-pin train (issue #2873).
 *
 * @module .github/scripts/repin-train
 * @graphNode none — a scheduled maintenance step over this index's own re-pin PRs
 * @covers none — it judges check runs GitHub already reported; it audits no node kind.
 *
 * Owner, 2026-11-01, card Q-SPD-3 B: re-pins stop chasing new merges. Every
 * two hours ONE train resolves each layer's newest `main` commit, writes those
 * pins once, and opens one PR. Nothing moves that PR's pins again. A train PR
 * may merge when its checks show NO NEW FAILURES compared with fa main.
 *
 * Owner, 2026-11-03: a train with no new failures MERGES ITSELF (it was "a
 * person merges each train"). `verdict` merges the PR, with a merge commit and
 * the judged head as the expected sha, when the verdict is green and GitHub
 * says it is mergeable. A train with a new failure, or one this could not
 * judge, never merges.
 *
 *   bun .github/scripts/repin-train.ts decide  --tree <sha>              # open a train, or skip it?
 *   bun .github/scripts/repin-train.ts verdict --sha <sha> [--no-merge]  # judge a train head, merge it when green
 *   bun .github/scripts/repin-train.ts verdict --open [--no-merge]       # judge every open train not yet judged final
 *
 * `decide` prints `key=value` lines for `$GITHUB_OUTPUT`. `verdict` sets the
 * commit status `repin-train / no new failures` on the train head and keeps
 * one comment on the PR up to date. All of them read GitHub through
 * {@link Api}, the only place this file reaches the network, so tests pass a
 * stub. The merge uses `MERGE_TOKEN` when it is set (a token whose push
 * starts main's own workflows), else `GH_TOKEN`.
 *
 * Imports nothing but `node:*`: the verdict workflow runs it without mounting
 * any layer.
 */
import { inflateSync } from "node:zlib";

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
  /** `error`: nothing new is known to fail, but something could not be judged. Never green. */
  state: "pending" | "success" | "failure" | "error";
  /** Checks still running on the train head. */
  pending: string[];
  /** Failing on the train head and NOT failing on main: these block the merge. */
  newFailures: string[];
  /** Failing on both: main's known debt, which does not block a train. */
  knownFailures: string[];
  /** Failing on the train, and could not be compared with main check by check. Blocks the merge. */
  undetermined: string[];
}

// ── The per-check record a code-quality-gates job leaves in its log ────────

/**
 * The record `cqg_judge.py verdict` prints into each judged job's log, on a
 * line `CQG-REPORT-V1 <base64 of zlib-compressed JSON>` (Q-PIPE-1, #2899).
 * Its items are the job's individual checks: a step (`step:<id>`) or, for a
 * test step, each failing test (`test:<file > title>`).
 */
export interface CqgRecord {
  complete: boolean;
  undetermined: Array<{ label: string; why: string }>;
  items: Record<string, { label: string; exit: number }>;
}

export const CQG_MARKER = "CQG-REPORT-V1 ";
const RECORD_LINE = /(?:^|\s)CQG-REPORT-V1 ([A-Za-z0-9+/=]+)\s*$/;

/** The last well-formed record in a job log, or undefined. The same reading as `cqg_judge.py record_from_log`. */
export function decodeCqgRecord(log: string): CqgRecord | undefined {
  const lines = log.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = RECORD_LINE.exec(lines[i]);
    if (!m) continue;
    try {
      const rec = JSON.parse(inflateSync(Buffer.from(m[1], "base64")).toString("utf-8"));
      if (rec && typeof rec === "object" && rec.items && typeof rec.items === "object") {
        return { complete: Boolean(rec.complete), undetermined: Array.isArray(rec.undetermined) ? rec.undetermined : [], items: rec.items };
      }
    } catch {
      // not a record; keep looking further up
    }
  }
  return undefined;
}

/**
 * The records read for the failing train checks, by check name. A name that
 * is absent was not looked up; `null` means it was looked up and the log held
 * no record (a job the step wrapper does not judge, or a log that could not be
 * read).
 */
export interface Records {
  train: Map<string, CqgRecord | null>;
  main: Map<string, CqgRecord | null>;
}

const usable = (r: CqgRecord | null | undefined): boolean => Boolean(r && r.complete && r.undetermined.length === 0);

/**
 * One failing train check, judged check by check when a record exists. A job
 * red on main for one reason must not mask a different failure inside the
 * same job (the job-level verdict did). With no record on either side the job
 * is the check, and it is judged as before.
 */
function judgeFailingCheck(
  name: string,
  base: CheckRun | undefined,
  records: Records | undefined,
  out: { newFailures: string[]; knownFailures: string[]; undetermined: string[] },
): void {
  const tr = records?.train.get(name) ?? null;
  const mr = records?.main.get(name) ?? null;
  if (!tr && !mr) {
    if (base && base.status === "completed" && !PASSING.has(base.conclusion ?? "")) out.knownFailures.push(name);
    else out.newFailures.push(name);
    return;
  }
  if (!tr || !usable(tr)) {
    const why = !tr
      ? "no per-check record in its log, while main's has one"
      : tr.undetermined.length > 0
        ? tr.undetermined.map((u) => `${u.label}: ${u.why}`).join("; ")
        : "its record is incomplete";
    out.undetermined.push(`${name}: ${why}`);
    return;
  }
  const failing = Object.keys(tr.items)
    .filter((k) => tr.items[k].exit !== 0)
    .sort();
  if (failing.length === 0) {
    out.undetermined.push(`${name}: the job failed, but its record names no failing check`);
    return;
  }
  if (!mr || !usable(mr)) {
    out.undetermined.push(`${name}: main has no complete per-check record to compare ${failing.length} failing check(s) with`);
    return;
  }
  for (const k of failing) {
    const label = `${name} › ${tr.items[k].label}`;
    if ((mr.items[k]?.exit ?? 0) !== 0) out.knownFailures.push(label);
    else out.newFailures.push(label);
  }
}

/**
 * A hard gate that main runs must have run on the train too. Until it shows
 * up, the train is pending, not green: the verdict can fire when one workflow
 * finishes before the gates workflow has created its checks (fa#2890 at
 * 260dbf8 went green with only the staging checks present).
 */
export const isRequired = (name: string): boolean => /\(hard\)/.test(name);

/**
 * Compare a train head's checks with main's. A failure is NEW when main does
 * not fail the same check; that includes a check main does not run at all (a
 * PR-only check failing is new). A failing job that left a per-check record
 * ({@link Records}) is compared check by check, each failing step or test with
 * the same one in main's record; one without is compared as a whole job.
 * Anything that cannot be compared is `undetermined`, which is never green.
 */
export function compare(train: readonly CheckRun[], main: readonly CheckRun[], records?: Records): Verdict {
  const t = newestByName(train);
  const m = newestByName(main);
  const pending: string[] = [];
  const out = { newFailures: [] as string[], knownFailures: [] as string[], undetermined: [] as string[] };
  for (const name of m.keys()) if (isRequired(name) && !t.has(name)) pending.push(name);
  for (const [name, run] of t) {
    if (run.status !== "completed") {
      pending.push(name);
      continue;
    }
    if (PASSING.has(run.conclusion ?? "")) continue;
    judgeFailingCheck(name, m.get(name), records, out);
  }
  pending.sort();
  const { newFailures, knownFailures, undetermined } = out;
  newFailures.sort();
  knownFailures.sort();
  undetermined.sort();
  const state =
    newFailures.length > 0 ? "failure" : pending.length > 0 || t.size === 0 ? "pending" : undetermined.length > 0 ? "error" : "success";
  return { state, pending, newFailures, knownFailures, undetermined };
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
  /** Open train PRs the new train replaces (they failed or could not be judged, so they never merge). */
  close: number[];
}

/**
 * Open a new train, or not.
 *
 * - The same tree was already tested by an earlier train: skip. Its checks
 *   would repeat a verdict that already exists.
 * - An open train is still being checked: skip. Its pins are frozen until its
 *   checks finish; a second train would only compete for runners.
 * - An open train passed and waits for its merge (the verdict merges it, owner
 *   2026-11-03): skip, so it is not closed under that merge, and the next
 *   train is cut from the main it lands on.
 * - An open train failed, or could not be judged: the new train replaces it,
 *   and it is closed.
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
export function verdictComment(v: Verdict, mainSha: string, merge?: string): string {
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `- \`${x}\``).join("\n") : "- none");
  const head =
    v.state === "success"
      ? "✅ **No new failures** compared with fa main. This train merges itself (owner, 2026-11-03)."
      : v.state === "failure"
        ? "❌ **New failures** compared with fa main. This train must not merge; the next train replaces it."
        : v.state === "error"
          ? "⚠️ **Could not determine** whether every failure is main's too. This train must not merge; the next train replaces it."
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
    "**Could not be compared check by check (blocks the merge)**",
    list(v.undetermined),
    "",
    "**Still running**",
    list(v.pending),
    "",
    ...(merge ? [`**Merge:** ${merge}`, ""] : []),
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
  send<T>(method: "POST" | "PATCH" | "PUT", path: string, body: unknown): Promise<T>;
  /** A text body, such as a job log (its redirect followed without the token). */
  text(path: string): Promise<string>;
}

export function githubApi(token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN, base = process.env.GITHUB_API_URL ?? "https://api.github.com"): Api {
  const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const call = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${base}${path}`, { method, headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status} ${await res.text()}`);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  };
  // A job log answers 302 to a signed storage URL, which takes no token.
  const text = async (path: string): Promise<string> => {
    const res = await fetch(`${base}${path}`, { headers, redirect: "manual" });
    const where = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
    const body = where ? await fetch(where) : res;
    if (!body.ok) throw new Error(`GET ${path}: HTTP ${body.status}`);
    return body.text();
  };
  return { get: (p) => call("GET", p), send: (m, p, b) => call(m, p, b), text };
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
 * Main's baseline, ONE CHECK NAME AT A TIME: for each check, its newest
 * finished run among main's last commits (newest first). Not one commit's
 * runs: main's commits do not all run the same checks (a deploy-only merge
 * runs a handful), so a whole-commit baseline made every gate that commit
 * skipped look "new" on the train (fa#2876 at df1156c). A check still running
 * on a newer commit does not hide the older finished answer.
 */
export function baselineByName(newestFirst: ReadonlyArray<readonly CheckRun[]>): CheckRun[] {
  const out = new Map<string, CheckRun>();
  for (const runs of newestFirst) {
    for (const r of newestByName(runs.filter((x) => x.status === "completed")).values()) {
      if (!out.has(r.name)) out.set(r.name, r);
    }
  }
  return [...out.values()];
}

export async function mainBaseline(
  api: Api,
  repo: string,
  depth = 15,
): Promise<{ sha: string; runs: CheckRun[]; perCommit: CheckRun[][] } | undefined> {
  const commits = await api.get<Array<{ sha: string }>>(`/repos/${repo}/commits?sha=main&per_page=${depth}`);
  const perCommit: CheckRun[][] = [];
  for (const { sha } of commits) perCommit.push(await checkRuns(api, repo, sha));
  const runs = baselineByName(perCommit);
  if (runs.length === 0 || commits.length === 0) return undefined;
  return { sha: commits[0].sha, runs, perCommit };
}

/** The per-check record in one job's log, or null when the log holds none or cannot be read. */
export async function recordOf(api: Api, repo: string, jobId: number): Promise<CqgRecord | null> {
  try {
    return decodeCqgRecord(await api.text(`/repos/${repo}/actions/jobs/${jobId}/logs`)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Main's record for one check: from the newest finished run of that name, on
 * main's commits newest first, whose log holds a COMPLETE record, as
 * `cqg_judge.py main_record` reads it. At most `tries` logs are read. When
 * none is complete the last one found is returned, so the caller can say why.
 */
export async function mainRecordFor(api: Api, repo: string, perCommit: ReadonlyArray<readonly CheckRun[]>, name: string, tries = 5): Promise<CqgRecord | null> {
  let found: CqgRecord | null = null;
  for (const runs of perCommit) {
    const run = newestByName(runs.filter((r) => r.name === name && r.status === "completed" && (r.conclusion === "success" || r.conclusion === "failure"))).get(name);
    if (!run) continue;
    const rec = await recordOf(api, repo, run.id);
    if (rec?.complete) return rec;
    found = rec ?? found;
    if (--tries <= 0) break;
  }
  return found;
}

/** Read the records of the train's failing checks, and of the same checks on main. */
export async function readRecords(api: Api, repo: string, train: readonly CheckRun[], perCommit: ReadonlyArray<readonly CheckRun[]>): Promise<Records> {
  const records: Records = { train: new Map(), main: new Map() };
  for (const run of newestByName(train).values()) {
    if (run.status !== "completed" || PASSING.has(run.conclusion ?? "")) continue;
    records.train.set(run.name, await recordOf(api, repo, run.id));
    records.main.set(run.name, await mainRecordFor(api, repo, perCommit, run.name));
  }
  return records;
}

export interface PullInfo {
  number: number;
  state: string;
  head: { sha: string; ref: string; repo: { full_name: string } | null };
  labels: Array<{ name: string }>;
  mergeable?: boolean | null;
  // Read only to word a refusal: it can go stale (bean fx5r), and `unknown`
  // means not computed yet (h2s9). The merge itself relies on the PUT's sha.
  mergeable_state?: string;
}

/** A PR this repository's own train opened: labelled, on a `repin-train/` branch of this repository. Never a fork's. */
export const isOwnTrain = (p: PullInfo, repo: string): boolean =>
  p.labels.some((l) => l.name === LABEL) && p.head.ref.startsWith("repin-train/") && p.head.repo?.full_name === repo;

/**
 * Merge a train whose verdict is green (owner, 2026-11-03): a merge commit,
 * with the judged head as the expected sha, so a head that moved after it was
 * judged is never merged. Waits briefly while GitHub computes mergeability;
 * a PR GitHub calls unmergeable is left open and the reason returned.
 */
export async function mergeTrain(
  api: Api,
  repo: string,
  number: number,
  sha: string,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<{ merged: boolean; why: string }> {
  let pr: PullInfo | undefined;
  for (let i = 0; i < 6; i++) {
    pr = await api.get<PullInfo>(`/repos/${repo}/pulls/${number}`);
    if (pr.mergeable !== null && pr.mergeable !== undefined) break;
    await wait(5000);
  }
  if (!pr) return { merged: false, why: "the PR could not be read" };
  if (pr.state !== "open") return { merged: false, why: `the PR is ${pr.state}` };
  if (!isOwnTrain(pr, repo)) return { merged: false, why: "not a train branch of this repository" };
  if (pr.head.sha !== sha) return { merged: false, why: `its head moved to ${pr.head.sha.slice(0, 10)} after ${sha.slice(0, 10)} was judged` };
  // `mergeable_state` only labels the refusal; it can be stale (fx5r), and
  // the PUT below re-checks the head sha itself.
  if (pr.mergeable !== true) return { merged: false, why: `GitHub does not call it mergeable (${pr.mergeable_state ?? "unknown"})` };
  try {
    await api.send("PUT", `/repos/${repo}/pulls/${number}/merge`, {
      merge_method: "merge",
      sha,
      commit_title: `Merge re-pin train #${number}: no new failures compared with fa main`,
    });
  } catch (e) {
    return { merged: false, why: `the merge was refused: ${e instanceof Error ? e.message : String(e)}`.slice(0, 500) };
  }
  return { merged: true, why: `merged at ${sha.slice(0, 10)} with a merge commit` };
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

export interface JudgeOptions {
  /** Merge a green train. Off where a merge would race the caller (repin-train.yml judges before it cuts the next train). */
  merge: boolean;
  /** The API the merge goes through: a token whose push starts main's own workflows, when there is one. */
  mergeApi?: Api;
  /** Whether a merge through `mergeApi` starts main's push workflows. When not, the gates are dispatched on main. */
  mergeTriggersCi?: boolean;
}

/** Judge one train head: status, comment and, when green, the merge. */
export async function judgeTrain(api: Api, repo: string, sha: string, opts: JudgeOptions): Promise<string> {
  const pulls = await api.get<PullInfo[]>(`/repos/${repo}/commits/${sha}/pulls`);
  const pr = pulls.find((p) => p.head.sha === sha && isOwnTrain(p, repo));
  if (!pr) return `no open train PR has head ${sha.slice(0, 10)}; nothing to judge`;
  const base = await mainBaseline(api, repo);
  if (!base) {
    // Could not determine is never green.
    await api.send("POST", `/repos/${repo}/statuses/${sha}`, { state: "pending", context: STATUS_CONTEXT, description: "no finished main run to compare with yet" });
    return "no main commit with finished checks; status left pending";
  }
  const train = await checkRuns(api, repo, sha);
  const v = compare(train, base.runs, await readRecords(api, repo, train, base.perCommit));
  const description =
    v.state === "success"
      ? `no new failures vs main ${base.sha.slice(0, 7)} (${v.knownFailures.length} known)`
      : v.state === "failure"
        ? `${v.newFailures.length} new failure(s) vs main ${base.sha.slice(0, 7)}`
        : v.state === "error"
          ? `could not determine ${v.undetermined.length} failing check(s) vs main ${base.sha.slice(0, 7)}`
          : `${v.pending.length} check(s) still running`;
  await api.send("POST", `/repos/${repo}/statuses/${sha}`, { state: v.state, context: STATUS_CONTEXT, description: description.slice(0, 140) });
  let merge: string | undefined;
  if (v.state === "success") {
    if (!opts.merge) merge = "not attempted by this run; the verdict workflow merges it.";
    else {
      const m = await mergeTrain(opts.mergeApi ?? api, repo, pr.number, sha);
      merge = m.merged ? m.why : `not merged: ${m.why}. The next verdict run tries again.`;
      if (m.merged && !opts.mergeTriggersCi) {
        // A merge made with GITHUB_TOKEN starts no push workflow on main, so
        // main's gates are dispatched to give the merged pins a verdict.
        try {
          await api.send("POST", `/repos/${repo}/actions/workflows/code-quality-gates.yml/dispatches`, { ref: "main" });
          merge += "; the gates were dispatched on main, since this token's push starts no workflow";
        } catch (e) {
          merge += `; dispatching the gates on main failed: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
    }
  }
  const body = verdictComment(v, base.sha, merge);
  const comments = await api.get<Array<{ id: number; body: string }>>(`/repos/${repo}/issues/${pr.number}/comments?per_page=100`);
  const mine = comments.find((c) => c.body.startsWith(COMMENT_MARKER));
  if (mine) await api.send("PATCH", `/repos/${repo}/issues/comments/${mine.id}`, { body });
  else await api.send("POST", `/repos/${repo}/issues/${pr.number}/comments`, { body });
  return `#${pr.number}: ${v.state} — ${description}${merge ? ` — merge: ${merge}` : ""}`;
}

/**
 * The open trains a sweep judges: this repository's own, whose head has no
 * final verdict yet. A `failure` or `error` is final (the next train replaces
 * it); a `success` still open is judged again, so a merge that failed is
 * retried.
 */
export async function trainsToJudge(api: Api, repo: string): Promise<string[]> {
  const pulls = await api.get<PullInfo[]>(`/repos/${repo}/pulls?state=open&per_page=100`);
  const out: string[] = [];
  for (const p of pulls.filter((x) => isOwnTrain(x, repo))) {
    const v = await statusOf(api, repo, p.head.sha);
    if (v !== "failure" && v !== "error") out.push(p.head.sha);
  }
  return out;
}

async function main(argv: string[]): Promise<number> {
  const repo = process.env.GITHUB_REPOSITORY ?? "litlfred/folio-assistant";
  const api = githubApi();
  const opts: JudgeOptions = {
    merge: !argv.includes("--no-merge"),
    mergeApi: process.env.MERGE_TOKEN ? githubApi(process.env.MERGE_TOKEN) : api,
    mergeTriggersCi: process.env.MERGE_TRIGGERS_CI === "true",
  };
  const cmd = argv[0];
  if (cmd === "decide") {
    const tree = arg(argv, "--tree");
    const d = decide(tree, await trainPrs(api, repo));
    console.log(`action=${d.action}`);
    console.log(`reason=${d.reason}`);
    console.log(`close=${d.close.join(" ")}`);
    return 0;
  }
  if (cmd === "verdict" && argv.includes("--open")) {
    const shas = await trainsToJudge(api, repo);
    if (shas.length === 0) console.log("no open train waits for a verdict");
    for (const sha of shas) console.log(await judgeTrain(api, repo, sha, opts));
    return 0;
  }
  if (cmd === "verdict") {
    console.log(await judgeTrain(api, repo, arg(argv, "--sha"), opts));
    return 0;
  }
  console.error("usage: repin-train.ts decide --tree <sha> | verdict (--sha <sha> | --open) [--no-merge]");
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
