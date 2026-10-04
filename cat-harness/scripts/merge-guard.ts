#!/usr/bin/env bun
/**
 * The single way a steward lands a pull request.
 *
 * @module cat-harness/scripts/merge-guard
 * @covers none — a merge precondition over GitHub's live facts about one PR; it judges no declared graph
 *
 * Bean `uoob` (merge gate (f), epic `nok9`). Owner ruling 2026-10-03, option 1: build an ENFORCED merge
 * guard. Until this existed, the Merge Manager steward landed PRs with
 *
 * ```
 * gh api -X PUT repos/litlfred/folio-assistant/pulls/<n>/merge -f sha=<head>
 * ```
 *
 * under the owner's token, and nothing between "the steward decided" and "the
 * PR is on its base" asked whether the PR was finished. Three were not:
 *
 * | PR | what was wrong when it merged |
 * |---|---|
 * | #1937 | its base was `claude/quirky-davinci-ixuymr`, the head of #1764, which had ALREADY merged, so it landed on a dead branch; its head was newer than its `ready:` comment, and the commits in between were a hand merge and two claim commits, not bot merges; `needs-merge-human` was still on it; its own `pull_request` runs had failed and only a `workflow_dispatch` run was green |
 * | #1960 | no `ready-to-merge` label, no `ready:` comment, and its body still read `- [ ] CI green` |
 * | #1957 | the steward itself called `ready_for_review` and added `ready-to-merge`, 75 s before merging; there was no `ready:` comment at all |
 *
 * No workflow merges into a base (`merge-main.yml` merges `main` INTO PRs only),
 * the repository's rulesets are empty, and its branch protection could not be
 * read. So the only thing that could have stopped any of the three was the
 * steward's memory, and it did not.
 *
 * ## Usage
 *
 * ```
 * bun run merge:guard <pr>                         # evaluate only
 * bun run merge:guard <pr> --merge --session <id>  # land it, only if every check passes
 * ```
 *
 * `--session` is the MERGING session (an id `session_…` or its URL). It is
 * required with `--merge`, because check 2 asks whether that session is the
 * one that marked the PR ready. `--status` also posts the verdict as the
 * `merge-guard` commit status on the head, which is what the workflow does.
 *
 * ## The seven checks
 *
 * Every refusal names its check, by number and by id:
 *
 * 1. `base` — the base is `main`, the PR is open, and the base is not the head
 *    branch of a merged PR (#1937).
 * 2. `ready-for-review` — not a draft; and the latest `ready_for_review` event
 *    is attributable to the PR's OWN session, never the merging one (#1957).
 * 3. `ready-marker` — a `ready: <sha>` comment whose session footer is the
 *    PR's own session, and `<sha>` is the head or every commit after it is a
 *    merge-main bot merge (#1937, #1960, #1957).
 * 4. `labels` — `ready-to-merge` present, `needs-merge-human` absent (#1937, #1960).
 * 5. `ci` — every `pull_request` run on the head is `success` or `skipped`,
 *    and every workflow owed for that event ran (#1937). One substitution: on
 *    a head that is a merge-main bot merge, a `pull_request` run GitHub held
 *    for approval (`NOT_EXECUTED`, bean `0qjq`) is judged by the latest
 *    `workflow_dispatch` run of the same workflow on the head — green counts,
 *    running is not-ready, red is a defect. Held with no dispatch: refused
 *    not-ready if `merge-main.yml` dispatches that workflow (it is still
 *    owed), reported "not judged" if it does not (preview-only), `unknown` if
 *    that file's dispatch line cannot be parsed.
 * 6. `checklist` — no unticked `- [ ]` item in the body (#1960).
 * 7. `open-question` — no comment newer than the ready marker asks the owner
 *    or the Merge Manager an open question. A heuristic; its limits are on
 *    {@link openQuestions}.
 *
 * ## Exit codes
 *
 * | code | means |
 * |---|---|
 * | 0 | every check passed (and, with `--merge`, the PR merged) |
 * | 1 | refused: at least one check failed, and every check could be asked |
 * | 2 | could not determine: a fact could not be read, or bad usage |
 *
 * ## The commit status (`--status`)
 *
 * | verdict | status | when |
 * |---|---|---|
 * | pass | `success` | every check passes |
 * | refused, every refusal `not-ready` | `pending` | a draft, no marker, no label, an unticked box, CI still running, an open question |
 * | refused, any refusal a `defect` | `failure` | a base that is not `main` or is dead, `needs-merge-human`, red CI, a marker or ready-flip by another session |
 * | unknown | `error` | a fact could not be read |
 *
 * `pending` exists so that every unfinished PR is not painted red, which
 * would teach readers to ignore red ({@link RefusalKind}). A required check
 * blocks the merge in every state but `success`, and the exit code is 1 for
 * both kinds of refusal.
 *
 * **Unknown is never a pass.** A check that could not ask returns `unknown`,
 * and an unknown anywhere makes the whole verdict `unknown` even when another
 * check refused. A guard blind on one check has not cleared the others.
 *
 * ## Why attribution goes through comments, not the event's actor
 *
 * Every session here acts with the owner's token, so every timeline event's
 * actor is `litlfred`: the actor login cannot tell the owning session from
 * the steward. The session IS recorded in the footer of what a session posts
 * (`https://claude.ai/code/session_…`). So a `ready_for_review` event is
 * attributed to the session of the nearest session-bearing comment within
 * {@link READY_WINDOW_MS}, and the rule the owning session follows is: **mark
 * the PR ready and post its `ready: <sha>` marker together.** `--actor` is
 * still compared, for the day a steward acts under its own login.
 *
 * ## What this does not stop
 *
 * It guards against a CARELESS steward, not a hostile author: a PR may edit
 * `.github/workflows/merge-guard.yml` in its own tree, and every check reads
 * text a session wrote. The workflow runs this script from `main`'s copy for
 * that reason, but a pull_request run still uses the PR's workflow file.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { coverageFor, runsForHead, NOT_EXECUTED, type HeadRunVerdict, type RunRow } from "./check-head-has-run.ts";
import { classifyResponse, withBackoff } from "../src/core/retry.js";
import { scanTriggers, type TriggerScan } from "../src/core/workflow-events.js";
import { detectRepoUrl, ownerRepo } from "../src/core/git-refs.js";
import { repoRootFor } from "../schemas/cat-harness.js";

// ─── vocabulary ────────────────────────────────────────────────────────────

export const BASE = "main";
export const READY_LABEL = "ready-to-merge";
export const HUMAN_LABEL = "needs-merge-human";
export const BOT_LOGIN = "github-actions[bot]";
/** The first line of every comment `merge-main.yml` writes. */
export const MERGE_MAIN_MARKER = "<!-- merge-main-bot -->";
/** This guard's own workflow. Its runs are never evidence about the head: they are the guard. */
export const SELF_WORKFLOW_FILE = ".github/workflows/merge-guard.yml";
/** The workflow that merges main into PR heads, and dispatches the gating workflows after a bot push. */
export const MERGE_MAIN_WORKFLOW = ".github/workflows/merge-main.yml";
/** The commit-status context the workflow posts and a ruleset would require. */
export const STATUS_CONTEXT = "merge-guard";
/** How far from a `ready_for_review` event a session-bearing comment may be and still attribute it. */
export const READY_WINDOW_MS = 10 * 60 * 1000;
/** GitHub's pulls/{n}/commits endpoint stops at this many commits. */
export const COMMITS_API_CAP = 250;
/** CI conclusions that count as passed for check 5. */
export const PASSING = new Set(["success", "skipped"]);

