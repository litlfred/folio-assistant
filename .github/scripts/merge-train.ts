#!/usr/bin/env bun
/**
 * merge-train — batch the PRs a person opted in, run CI ONCE on the stack,
 * land it in one merge, and bisect a red batch (bean `folio-assistant-hd58`).
 *
 * @module .github/scripts/merge-train
 * @graphNode none — a scheduled maintenance step over this repository's own PRs
 * @covers none — it judges check runs GitHub already reported; it audits no node kind.
 *
 * Owner, 2026-11-05: *"quadratic compute time in terms of # PRs to merge — how
 * to linearize? do it all properly"*. Landing PRs one at a time makes main
 * move once per PR, and every move re-runs something per open PR (merge-main
 * re-merging a conflicted PR, an update-branch, a main push run), which is
 * O(N²) in the N PRs merged. A train lands k PRs per main move, judged by one
 * CI run, so main moves N/k times and nothing is re-run per move.
 *
 *   bun .github/scripts/merge-train.ts pending               # is there work? (prints a reason, or nothing)
 *   bun .github/scripts/merge-train.ts tick --out <dir>      # judge/land/bisect the open train; plan the next
 *   bun .github/scripts/merge-train.ts body --plan <f> --report <f>   # the next train PR's body
 *   bun .github/scripts/merge-train.ts opened --pr <n>       # after the PR is opened: dispatch nothing, just report
 *
 * The cycle, one step per tick (a tick never waits for CI):
 *
 *   1. An OPEN train PR (label `merge-train-batch`) is judged with the re-pin
 *      train's rule: no check fails on its head that passes on main, check by
 *      check (`repin-train.ts compare`).
 *        pending  → nothing more this tick.
 *        success  → merged with a merge commit, expected sha = the judged
 *                   head. Each member's head is now an ancestor of main, so
 *                   GitHub marks it merged; each gets one comment.
 *        red      → closed. A batch of one is the culprit: its `merge-train`
 *                   label is removed, with a comment naming the failures. A
 *                   larger batch is split in halves, queued first-half-first.
 *   2. No open train: the next batch is the head of the bisect queue (kept in
 *      the newest train PR's body), else every READY opted-in PR. `tick`
 *      writes it to `<out>/plan.json` and prints `build=<specs>` for
 *      `bun run cat merge:train`, which stacks it on main, resolving only
 *      declared conflict patterns, with one `regen` over the stack.
 *
 * Opted in (merging into main stays a person's decision): the label
 * `merge-train`, added by a person (never a bot), or an APPROVED review by a
 * person with write access. Ready: base `main`, same repository, not a draft,
 * touches no `.github/workflows/` or `subscriptions/`, and no check on its
 * head fails that passes on main, with none still running.
 *
 * Imports nothing but `node:*` and `repin-train.ts`, so the workflow runs it
 * before any layer is mounted. All of GitHub is reached through {@link Api}.
 */
import { readFileSync } from "node:fs";

import {
  checkRuns,
  compare,
  githubApi,
  mainBaseline,
  readRecords,
  type Api,
  type CheckRun,
  type Verdict,
} from "./repin-train.ts";

export const OPT_IN = "merge-train";
export const BATCH_LABEL = "merge-train-batch";
export const BRANCH_PREFIX = "merge-train/";
export const STATUS_CONTEXT = "merge-train / no new failures";
export const STATE_MARKER = /<!--\s*merge-train:state (\{.*?\})\s*-->/s;
export const COMMENT_MARKER = "<!-- merge-train:verdict -->";
/** Paths the train never carries: an Actions token cannot push a workflow file; `subscriptions/` are held copies. */
export const PROTECTED = /^(\.github\/workflows\/|subscriptions\/)/;
const WORKFLOWS = /^\.github\/workflows\//;

/**
 * Whether this train may carry PRs that change `.github/workflows/` (owner,
 * 2026-11-05: "add an off switch"). Off unless the workflow sets
 * `MERGE_TRAIN_CARRIES_WORKFLOWS=true`, which it does only when the repository
 * variable of that name is `true` AND a bot token (the harness App, or
 * `PUSH_BRANCH_TRIGGERING_CI`) is present: GITHUB_TOKEN can neither push nor
 * merge a workflow file. `subscriptions/` is never carried.
 */
export const carriesWorkflows = (): boolean => process.env.MERGE_TRAIN_CARRIES_WORKFLOWS === "true";