export const CHECKS = [
  "base",
  "ready-for-review",
  "ready-marker",
  "labels",
  "ci",
  "checklist",
  "open-question",
] as const;
export type CheckId = (typeof CHECKS)[number];

// ─── the snapshot evaluate() reads ─────────────────────────────────────────

export interface GhUser {
  login: string;
}
export interface GhComment {
  id: number;
  created_at: string;
  body: string;
  user: GhUser | null;
  html_url?: string;
}
export interface GhTimelineEvent {
  event: string;
  created_at?: string;
  actor?: GhUser | null;
}
export interface GhCommit {
  sha: string;
  author: GhUser | null;
  commit: { author: { name: string; date?: string } | null; message?: string };
  parents: { sha: string }[];
}
export interface GhPull {
  number: number;
  state: string;
  draft: boolean;
  merged?: boolean;
  body: string | null;
  user?: GhUser | null;
  labels: { name: string }[];
  head: { sha: string; ref: string };
  base: { ref: string; repo?: { owner?: GhUser } };
}

/** A workflow run as the Actions API returns it; `id` orders re-runs. */
export interface GuardRun extends RunRow {
  id?: number;
  created_at?: string;
  head_sha?: string | null;
}

/**
 * Everything the seven checks read, fetched once. The tests build this from
 * fixture JSON; {@link fetchSnapshot} builds it from GitHub.
 */
export interface GuardSnapshot {
  pr: GhPull;
  comments: GhComment[];
  timeline: GhTimelineEvent[];
  commits: GhCommit[];
  /** Merged PRs whose HEAD branch is this PR's base, or `unknown` when that could not be asked. */
  baseMergedAsHeadOf: number[] | { unknown: string };
  runs: HeadRunVerdict;
  scan: TriggerScan;
  /**
   * The workflow FILES (basenames) merge-main dispatches on a PR head it
   * pushed with the bot token, parsed from {@link MERGE_MAIN_WORKFLOW} by
   * {@link parseMergeMainDispatches}; `unknown` when that could not be read.
   */
  mergeMainDispatches: string[] | { unknown: string };
}

export interface GuardOptions {
  /** The session that would merge. With `--merge` it is required. */
  mergingSession?: string;
  /** The login the merge would be made under, for check 2's actor half. */
  mergingActor?: string;
  /** For a fixture's clock; defaults to {@link READY_WINDOW_MS}. */
  readyWindowMs?: number;
}

export type CheckStatus = "pass" | "refuse" | "unknown" | "skip";

/**
 * What KIND of refusal — and so which commit-status state it posts.
 *
 * `not-ready` is the ordinary state of a PR nobody has finished yet: a draft,
 * no `ready:` marker, no label, an unticked box, CI still running, a question
 * still open. `defect` is something WRONG: a base that is not `main` or is a
 * dead branch, `needs-merge-human`, red CI on the head, a marker or a
 * ready-flip by a session that is not the PR's own, a marker naming a commit
 * the PR does not have.
 *
 * The split exists because the status is posted on EVERY open PR. Painting
 * every draft red is noise that trains people to ignore red (coordinator,
 * 2026-10-03), so a PR that is merely unfinished posts `pending` and only a
 * defect posts `failure`. A required check blocks the merge in both states,
 * and the exit code is 1 in both: this changes what a reader SEES, never what
 * may merge.
 */
export type RefusalKind = "not-ready" | "defect";

export interface CheckResult {
  n: number;
  id: CheckId;
  status: CheckStatus;
  detail: string;
  /** Present on a refusal only. */
  kind?: RefusalKind;
}

/** The commit-status state a verdict posts. */
export type StatusState = "success" | "pending" | "failure" | "error";

export interface GuardVerdict {
  pr: number;
  head: string;
  verdict: "pass" | "refused" | "unknown";
  /** `pending` when every refusal is `not-ready`; `failure` when any is a `defect`. */
  state: StatusState;
  exitCode: 0 | 1 | 2;
  checks: CheckResult[];
}

// ─── text helpers ──────────────────────────────────────────────────────────

const SESSION_RE = /claude\.ai\/code\/(session_[A-Za-z0-9]+)/g;

/** Every session id a text links to, in order. */
export function sessionsIn(text: string | null | undefined): string[] {
  return [...(text ?? "").matchAll(SESSION_RE)].map((m) => m[1]!);
}

/**
 * The session a text is SIGNED by: the LAST session link in it, which is
 * where the footer convention puts it. Earlier links may name other sessions
 * being talked about.
 */
export function signingSession(text: string | null | undefined): string | undefined {
  return sessionsIn(text).at(-1);
}

/** Accept `session_…` or any URL containing it. */
export function normaliseSession(arg: string): string | undefined {
  const m = arg.match(/(session_[A-Za-z0-9]+)/);
  return m?.[1];
}

/** Text with fenced code blocks removed, so a quoted template cannot trip a check. */
export function withoutCode(text: string): string {
  return text.replace(/```[\s\S]*?(```|$)/g, "");
}

/**
 * `ready: <sha>` at the start of a line, optionally bolded or in backticks.
 * A quoted line (`> ready: …`) does not match, so quoting somebody's marker
 * is not making one.
 */