// ── The pure decisions ──────────────────────────────────────────────────────

export interface Member {
  number: number;
  sha: string;
}

/** What a train PR records about itself, and about what comes after it. */
export interface TrainState {
  /** The members this train carries, at the heads it was built from. */
  members: Member[];
  /** Batches still to test, first first: the bisect queue (PR numbers). */
  queue: number[][];
}

export function readState(body: string | null | undefined): TrainState | undefined {
  const m = STATE_MARKER.exec(body ?? "");
  if (!m) return undefined;
  try {
    const s = JSON.parse(m[1]!);
    if (!Array.isArray(s.members) || !Array.isArray(s.queue)) return undefined;
    return { members: s.members, queue: s.queue };
  } catch {
    return undefined;
  }
}

export const writeState = (s: TrainState): string => `<!-- merge-train:state ${JSON.stringify(s)} -->`;

/** A body with its state replaced (or appended), so a closed train carries the queue on. */
export const withState = (body: string, s: TrainState): string =>
  STATE_MARKER.test(body) ? body.replace(STATE_MARKER, writeState(s)) : `${body}\n${writeState(s)}`;

/**
 * After a red batch: a batch of one is the culprit; a larger one is split in
 * two, the first half tested next and the second queued behind it. With one
 * culprit among k members this is about ⌈log₂ k⌉ extra runs, and every green
 * half lands on the way.
 */
export function afterRed(members: readonly number[], queue: readonly number[][]): { eject?: number; queue: number[][] } {
  if (members.length <= 1) return { eject: members[0], queue: [...queue] };
  const half = Math.ceil(members.length / 2);
  return { queue: [members.slice(0, half), members.slice(half), ...queue] };
}

/**
 * The next batch: the head of the bisect queue, restricted to PRs still ready
 * (a member that left the pool is dropped, an empty batch skipped); when the
 * queue is empty, every ready PR, oldest first.
 */
export function nextBatch(ready: readonly number[], queue: readonly number[][]): { batch: number[]; queue: number[][] } {
  const pool = new Set(ready);
  const q = queue.map((b) => b.filter((n) => pool.has(n))).filter((b) => b.length > 0);
  if (q.length > 0) return { batch: q[0]!, queue: q.slice(1) };
  return { batch: [...ready].sort((a, b) => a - b), queue: [] };
}

export interface Candidate {
  number: number;
  draft: boolean;
  baseRef: string;
  sameRepo: boolean;
  headSha: string;
  labels: string[];
  /** The actor type of the newest `labeled` event for {@link OPT_IN}: `User`, `Bot`, or undefined. */
  labelledBy?: string;
  /** The newest review by a person with write access, when its state is APPROVED. */
  approved: boolean;
  files: string[];
  /** The head's own check runs. */
  runs: CheckRun[];
}

/** Why a PR is not in the next train, or undefined when it is ready. */
export function notReady(c: Candidate, mainRuns: readonly CheckRun[], workflowsOk = carriesWorkflows()): string | undefined {
  if (c.labels.includes(BATCH_LABEL)) return "it is a train PR itself";
  const optedIn = (c.labels.includes(OPT_IN) && c.labelledBy === "User") || c.approved;
  if (!optedIn) {
    return c.labels.includes(OPT_IN)
      ? "the `merge-train` label was not added by a person"
      : "not opted in (no `merge-train` label, no approval)";
  }
  if (c.draft) return "a draft";
  if (c.baseRef !== "main") return `its base is ${c.baseRef}, not main`;
  if (!c.sameRepo) return "a fork";
  const bad = c.files.filter((f) => PROTECTED.test(f) && !(workflowsOk && WORKFLOWS.test(f)));
  if (bad.length) return `touches a path the train never carries: ${bad.slice(0, 3).join(", ")}`;
  // Its own checks, compared with main job by job: a head whose checks have
  // not finished is not ready; a failure main does not share is the author's
  // to fix first. A conflicted PR has no runs at all (GitHub runs none) and is
  // admitted: the train integrates it, and the train's run judges it.
  if (c.runs.length === 0) return undefined;
  // Only checks actually running count as pending here: a gate main runs and
  // the PR skipped (a draft's fast tier, affected-only selection) is the
  // train run's to ask, not a reason to wait forever.
  const v = compare(c.runs, mainRuns);
  const running = v.pending.filter((n) => c.runs.some((r) => r.name === n));
  if (running.length) return `its own checks are still running (${running.length})`;
  if (v.newFailures.length) return `its own checks fail where main passes: ${v.newFailures.slice(0, 3).join(", ")}`;
  return undefined;
}