const READY_RE = /^[ \t]*\**[ \t]*ready:\**[ \t]*`?([0-9a-f]{7,40})\b/im;

export interface ReadyMarker {
  sha: string;
  session: string | undefined;
  at: string;
  url?: string;
}

/** Every `ready:` comment, oldest first. */
export function readyMarkers(comments: readonly GhComment[]): ReadyMarker[] {
  const out: ReadyMarker[] = [];
  for (const c of byTime(comments)) {
    const m = withoutCode(c.body ?? "").match(READY_RE);
    if (m) out.push({ sha: m[1]!.toLowerCase(), session: signingSession(c.body), at: c.created_at, url: c.html_url });
  }
  return out;
}

function byTime<T extends { created_at?: string }>(xs: readonly T[]): T[] {
  return [...xs].sort((a, b) => Date.parse(a.created_at ?? "") - Date.parse(b.created_at ?? ""));
}

const short = (sha: string) => sha.slice(0, 10);

/** Heads named by merge-main's own comments: "pushed `<sha>`". Only the bot's comments count. */
export function botPushedShas(comments: readonly GhComment[]): string[] {
  return comments
    .filter((c) => c.user?.login === BOT_LOGIN && (c.body ?? "").trimStart().startsWith(MERGE_MAIN_MARKER))
    .flatMap((c) => [...(c.body ?? "").matchAll(/pushed `([0-9a-f]{7,40})`/g)].map((m) => m[1]!));
}

/**
 * A merge-main bot merge: a merge commit (two parents) authored by the bot,
 * or one the bot's own comment names as what it pushed.
 */
export function isBotMerge(c: GhCommit, botNamed: readonly string[]): boolean {
  if (c.parents.length < 2) return false;
  if (c.author?.login === BOT_LOGIN || c.commit.author?.name === BOT_LOGIN) return true;
  return botNamed.some((s) => c.sha.startsWith(s));
}

/** Unticked task-list items in a body, outside code. */
export function untickedItems(body: string | null | undefined): string[] {
  return withoutCode(body ?? "")
    .split("\n")
    .filter((l) => /^\s*[-*+]\s+\[ \]/.test(l))
    .map((l) => l.trim());
}

/**
 * Who a question has to be addressed to, for check 7 to count it.
 * `ownerLogin` is the repository owner's login.
 */
export function addresseeRe(ownerLogin: string | undefined): RegExp {
  const login = ownerLogin ? `|@${ownerLogin.replace(/[^A-Za-z0-9-]/g, "")}\\b` : "";
  // A request for a decision is addressed to whoever decides, which on a PR
  // is the owner — measured on #1937, whose open question ("Should I delete
  // the `_external` copy?") named nobody but said "I need a decision".
  return new RegExp(
    `\\b(owner|merge[- ]manager|merge[- ]steward|steward|decision|your call|please confirm|approve)\\b${login}`,
    "i",
  );
}

/** Sentences ending in `?`, in one line. A `?` inside a URL is followed by text, so it does not end one. */
export function questionsIn(line: string): string[] {
  return [...line.matchAll(/([^.!?\n]*\?)(?=[\s*_`)]|$)/g)]
    .map((m) => m[1]!.replace(/^[\s*_`>#-]+/, "").trim())
    .filter((q) => q.length > 1);
}

export interface OpenQuestion {
  line: string;
  url?: string;
  at: string;
}

/**
 * Check 7's heuristic: comments newer than `since`, not written by the bot,
 * that contain a sentence ending in `?` AND, somewhere in the same comment,
 * name the owner or the Merge Manager or ask for a decision ({@link addresseeRe}).
 *
 * **Its limits, stated so nobody reads a pass as "nothing is open":**
 *
 * - It misses a question with no `?` ("tell me whether…"), and one in a
 *   comment that neither names an addressee nor asks for a decision.
 * - It flags a rhetorical question, and a question already answered in a later
 *   comment: it cannot read an answer. The remedy is the owning session's: a
 *   fresh `ready: <sha>` comment after the question is settled moves the
 *   window past it.
 * - Quoted lines (`>`) and fenced code are ignored, so quoting a question does
 *   not re-open it, and a question asked only inside a quote is missed.
 * - It reads issue comments only, not review comments or review bodies.
 */
export function openQuestions(
  comments: readonly GhComment[],
  since: string,
  ownerLogin: string | undefined,
): OpenQuestion[] {
  const addressee = addresseeRe(ownerLogin);
  const out: OpenQuestion[] = [];
  for (const c of byTime(comments)) {
    if (Date.parse(c.created_at) <= Date.parse(since)) continue;
    if (c.user?.login === BOT_LOGIN) continue;
    const text = withoutCode(c.body ?? "");
    if (!addressee.test(text)) continue;
    for (const raw of text.split("\n")) {
      if (/^\s*>/.test(raw)) continue;
      for (const line of questionsIn(raw)) out.push({ line, url: c.html_url, at: c.created_at });
    }
  }
  return out;
}

/**
 * The workflow files merge-main dispatches after a bot-token push, from its
 * `for wf in a.yml b.yml; do gh workflow run "$wf" …` line. `undefined` when
 * that line is absent or names anything but workflow files: check 5 then
 * cannot say which held runs are owed a dispatch, and returns `unknown`.
 */
export function parseMergeMainDispatches(text: string): string[] | undefined {
  const m = text.match(/for\s+wf\s+in\s+([^;\n]+?)\s*;\s*do\s+gh\s+workflow\s+run\s+"?\$\{?wf\b/);
  if (!m) return undefined;
  const files = m[1]!.trim().split(/\s+/);
  return files.length > 0 && files.every((f) => /^[\w.-]+\.ya?ml$/.test(f)) ? files : undefined;
}

// ─── the seven checks ──────────────────────────────────────────────────────

const R = (n: number, id: CheckId, status: CheckStatus, detail: string, kind?: RefusalKind): CheckResult =>
  status === "refuse" ? { n, id, status, detail, kind: kind ?? "not-ready" } : { n, id, status, detail };

function checkBase(s: GuardSnapshot): CheckResult {
  const problems: string[] = [];
  if (s.pr.state !== "open" || s.pr.merged) problems.push(`the PR is ${s.pr.merged ? "already merged" : s.pr.state}`);
  if (s.pr.base.ref !== BASE) problems.push(`base is \`${s.pr.base.ref}\`, not \`${BASE}\``);
  if (!Array.isArray(s.baseMergedAsHeadOf)) {
    if (problems.length) return R(1, "base", "refuse", problems.join("; "), "defect");
    return R(1, "base", "unknown", `could not ask whether \`${s.pr.base.ref}\` is a merged PR's head: ${s.baseMergedAsHeadOf.unknown}`);
  }
  if (s.baseMergedAsHeadOf.length > 0) {
    problems.push(
      `base \`${s.pr.base.ref}\` is the head branch of merged PR ${s.baseMergedAsHeadOf.map((n) => `#${n}`).join(", ")}: a merge into it lands nowhere anyone reads`,
    );
  }
  return problems.length ? R(1, "base", "refuse", problems.join("; "), "defect") : R(1, "base", "pass", `base is \`${BASE}\``);
}

function checkReadyForReview(s: GuardSnapshot, o: GuardOptions): CheckResult {
  if (s.pr.draft) return R(2, "ready-for-review", "refuse", "the PR is a draft");
  const events = byTime(s.timeline.filter((e) => e.event === "ready_for_review"));
  const last = events.at(-1);
  if (!last) return R(2, "ready-for-review", "pass", "not a draft, and never converted from one");
  const at = Date.parse(last.created_at ?? "");
  const actor = last.actor?.login ?? "?";
  const own = signingSession(s.pr.body);
  const window = o.readyWindowMs ?? READY_WINDOW_MS;

  if (o.mergingActor && actor === o.mergingActor && actor !== s.pr.user?.login) {
    return R(2, "ready-for-review", "refuse", `marked ready at ${last.created_at} by \`${actor}\`, the merging actor`, "defect");
  }
  const near = s.comments
    .map((c) => ({ c, session: signingSession(c.body), dt: Math.abs(Date.parse(c.created_at) - at) }))
    .filter((x) => x.session && x.dt <= window)
    .sort((a, b) => a.dt - b.dt);
  if (o.mergingSession && near.some((x) => x.session === o.mergingSession)) {
    return R(
      2,
      "ready-for-review",
      "refuse",
      `marked ready at ${last.created_at} (actor \`${actor}\`) beside a comment signed by the MERGING session \`${o.mergingSession}\`: the steward may not mark a PR ready and then merge it`,
      "defect",
    );
  }
  const attributed = near[0]?.session;
  if (!own || attributed !== own) {
    // Signed by somebody ELSE is a defect; signed by nobody is merely unfinished.
    const kind: RefusalKind = attributed && own ? "defect" : "not-ready";
    return R(
      2,
      "ready-for-review",
      "refuse",
      `marked ready at ${last.created_at} (actor \`${actor}\`), and that cannot be attributed to the PR's own session ` +
        `(${own ? `\`${own}\`` : "its body names none"}): the nearest session-signed comment within ${Math.round(window / 60000)} min ` +
        `${attributed ? `is signed \`${attributed}\`` : "does not exist"}. The owning session marks the PR ready and posts its \`ready: <sha>\` together`,
      kind,
    );
  }
  return R(2, "ready-for-review", "pass", `marked ready at ${last.created_at} by the PR's own session \`${own}\``);
}

function latestOwnMarker(s: GuardSnapshot): ReadyMarker | undefined {
  const own = signingSession(s.pr.body);
  return own ? readyMarkers(s.comments).filter((m) => m.session === own).at(-1) : undefined;
}