export interface TrainPr {
  number: number;
  state: "open" | "closed";
  merged: boolean;
  body: string;
  headSha: string;
  headRef: string;
}

export type Step =
  | { action: "wait"; reason: string }
  | { action: "merge"; train: TrainPr }
  | { action: "red"; train: TrainPr; eject?: number; queue: number[][] }
  | { action: "build"; batch: number[]; queue: number[][] }
  | { action: "idle"; reason: string };

/**
 * One tick's decision, given the train PRs (newest first), the verdict of the
 * open one's head, and the ready pool.
 */
export function decideStep(trains: readonly TrainPr[], verdict: Verdict["state"] | undefined, ready: readonly number[]): Step {
  const open = trains.find((t) => t.state === "open");
  if (open) {
    if (verdict === undefined || verdict === "pending") return { action: "wait", reason: `train #${open.number} is still being checked` };
    if (verdict === "success") return { action: "merge", train: open };
    const s = readState(open.body);
    const r = afterRed((s?.members ?? []).map((m) => m.number), s?.queue ?? []);
    return { action: "red", train: open, ...r };
  }
  const last = trains.find((t) => readState(t.body) !== undefined);
  const { batch, queue } = nextBatch(ready, readState(last?.body)?.queue ?? []);
  if (batch.length === 0) return { action: "idle", reason: "no opted-in PR is ready" };
  return { action: "build", batch, queue };
}

// ── The network ─────────────────────────────────────────────────────────────

interface PullJson {
  number: number;
  state: string;
  draft?: boolean;
  body: string | null;
  merged_at?: string | null;
  head: { sha: string; ref: string; repo: { full_name: string } | null };
  base: { ref: string };
  labels: Array<{ name: string }>;
  mergeable?: boolean | null;
  // Read only to word a refusal: it can go stale (bean fx5r), and `unknown`
  // means not computed yet (h2s9). The merge itself relies on the PUT's sha.
  mergeable_state?: string;
}

const WRITERS = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export async function candidate(api: Api, repo: string, p: PullJson): Promise<Candidate> {
  const labels = p.labels.map((l) => l.name);
  let labelledBy: string | undefined;
  if (labels.includes(OPT_IN)) {
    const events = await api.get<Array<{ event: string; label?: { name: string }; actor?: { type?: string } | null }>>(
      `/repos/${repo}/issues/${p.number}/events?per_page=100`,
    );
    labelledBy = events.filter((e) => e.event === "labeled" && e.label?.name === OPT_IN).at(-1)?.actor?.type;
  }
  const reviews = await api.get<Array<{ state: string; author_association: string; user: { type?: string } | null }>>(
    `/repos/${repo}/pulls/${p.number}/reviews?per_page=100`,
  );
  const people = reviews.filter((r) => r.user?.type === "User" && WRITERS.has(r.author_association) && r.state !== "COMMENTED");
  const approved = people.at(-1)?.state === "APPROVED";
  const files: string[] = [];
  for (let page = 1; page <= 30; page++) {
    const f = await api.get<Array<{ filename: string }>>(`/repos/${repo}/pulls/${p.number}/files?per_page=100&page=${page}`);
    files.push(...f.map((x) => x.filename));
    if (f.length < 100) break;
  }
  return {
    number: p.number,
    draft: Boolean(p.draft),
    baseRef: p.base.ref,
    sameRepo: p.head.repo?.full_name === repo,
    headSha: p.head.sha,
    labels,
    labelledBy,
    approved,
    files,
    runs: await checkRuns(api, repo, p.head.sha),
  };
}

export const isOwnTrain = (p: PullJson, repo: string): boolean =>
  p.labels.some((l) => l.name === BATCH_LABEL) && p.head.ref.startsWith(BRANCH_PREFIX) && p.head.repo?.full_name === repo;