function checkReadyMarker(s: GuardSnapshot): CheckResult {
  const own = signingSession(s.pr.body);
  if (!own) {
    return R(3, "ready-marker", "refuse", "the PR body links no session, so no `ready:` comment can be attributed to the PR's own session");
  }
  const all = readyMarkers(s.comments);
  const marker = latestOwnMarker(s);
  if (!marker) {
    if (all.length === 0) return R(3, "ready-marker", "refuse", "no `ready: <sha>` comment");
    const seen = all.map((m) => `\`${short(m.sha)}\` signed ${m.session ? `\`${m.session}\`` : "by no session"}`).join(", ");
    const kind: RefusalKind = all.some((m) => m.session && m.session !== own) ? "defect" : "not-ready";
    return R(3, "ready-marker", "refuse", `no \`ready:\` comment is signed by the PR's own session \`${own}\` (found: ${seen})`, kind);
  }
  const head = s.pr.head.sha.toLowerCase();
  if (head.startsWith(marker.sha)) return R(3, "ready-marker", "pass", `\`ready: ${short(marker.sha)}\` names the head`);
  const i = s.commits.findIndex((c) => c.sha.toLowerCase().startsWith(marker.sha));
  if (i < 0) {
    if (s.commits.length >= COMMITS_API_CAP) {
      return R(3, "ready-marker", "unknown", `ready sha \`${short(marker.sha)}\` is not among the first ${COMMITS_API_CAP} commits, which is all the API returns`);
    }
    return R(3, "ready-marker", "refuse", `ready sha \`${short(marker.sha)}\` is not a commit on this PR (head \`${short(head)}\`)`, "defect");
  }
  const named = botPushedShas(s.comments);
  const after = s.commits.slice(i + 1);
  const foreign = after.filter((c) => !isBotMerge(c, named));
  if (foreign.length) {
    const list = foreign
      .map((c) => `\`${short(c.sha)}\` by ${c.author?.login ?? c.commit.author?.name ?? "?"}${c.parents.length > 1 ? " (merge)" : ""}`)
      .join(", ");
    return R(
      3,
      "ready-marker",
      "refuse",
      `the head \`${short(head)}\` is newer than \`ready: ${short(marker.sha)}\`, and ${foreign.length} commit(s) after it are not merge-main bot merges: ${list}`,
    );
  }
  return R(3, "ready-marker", "pass", `\`ready: ${short(marker.sha)}\`; the ${after.length} commit(s) after it are merge-main bot merges`);
}

function checkLabels(s: GuardSnapshot): CheckResult {
  const labels = s.pr.labels.map((l) => l.name);
  const problems: string[] = [];
  if (!labels.includes(READY_LABEL)) problems.push(`\`${READY_LABEL}\` is absent`);
  if (labels.includes(HUMAN_LABEL)) problems.push(`\`${HUMAN_LABEL}\` is present`);
  const kind: RefusalKind = labels.includes(HUMAN_LABEL) ? "defect" : "not-ready";
  return problems.length ? R(4, "labels", "refuse", problems.join("; "), kind) : R(4, "labels", "pass", `\`${READY_LABEL}\`, no \`${HUMAN_LABEL}\``);
}

function runOrder(r: GuardRun): number {
  return r.id ?? Number(r.html_url?.match(/\/runs\/(\d+)/)?.[1] ?? 0);
}

/** The latest run per workflow name, by {@link runOrder}. */
function latestByName(runs: readonly GuardRun[]): Map<string, GuardRun> {
  const latest = new Map<string, GuardRun>();
  for (const r of runs) {
    const prev = latest.get(r.name);
    if (!prev || runOrder(r) > runOrder(prev)) latest.set(r.name, r);
  }
  return latest;
}

/** What a held `pull_request` run resolves to, once its stand-in is looked for. */
type HeldOutcome =
  | { ok: true; how: "dispatch"; run: GuardRun }
  | { ok: true; how: "not-judged" }
  | { ok: false; problem: string; kind: RefusalKind }
  | { unknown: string };

function checkCi(s: GuardSnapshot): CheckResult {
  if (s.runs.state === "cannot-ask") return R(5, "ci", "unknown", `could not read the head's runs: ${s.runs.reason}`);
  if (s.scan.unreadable.length) {
    return R(5, "ci", "unknown", `could not read ${s.scan.unreadable.map((u) => u.file).join(", ")}, so the owed set is not established`);
  }
  const head = s.pr.head.sha.toLowerCase();
  // `runsForHead` asks by head_sha already; this is belt and braces for a run
  // that carries its sha, so a dispatch on another commit can never stand in.
  const onHead = (r: GuardRun) => !r.head_sha || r.head_sha.toLowerCase() === head;
  const all: GuardRun[] = (s.runs.state === "has-run" ? (s.runs.runs as GuardRun[]) : []).filter(onHead);
  const selfNames = new Set(s.scan.triggers.filter((t) => t.file === SELF_WORKFLOW_FILE).map((t) => t.name));
  const prRuns = all.filter((r) => r.event === "pull_request" && !selfNames.has(r.name));
  const dispatchRuns = latestByName(all.filter((r) => r.event === "workflow_dispatch" && !selfNames.has(r.name)));

  // A `workflow_dispatch` run counts ONLY as the stand-in for a `pull_request`
  // run GitHub held for approval (`NOT_EXECUTED`) on a head that is a
  // merge-main bot merge. merge-main pushes with the bot token, GitHub holds
  // the PR's own runs at `action_required` (bean `0qjq`), and merge-main then
  // dispatches the gating workflows on the branch. Everywhere else a dispatch
  // resolves `refs/heads/<branch>`, not the merge ref (`yv4z`) — but here
  // merge-main has ALREADY merged main into the head, so the head IS the merge
  // and a dispatch on it judges the tree that would land. A green dispatch
  // never rescues a `pull_request` run that executed and went red (#1937).
  const headCommit = s.commits.find((c) => c.sha.toLowerCase() === head);
  const botHead = headCommit !== undefined && isBotMerge(headCommit, botPushedShas(s.comments));
  const fileOf = (name: string) => s.scan.triggers.find((t) => t.name === name)?.file;
  const baseName = (file: string) => file.split("/").at(-1)!;

  const held = new Map<string, HeldOutcome>();
  const resolveHeld = (name: string, conclusion: string): HeldOutcome => {
    const cached = held.get(name);
    if (cached) return cached;
    const out = ((): HeldOutcome => {
      if (!botHead) {
        return { ok: false, problem: `${name}: ${conclusion}, and the head is not a merge-main bot merge, so no dispatch can stand in`, kind: "not-ready" };
      }
      const d = dispatchRuns.get(name);
      if (d) {
        const ref = `its \`workflow_dispatch\` stand-in${d.id ? ` (run ${d.id})` : ""}`;
        if (d.status !== "completed") return { ok: false, problem: `${name}: ${conclusion}; ${ref} is ${d.status}`, kind: "not-ready" };
        if (PASSING.has(d.conclusion ?? "")) return { ok: true, how: "dispatch", run: d };
        const kind: RefusalKind = NOT_EXECUTED.has(d.conclusion ?? "") ? "not-ready" : "defect";
        return { ok: false, problem: `${name}: ${conclusion}; ${ref} is ${d.conclusion}`, kind };
      }
      if (!Array.isArray(s.mergeMainDispatches)) return { unknown: s.mergeMainDispatches.unknown };
      const file = fileOf(name);
      if (file && !s.mergeMainDispatches.includes(baseName(file))) return { ok: true, how: "not-judged" };
      return {
        ok: false,
        problem: file
          ? `${name}: ${conclusion}, and the \`workflow_dispatch\` merge-main owes for \`${baseName(file)}\` has not appeared`
          : `${name}: ${conclusion}, no \`workflow_dispatch\` on the head, and no workflow file declares that name, so whether merge-main owes one is not established`,
        kind: "not-ready",
      };
    })();
    held.set(name, out);
    return out;
  };

  const problems = new Map<string, { text: string; kind: RefusalKind }>();
  const problem = (name: string, text: string, kind: RefusalKind) => {
    if (!problems.has(name)) problems.set(name, { text, kind });
  };

  const latest = latestByName(prRuns);
  for (const [name, r] of latest) {
    if (r.status !== "completed") problem(name, `${name}: ${r.status}`, "not-ready");
    else if (NOT_EXECUTED.has(r.conclusion ?? "")) {
      // A run that never executed is not a verdict on the tree, so it is not
      // red either; on a bot-merged head its dispatch may stand in for it.
      const o = resolveHeld(name, r.conclusion ?? "");
      if ("unknown" in o) {
        return R(5, "ci", "unknown", `\`${name}\` was held for approval and has no dispatch, and \`.github/workflows/merge-main.yml\` could not be read for the workflows it dispatches: ${o.unknown}`);
      }
      if (!o.ok) problem(name, o.problem, o.kind);
    } else if (!PASSING.has(r.conclusion ?? "")) problem(name, `${name}: ${r.conclusion}`, "defect");
  }

  // Coverage applies the same substitution: a required workflow whose only
  // `pull_request` runs were held is satisfied by its stand-in, per the rules above.
  const scan: TriggerScan = { ...s.scan, triggers: s.scan.triggers.filter((t) => t.file !== SELF_WORKFLOW_FILE) };
  const cov = coverageFor(all, scan, "pull_request");
  for (const w of cov.required) {
    if (w.ran) continue;
    if (w.state === "blocked") {
      const o = resolveHeld(w.name, latest.get(w.name)?.conclusion ?? "blocked");
      if ("unknown" in o) {
        return R(5, "ci", "unknown", `\`${w.name}\` was held for approval and has no dispatch, and \`.github/workflows/merge-main.yml\` could not be read for the workflows it dispatches: ${o.unknown}`);
      }
      if (!o.ok) problem(w.name, o.problem, o.kind);
      continue;
    }
    problem(w.name, `${w.name}: ${w.state}`, "not-ready");
  }

  const standIns = [...held].filter(([, o]) => "ok" in o && o.ok && o.how === "dispatch").map(([n]) => n).sort();
  const notJudged = [...held].filter(([, o]) => "ok" in o && o.ok && o.how === "not-judged").map(([n]) => n).sort();
  const unused = [...dispatchRuns.values()].filter((r) => r.conclusion === "success" && !standIns.includes(r.name)).length;
  const notes = [
    standIns.length
      ? `${standIns.length} held for approval on this bot-merged head and judged by its green \`workflow_dispatch\` run: ${standIns.join(", ")}`
      : "",
    notJudged.length ? `not judged (preview-only, not dispatched by merge-main): ${notJudged.join(", ")}` : "",
    unused
      ? `${unused} green \`workflow_dispatch\` run(s) on this head are not counted: a dispatch stands in only for a \`pull_request\` run held for approval on a bot-merged head`
      : "",
  ].filter(Boolean);
  const note = notes.length ? ` (${notes.join("; ")})` : "";

  if (prRuns.length === 0) return R(5, "ci", "refuse", `no \`pull_request\` run names the head${note}`);
  if (problems.size) {
    const list = [...problems.values()];
    const kind: RefusalKind = list.some((p) => p.kind === "defect") ? "defect" : "not-ready";
    return R(5, "ci", "refuse", `\`pull_request\` CI on the head is not green: ${list.map((p) => p.text).join("; ")}${note}`, kind);
  }
  const how = standIns.length || notJudged.length ? ", once held runs are resolved" : "";
  return R(5, "ci", "pass", `${latest.size} \`pull_request\` workflow(s) on the head, all success or skipped${how}${note}`);
}