/** This repository's train PRs, newest first (the newest 30). */
export async function trainPrs(api: Api, repo: string): Promise<TrainPr[]> {
  const pulls = await api.get<PullJson[]>(`/repos/${repo}/pulls?state=all&sort=created&direction=desc&per_page=30`);
  return pulls
    .filter((p) => isOwnTrain(p, repo))
    .map((p) => ({
      number: p.number,
      state: p.state === "open" ? "open" : "closed",
      merged: Boolean(p.merged_at),
      body: p.body ?? "",
      headSha: p.head.sha,
      headRef: p.head.ref,
    }));
}

/**
 * Every opted-in PR, each with the reason it is not ready (or none). Only the
 * labelled PRs, and those a search finds approved, are read in full: reading
 * every open PR's events, reviews and files each tick would spend the token's
 * hourly budget on PRs nobody opted in.
 */
export async function pool(api: Api, repo: string, mainRuns: readonly CheckRun[]): Promise<Array<{ c: Candidate; why?: string }>> {
  const pulls: PullJson[] = [];
  for (let page = 1; page <= 10; page++) {
    const p = await api.get<PullJson[]>(`/repos/${repo}/pulls?state=open&base=main&per_page=100&page=${page}`);
    pulls.push(...p);
    if (p.length < 100) break;
  }
  let approved = new Set<number>();
  try {
    const q = encodeURIComponent(`repo:${repo} is:pr is:open review:approved base:main`);
    const r = await api.get<{ items: Array<{ number: number }> }>(`/search/issues?q=${q}&per_page=100`);
    approved = new Set(r.items.map((i) => i.number));
  } catch {
    // Could not search: only the label opts in this tick.
  }
  const out: Array<{ c: Candidate; why?: string }> = [];
  for (const p of pulls) {
    if (p.labels.some((l) => l.name === BATCH_LABEL)) continue;
    if (!p.labels.some((l) => l.name === OPT_IN) && !approved.has(p.number)) continue;
    const c = await candidate(api, repo, p);
    out.push({ c, why: notReady(c, mainRuns) });
  }
  return out;
}

async function judge(api: Api, repo: string, sha: string): Promise<{ v: Verdict; mainSha: string } | undefined> {
  const base = await mainBaseline(api, repo);
  if (!base) return undefined;
  const runs = await checkRuns(api, repo, sha);
  const v = compare(runs, base.runs, await readRecords(api, repo, runs, base.perCommit));
  return { v, mainSha: base.sha };
}

const list = (xs: string[]) => (xs.length ? xs.map((x) => `- \`${x}\``).join("\n") : "- none");

async function upsertComment(api: Api, repo: string, number: number, body: string): Promise<void> {
  const comments = await api.get<Array<{ id: number; body: string }>>(`/repos/${repo}/issues/${number}/comments?per_page=100`);
  const mine = comments.find((c) => c.body.startsWith(COMMENT_MARKER));
  if (mine) await api.send("PATCH", `/repos/${repo}/issues/comments/${mine.id}`, { body });
  else await api.send("POST", `/repos/${repo}/issues/${number}/comments`, { body });
}

const comment = (api: Api, repo: string, number: number, body: string) =>
  api.send("POST", `/repos/${repo}/issues/${number}/comments`, { body: `${body}\n\n---\n_Written by \`merge-train.yml\` (bean \`folio-assistant-hd58\`)._` });

/** Take a PR out of the train: remove its opt-in label, and say why. */
async function eject(api: Api, repo: string, number: number, why: string): Promise<void> {
  try {
    await api.send("DELETE", `/repos/${repo}/issues/${number}/labels/${OPT_IN}`, undefined);
  } catch {
    // already gone
  }
  await comment(api, repo, number, why);
}