function checkChecklist(s: GuardSnapshot): CheckResult {
  const items = untickedItems(s.pr.body);
  return items.length
    ? R(6, "checklist", "refuse", `${items.length} unticked item(s) in the body: ${items.map((i) => `"${i}"`).join(", ")}`)
    : R(6, "checklist", "pass", "no unticked item");
}

function checkOpenQuestion(s: GuardSnapshot): CheckResult {
  const marker = latestOwnMarker(s);
  const markerComment = marker && s.comments.find((c) => c.created_at === marker.at);
  if (!marker || !markerComment) return R(7, "open-question", "skip", "no ready marker to measure from (check 3)");
  const qs = openQuestions(s.comments, marker.at, s.pr.base.repo?.owner?.login ?? "litlfred");
  return qs.length
    ? R(
        7,
        "open-question",
        "refuse",
        `${qs.length} question(s) to the owner or the Merge Manager after the ready marker: ${qs.map((q) => `"${q.line}"${q.url ? ` (${q.url})` : ""}`).join("; ")}`,
      )
    : R(7, "open-question", "pass", "no question to the owner or the Merge Manager after the ready marker (heuristic)");
}

/** Run the seven checks. Pure: everything it reads is in `s`. */
export function evaluate(s: GuardSnapshot, o: GuardOptions = {}): GuardVerdict {
  const checks = [
    checkBase(s),
    checkReadyForReview(s, o),
    checkReadyMarker(s),
    checkLabels(s),
    checkCi(s),
    checkChecklist(s),
    checkOpenQuestion(s),
  ];
  const unknown = checks.some((c) => c.status === "unknown");
  const refused = checks.some((c) => c.status === "refuse");
  const verdict = unknown ? "unknown" : refused ? "refused" : "pass";
  const defect = checks.some((c) => c.kind === "defect");
  const state: StatusState = unknown ? "error" : defect ? "failure" : refused ? "pending" : "success";
  return { pr: s.pr.number, head: s.pr.head.sha, verdict, state, exitCode: unknown ? 2 : refused ? 1 : 0, checks };
}

// ─── GitHub ────────────────────────────────────────────────────────────────

export class CannotAsk extends Error {}

function token(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

async function gh(url: string, init: RequestInit = {}, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const full = url.startsWith("http") ? url : `https://api.github.com/${url}`;
  const t = token();
  try {
    return await withBackoff(
      async () => {
        const r = await fetchImpl(full, {
          ...init,
          headers: {
            accept: "application/vnd.github+json",
            ...(t ? { authorization: `Bearer ${t}` } : {}),
            ...(init.body ? { "content-type": "application/json" } : {}),
          },
          signal: AbortSignal.timeout(20_000),
        });
        // A PUT/POST is not retried on 5xx: the write may have landed.
        const transient = init.method && init.method !== "GET" ? undefined : classifyResponse(r.status, r.headers);
        return { value: r, transient };
      },
      { onRetry: (n, ms, why) => console.error(`  … attempt ${n} failed (${why}); retrying in ${ms}ms`) },
    );
  } catch (e) {
    throw new CannotAsk(e instanceof Error ? e.message : String(e));
  }
}

async function getJson<T>(url: string, fetchImpl?: typeof fetch): Promise<T> {
  const r = await gh(url, {}, fetchImpl);
  if (!r.ok) throw new CannotAsk(`GET ${url}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

/** Every page of a list endpoint, following `Link: rel="next"`. */
async function getAll<T>(url: string, fetchImpl?: typeof fetch): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined = url;
  for (let page = 0; next && page < 20; page += 1) {
    const r = await gh(next, {}, fetchImpl);
    if (!r.ok) throw new CannotAsk(`GET ${next}: HTTP ${r.status}`);
    out.push(...((await r.json()) as T[]));
    next = r.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
  }
  return out;
}

/** Read everything {@link evaluate} needs. Throws {@link CannotAsk} when a required fact is unreadable. */
export async function fetchSnapshot(repo: string, n: number, root: string): Promise<GuardSnapshot> {
  const pr = await getJson<GhPull>(`repos/${repo}/pulls/${n}`);
  const [comments, timeline, commits] = await Promise.all([
    getAll<GhComment>(`repos/${repo}/issues/${n}/comments?per_page=100`),
    getAll<GhTimelineEvent>(`repos/${repo}/issues/${n}/timeline?per_page=100`),
    getAll<GhCommit>(`repos/${repo}/pulls/${n}/commits?per_page=100`),
  ]);
  const owner = repo.split("/")[0];
  let baseMergedAsHeadOf: GuardSnapshot["baseMergedAsHeadOf"];
  try {
    const closed = await getAll<{ number: number; merged_at: string | null }>(
      `repos/${repo}/pulls?state=closed&head=${encodeURIComponent(`${owner}:${pr.base.ref}`)}&per_page=100`,
    );
    baseMergedAsHeadOf = closed.filter((p) => p.merged_at).map((p) => p.number);
  } catch (e) {
    baseMergedAsHeadOf = { unknown: e instanceof Error ? e.message : String(e) };
  }
  const runs = await runsForHead(repo, pr.head.sha);
  const scan = scanTriggers(root, "pull_request");
  let mergeMainDispatches: GuardSnapshot["mergeMainDispatches"];
  try {
    const parsed = parseMergeMainDispatches(readFileSync(join(root, MERGE_MAIN_WORKFLOW), "utf8"));
    mergeMainDispatches = parsed ?? { unknown: `no \`for wf in … ; do gh workflow run\` line in ${MERGE_MAIN_WORKFLOW}` };
  } catch (e) {
    mergeMainDispatches = { unknown: e instanceof Error ? e.message : String(e) };
  }
  return { pr, comments, timeline, commits, baseMergedAsHeadOf, runs, scan, mergeMainDispatches };
}

export type MergeOutcome = { merged: true; sha: string } | { merged: false; refused: boolean; reason: string };

/** The PUT, pinned to the head that was evaluated: GitHub refuses it if the head moved. */
export async function mergePinned(repo: string, n: number, sha: string): Promise<MergeOutcome> {
  let r: Response;
  try {
    r = await gh(`repos/${repo}/pulls/${n}/merge`, { method: "PUT", body: JSON.stringify({ sha, merge_method: "merge" }) });
  } catch (e) {
    return { merged: false, refused: false, reason: e instanceof Error ? e.message : String(e) };
  }
  const body = (await r.json().catch(() => ({}))) as { merged?: boolean; sha?: string; message?: string };
  if (r.ok && body.merged) return { merged: true, sha: body.sha ?? "" };
  const refused = r.status === 405 || r.status === 409 || r.status === 422;
  return { merged: false, refused, reason: `HTTP ${r.status}: ${body.message ?? "no message"}` };
}

/** Post the verdict as the `merge-guard` commit status on the head. */
export async function postStatus(repo: string, v: GuardVerdict): Promise<void> {
  const state = v.state;
  const failed = v.checks.filter((c) => c.status === "refuse" || c.status === "unknown");
  const label = v.state === "pending" ? "not ready" : v.verdict;
  const description = (
    v.verdict === "pass" ? "all seven checks pass" : `${label}: ${failed.map((c) => `${c.n} ${c.id}`).join(", ")}`
  ).slice(0, 140);
  const runUrl = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : undefined;
  const r = await gh(`repos/${repo}/statuses/${v.head}`, {
    method: "POST",
    body: JSON.stringify({ state, context: STATUS_CONTEXT, description, ...(runUrl ? { target_url: runUrl } : {}) }),
  });
  if (!r.ok) throw new CannotAsk(`POST status: HTTP ${r.status}`);
}

// ─── CLI ───────────────────────────────────────────────────────────────────

const MARK: Record<CheckStatus, string> = { pass: "✓", refuse: "✗", unknown: "?", skip: "–" };

export function render(v: GuardVerdict): string {
  const lines = [`merge-guard #${v.pr} @ ${short(v.head)}: ${v.verdict.toUpperCase()} (status: ${v.state})`];
  for (const c of v.checks) lines.push(`  ${MARK[c.status]} ${c.n} ${c.id.padEnd(16)} ${c.kind ? `[${c.kind}] ` : ""}${c.detail}`);
  return lines.join("\n");
}

const USAGE = "usage: bun run merge:guard <pr> [--merge --session <id>] [--actor <login>] [--repo owner/repo] [--status] [--json]";

async function main(argv: string[]): Promise<number> {
  const args = [...argv];
  const flag = (f: string) => {
    const i = args.indexOf(f);
    if (i < 0) return false;
    args.splice(i, 1);
    return true;
  };
  const opt = (f: string) => {
    const i = args.indexOf(f);
    if (i < 0) return undefined;
    const v = args[i + 1];
    args.splice(i, 2);
    return v;
  };
  const doMerge = flag("--merge");
  const asJson = flag("--json");
  const doStatus = flag("--status");
  const sessionArg = opt("--session");
  const actor = opt("--actor");
  const root = repoRootFor(resolve(import.meta.dir, ".."));
  const repo = opt("--repo") ?? process.env.GITHUB_REPOSITORY ?? ownerRepo(detectRepoUrl(root) ?? "");
  const n = Number(args[0]);
  if (!Number.isInteger(n) || n <= 0 || !repo) {
    console.error(USAGE);
    return 2;
  }
  const mergingSession = sessionArg ? normaliseSession(sessionArg) : undefined;
  if (doMerge && !mergingSession) {
    console.error("--merge needs --session <the merging session's id>: check 2 asks whether that session marked the PR ready.\n" + USAGE);
    return 2;
  }

  let snapshot: GuardSnapshot;
  try {
    snapshot = await fetchSnapshot(repo, n, root);
  } catch (e) {
    console.error(`merge-guard #${n}: COULD NOT DETERMINE — ${e instanceof Error ? e.message : String(e)}`);
    return 2;
  }
  const v = evaluate(snapshot, { mergingSession, mergingActor: actor });
  console.log(asJson ? JSON.stringify(v, null, 2) : render(v));
  if (doStatus) {
    try {
      await postStatus(repo, v);
    } catch (e) {
      console.error(`could not post the ${STATUS_CONTEXT} status: ${e instanceof Error ? e.message : String(e)}`);
      return 2;
    }
  }
  if (!doMerge || v.exitCode !== 0) return v.exitCode;

  const out = await mergePinned(repo, n, v.head);
  if (out.merged) {
    console.log(`merged #${n} at ${short(v.head)} -> ${short(out.sha)}`);
    return 0;
  }
  console.error(`merge of #${n} ${out.refused ? "REFUSED by GitHub" : "COULD NOT BE DETERMINED"}: ${out.reason}`);
  return out.refused ? 1 : 2;
}

if (import.meta.main) {
  process.exit(await main(process.argv.slice(2)));
}