/** Merge a green train: a merge commit, expected sha = the judged head. */
async function land(api: Api, repo: string, t: TrainPr): Promise<{ merged: boolean; why: string }> {
  let pr: PullJson | undefined;
  for (let i = 0; i < 6; i++) {
    pr = await api.get<PullJson>(`/repos/${repo}/pulls/${t.number}`);
    if (pr.mergeable !== null && pr.mergeable !== undefined) break;
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (!pr || pr.state !== "open" || !isOwnTrain(pr, repo)) return { merged: false, why: "not an open train PR of this repository" };
  if (pr.head.sha !== t.headSha) return { merged: false, why: "its head moved after it was judged" };
  // `mergeable_state` only labels the refusal; it can be stale (fx5r).
  if (pr.mergeable !== true) return { merged: false, why: `GitHub does not call it mergeable (${pr.mergeable_state ?? "unknown"}); main moved, so the next train is rebuilt` };
  try {
    await api.send("PUT", `/repos/${repo}/pulls/${t.number}/merge`, {
      merge_method: "merge",
      sha: t.headSha,
      commit_title: `Merge train #${t.number}: ${(readState(t.body)?.members ?? []).map((m) => `#${m.number}`).join(" ")}`,
    });
  } catch (e) {
    return { merged: false, why: `the merge was refused: ${e instanceof Error ? e.message : String(e)}`.slice(0, 400) };
  }
  return { merged: true, why: `merged at ${t.headSha.slice(0, 10)}` };
}

export interface TickOptions {
  mergeApi?: Api;
  /** Whether a merge through `mergeApi` starts main's push workflows; if not, the gates are dispatched on main. */
  mergeTriggersCi?: boolean;
}

/** One tick. Returns the decision taken, and lines for `$GITHUB_OUTPUT`. */
export async function tick(api: Api, repo: string, opts: TickOptions = {}): Promise<{ step: Step; log: string[]; plan?: TrainState }> {
  const log: string[] = [];
  // Members landed by THIS tick, at the heads that landed. GitHub marks them
  // merged a moment later, so the pool read below can still list them open
  // and labelled; they must not ride the next train. A member whose head
  // moved since has new commits, and may.
  const landed = new Map<number, string>();
  const trains = await trainPrs(api, repo);
  const open = trains.find((t) => t.state === "open");
  let verdict: Verdict["state"] | undefined;
  let judged: { v: Verdict; mainSha: string } | undefined;
  if (open) {
    judged = await judge(api, repo, open.headSha);
    verdict = judged?.v.state;
    if (judged) {
      const v = judged.v;
      await api.send("POST", `/repos/${repo}/statuses/${open.headSha}`, {
        state: v.state,
        context: STATUS_CONTEXT,
        description: `${v.newFailures.length} new, ${v.knownFailures.length} known, ${v.pending.length} running vs main ${judged.mainSha.slice(0, 7)}`.slice(0, 140),
      });
      await upsertComment(api, repo, open.number, [
        COMMENT_MARKER,
        `**Verdict: ${v.state}** compared with main at \`${judged.mainSha.slice(0, 10)}\`.`,
        "", "**New failures (block the merge)**", list(v.newFailures),
        "", "**Known failures (also red on main)**", list(v.knownFailures),
        "", "**Could not be compared (block the merge)**", list(v.undetermined),
        "", "**Still running**", list(v.pending),
      ].join("\n"));
    }
  }
  const step0 = decideStep(trains, verdict, []);
  if (step0.action === "wait") return { step: step0, log: [step0.reason] };

  if (step0.action === "merge") {
    const t = step0.train;
    const m = await land(opts.mergeApi ?? api, repo, t);
    log.push(`train #${t.number}: ${m.why}`);
    if (!m.merged) {
      // A refused merge is not red: close it, and rebuild the same batch on the new main.
      const s = readState(t.body);
      const body = withState(t.body, { members: s?.members ?? [], queue: [(s?.members ?? []).map((x) => x.number), ...(s?.queue ?? [])] });
      await api.send("PATCH", `/repos/${repo}/pulls/${t.number}`, { state: "closed", body });
      await comment(api, repo, t.number, `Not merged: ${m.why}. The next tick rebuilds this batch on the current main.`);
      trains.splice(trains.indexOf(t), 1, { ...t, state: "closed", body });
    } else {
      if (!opts.mergeTriggersCi) {
        try {
          await api.send("POST", `/repos/${repo}/actions/workflows/code-quality-gates.yml/dispatches`, { ref: "main" });
          log.push("dispatched the gates on main (this token's merge starts no push workflow)");
        } catch (e) {
          log.push(`could not dispatch the gates on main: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      for (const mem of readState(t.body)?.members ?? []) {
        landed.set(mem.number, mem.sha);
        const p = await api.get<PullJson>(`/repos/${repo}/pulls/${mem.number}`);
        const moved = p.head.sha !== mem.sha;
        await comment(api, repo, mem.number, moved
          ? `Merged into main by merge train #${t.number} at \`${mem.sha.slice(0, 10)}\`. This PR's head has moved since (\`${p.head.sha.slice(0, 10)}\`); the newer commits are NOT on main and stay open here.`
          : `Merged into main by merge train #${t.number} (one CI run for the batch, bean \`folio-assistant-hd58\`).`);
      }
      trains.splice(trains.indexOf(t), 1, { ...t, state: "closed", merged: true });
    }
  } else if (step0.action === "red") {
    const t = step0.train;
    const body = withState(t.body, { members: readState(t.body)?.members ?? [], queue: step0.queue });
    await api.send("PATCH", `/repos/${repo}/pulls/${t.number}`, { state: "closed", body });
    const fails = judged ? [...judged.v.newFailures, ...judged.v.undetermined] : [];
    if (step0.eject !== undefined) {
      await eject(api, repo, step0.eject, [
        `Ejected from the merge train: on its own on top of main (train #${t.number}) it fails checks that pass on main.`,
        "", list(fails), "",
        "Fix it on this branch, then add the `merge-train` label again.",
      ].join("\n"));
      log.push(`train #${t.number} red with one member: ejected #${step0.eject}`);
    } else {
      log.push(`train #${t.number} red: bisecting, queue ${JSON.stringify(step0.queue)}`);
    }
    await comment(api, repo, t.number, `Closed: new failures compared with main. ${step0.eject !== undefined ? `#${step0.eject} is the culprit and was ejected.` : `Bisecting: next ${JSON.stringify(step0.queue[0])}, then ${JSON.stringify(step0.queue.slice(1))}.`}`);
    trains.splice(trains.indexOf(t), 1, { ...t, state: "closed", body });
  }

  // Plan the next train on the main that now stands.
  const base = await mainBaseline(api, repo);
  const all = await pool(api, repo, base?.runs ?? []);
  for (const { c, why } of all) if (why && (c.labels.includes(OPT_IN) || c.approved)) log.push(`#${c.number} waits: ${why}`);
  const ready = all.filter((x) => !x.why && landed.get(x.c.number) !== x.c.headSha).map((x) => x.c);
  const step = decideStep(trains.filter((t) => t.state !== "open"), undefined, ready.map((c) => c.number));
  if (step.action !== "build") return { step, log };
  const sha = new Map(ready.map((c) => [c.number, c.headSha]));
  return { step, log, plan: { members: step.batch.map((n) => ({ number: n, sha: sha.get(n)! })), queue: step.queue } };
}

/**
 * Is there anything for a tick to do? The sweep asks this, with API calls
 * only, before it starts a runner: an open train to judge, a bisect batch
 * queued, or an opted-in PR that is READY (one that is not would start a
 * runner every tick to find nothing).
 */
export async function pending(api: Api, repo: string, log: (line: string) => void = () => {}): Promise<string | undefined> {
  const trains = await trainPrs(api, repo);
  const open = trains.find((t) => t.state === "open");
  if (open) {
    // Only once its checks have all finished: until then a tick would start a
    // runner to learn "still being checked" (about four per train). The
    // re-pin train's sweep asks the same (`trainsToJudge`).
    const runs = await checkRuns(api, repo, open.headSha);
    const done = runs.length > 0 && runs.every((r) => r.status === "completed");
    if (!done) log(`train #${open.number}: its checks are still running`);
    return done ? `train #${open.number}'s checks have finished: judge it` : undefined;
  }
  const queue = readState(trains.find((t) => readState(t.body))?.body)?.queue ?? [];
  const base = await mainBaseline(api, repo);
  // Say why each opted-in PR waits: "nothing to do" alone could not tell a
  // PR whose checks still run from one the train failed to see (2026-11-06,
  // #2987).
  const all = await pool(api, repo, base?.runs ?? []);
  for (const { c, why } of all) if (why) log(`#${c.number} waits: ${why}`);
  const ready = all.filter((x) => !x.why).map((x) => x.c.number);
  const { batch } = nextBatch(ready, queue);
  return batch.length ? `ready to build: ${batch.map((n) => `#${n}`).join(" ")}` : undefined;
}

// ── The report → the train PR body ─────────────────────────────────────────

interface TrainReport {
  members: Array<{ spec: string; sha: string | null; status: string; reason?: string }>;
  head: string | null;
  verdict: string;
}

/** The members the build actually merged, from `merge:train`'s report. */
export function builtMembers(plan: TrainState, report: TrainReport): { members: Member[]; refused: Array<{ number: number; reason: string }> } {
  const members: Member[] = [];
  const refused: Array<{ number: number; reason: string }> = [];
  for (const m of plan.members) {
    const r = report.members.find((x) => x.spec.split(":")[0] === String(m.number));
    if (r?.status === "merged") members.push(m);
    // Already on main (it landed, or another merge brought it in): nothing to
    // carry and nothing to eject.
    else if (r?.status === "already-contained") continue;
    else refused.push({ number: m.number, reason: r?.reason ?? r?.status ?? "not in the report" });
  }
  return { members, refused };
}

export function trainBody(state: TrainState, refused: Array<{ number: number; reason: string }>, tree: string): string {
  return [
    `A merge train (bean \`folio-assistant-hd58\`): ${state.members.length} PR(s) a person opted in, stacked on main with declared conflict patterns only and one \`regen\`, judged by ONE CI run.`,
    "",
    "**Members**",
    ...state.members.map((m) => `- #${m.number} at \`${m.sha.slice(0, 10)}\``),
    "",
    ...(refused.length ? ["**Left out** (an authored conflict, or the build refused it; back to its owner)", ...refused.map((r) => `- #${r.number}: ${r.reason}`), ""] : []),
    ...(state.queue.length ? [`**Bisect queue after this train:** ${state.queue.map((b) => `[${b.map((n) => `#${n}`).join(" ")}]`).join(", ")}`, ""] : []),
    `**Merge rule:** merged by \`merge-train.yml\` when \`${STATUS_CONTEXT}\` is green (no check fails here that passes on main). Red: a single member is ejected; a larger batch is bisected.`,
    "",
    `<!-- merge-train:tree=${tree} -->`,
    writeState(state),
  ].join("\n");
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
  if (cmd === "pending") {
    const why = await pending(api, repo, (line) => console.error(line));
    if (why) console.log(why);
    return 0;
  }
  if (cmd === "tick") {
    const out = arg(argv, "--out");
    const r = await tick(api, repo, {
      mergeApi: process.env.MERGE_TOKEN ? githubApi(process.env.MERGE_TOKEN) : api,
      mergeTriggersCi: process.env.MERGE_TRIGGERS_CI === "true",
    });
    for (const l of r.log) console.error(l);
    console.log(`action=${r.step.action}`);
    if (r.plan) {
      await Bun.write(`${out}/plan.json`, JSON.stringify(r.plan));
      console.log(`build=${r.plan.members.map((m) => `${m.number}:${m.sha}`).join(" ")}`);
    }
    return 0;
  }
  if (cmd === "body") {
    const plan = JSON.parse(readFileSync(arg(argv, "--plan"), "utf-8")) as TrainState;
    const report = JSON.parse(readFileSync(arg(argv, "--report"), "utf-8")) as TrainReport;
    const { members, refused } = builtMembers(plan, report);
    // A refused member leaves the bisect queue too; the rest of the plan stands.
    const gone = new Set(refused.map((r) => r.number));
    const state: TrainState = { members, queue: plan.queue.map((b) => b.filter((n) => !gone.has(n))).filter((b) => b.length) };
    console.log(trainBody(state, refused, arg(argv, "--tree")));
    return members.length > 0 ? 0 : 3;
  }
  // Owner, 2026-11-05 ("Resolve generated only"): a member the build refused
  // (a conflict in a hand-written file) is EJECTED with a comment, and waits
  // for its author; it does not ride the next train refused again.
  if (cmd === "eject-refused") {
    const plan = JSON.parse(readFileSync(arg(argv, "--plan"), "utf-8")) as TrainState;
    const report = JSON.parse(readFileSync(arg(argv, "--report"), "utf-8")) as TrainReport;
    for (const r of builtMembers(plan, report).refused) {
      await eject(api, repo, r.number, [
        "Ejected from the merge train: it does not stack on main plus the PRs before it.",
        "", `- ${r.reason}`, "",
        "The train resolves conflicts in declared generated paths only (owner, 2026-11-05). Merge main into this branch, resolve the hand-written conflict, then add the `merge-train` label again.",
      ].join("\n"));
      console.log(`ejected #${r.number}: ${r.reason}`);
    }
    return 0;
  }
  console.error("usage: merge-train.ts pending | tick --out <dir> | body --plan <f> --report <f> --tree <sha> | eject-refused --plan <f> --report <f>");
  return 2;
}

if (import.meta.main) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (e) => {
      console.error(`merge-train: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(2);
    },
  );
}
