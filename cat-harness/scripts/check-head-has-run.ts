#!/usr/bin/env bun
/**
 * Does this commit have a CI run at all?
 *
 * @module scripts/check-head-has-run
 *
 * Bean `3pqn`. **A pull request carrying ZERO checks renders identically to
 * one whose checks have not started yet** — both are an absence of status. An
 * agent or a person who merges on "nothing red" merges unverified, and the
 * repository has no way to tell them apart from a checkout.
 *
 * That is the `xom7` shape one layer up: a workflow failing invisibly, where
 * the remedy was to make the state legible rather than to trust somebody would
 * notice.
 *
 * ## Measured, twice, in two different shapes
 *
 * The bean recorded two cases on 2026-09-19 (`#340` head `e0e3b4b8`, `#349`
 * head `059cf9e1`): force-push, then open the PR seconds later, and no
 * `pull_request` run ever fired. Waiting ~45s made it go away, so it read as a
 * race between the ref update and `pull_request.opened`.
 *
 * **That framing is too narrow, and this repository produced the
 * counter-example on 2026-09-20.** On `#518`, already open, with no
 * force-push and no PR being opened:
 *
 * | commit | pushed | `pull_request` run |
 * |---|---|---|
 * | `f93582e52b` | 13:16:18 | yes |
 * | `cbfd048a1d` | 13:23:46 — **448s later** | **none, ever** |
 * | `f9cb1ee08f` | 13:24:12 — 26s after that | **none, ever** |
 *
 * Re-queried hours afterwards across all forty `pull_request` runs on the
 * branch: neither appeared. So a `synchronize` can be dropped too, seven and a
 * half minutes after the previous push — no race to lose — and **the later of
 * two rapid pushes is not a safe assumption either**, because it was dropped
 * as well. The checks had to be produced by hand with `workflow_dispatch`.
 *
 * ## What this can and cannot do
 *
 * It cannot make GitHub deliver an event. It can say **"this commit has no
 * run"**, which is the fact nobody could see. Three states, and the third is
 * why the script exists at all:
 *
 * | state | means | exit |
 * |---|---|---|
 * | has the owed runs | every workflow OWED for the event ran | 0 |
 * | **missing a required run** | it has runs, but not the ones owed | 1 |
 * | **no run** | GitHub answered, and nothing names it | 1 |
 * | could not ask | no remote, no network, rate limited, HTTP error | 2 |
 *
 * **Could-not-ask is never reported as "has a run"**, and never as "no run"
 * either: telling somebody their commit is unverified when you simply could
 * not look would train them to ignore it, which costs more than the gap.
 *
 * ## "Has a run" was the wrong question — bean `9x9r`
 *
 * Until 2026-09-24 the first row read *"at least one workflow run names this
 * exact `head_sha`"*, and the script decided on `runs.length > 0`. Any run.
 * Any workflow, any event. The header was honest about what it measured; the
 * QUESTION was wrong, because the operator running this is asking whether
 * **their PR's gates** fired.
 *
 * Two live cases, both measured that day:
 *
 * | head | its runs | old verdict |
 * |---|---|---|
 * | PR #1309 | `JSON-LD drift` twice — one `push`, one `pull_request` | ✓ |
 * | PR #1222 `28f929a` | `Code-quality gates` via **`workflow_dispatch`** only | ✓ |
 *
 * The second is the worse one and it indicts the fix as much as the defect: a
 * dispatch resolves `refs/heads/<branch>` rather than the merge ref, so that
 * green was about a different tree (`yv4z`, `sddf`) — and this script endorsed
 * it. `3pqn` reported as clean, by the file written to detect `3pqn`.
 *
 * The owner ruled the stronger of two fixes on 2026-09-24: **derive the owed
 * workflows from `.github/workflows/`** rather than match per-event, so a gate
 * workflow that is renamed or deleted is caught too. The required set is read
 * by {@link scanTriggers}; the reasoning, and why a path-filtered workflow is
 * `conditional` rather than required, is in `src/core/workflow-events.ts`.
 *
 * ## "No run" is not one situation — bean `sddf`
 *
 * Exit 1 is the same either way, because the operator's immediate position is
 * the same: **nothing verified this head**. But WHY differs, and one of the
 * reasons used to get advice that made things worse. So the no-run branch now
 * asks {@link mergeStateForHead} and says which of these it is:
 *
 * | why | what it means | what to do |
 * |---|---|---|
 * | **conflicted** | the forge publishes no `refs/pull/N/merge`, and a `pull_request` run checks that ref out | merge the base in. **Never dispatch** |
 * | mergeable | a run is owed and its absence is unexplained — this is `3pqn` | dispatching is safe here |
 * | not a PR head | no open PR has this sha, so nothing was owed | open the PR, or ask about the right head |
 * | unknown | the probe itself failed | check by hand; assume nothing |
 *
 * **The conflicted row is why this was a defect and not a wording nit.** The
 * old message said *"this is bean `3pqn`: the event was dropped"* and told the
 * reader to dispatch. A dispatch resolves `refs/heads/<branch>`, not the merge
 * ref — so on a conflicted PR it is a green signal for a tree that will never
 * exist, which is worse than the absence it replaces. `yv4z` established that
 * and `prepare-merge` §Guardrails gained a step 0 for it; this script, the one
 * an operator actually runs at that moment, did not get the memo.
 *
 * It also stated a cause as fact two sentences before admitting the evidence
 * could not distinguish it — the `xom7` shape, inside the file written to
 * prevent it, and the second time this file has done that (see the hazard
 * section below).
 *
 * A run for a DIFFERENT commit is not a run for this one, and that distinction
 * is the whole check: in both of the bean's cases the branch *did* have a
 * recent run — for the commit the previous PR had merged.
 *
 * ## A push does not buy you a run, and `mergeable_state` does not buy you an answer
 *
 * Two things measured 2026-09-25 (bean `fx5r`), both of which change what an
 * operator standing at a runless head should DO.
 *
 * **Pushing to a PR's head branch does not re-run its `pull_request`
 * workflows.** A merge commit was pushed to an open PR's branch and only the
 * `push`-triggered workflow fired:
 *
 * ```
 * 17:04  success  JSON-LD generated-file drift   57fd738d8  (event=push)
 * 04:54  success  Code-quality gates             5a02ac4b5  (event=pull_request)
 * ```
 *
 * The head then carried ONE green check and not the one that mattered — this
 * script's own subject, `3pqn`, arrived at from the other side: not zero
 * checks, but the wrong subset, which reads as green at a glance. So
 * "push something to trigger CI" is not a remedy; `workflow_dispatch` against
 * the branch is, and the table above is right that it is safe only while the
 * PR is mergeable.
 *
 * **`mergeable_state` is not the way to check by hand.** It, `head.sha` and
 * `updated_at` all kept serving a PR's pre-merge view 45 minutes after that PR
 * merged; only `merged` went stale-safe. Worse, `update-branch` answered
 * *"merge conflict between base and head"* for a CLOSED PR, while
 * `git merge-tree` and a real `git merge --no-commit` both reported zero
 * unmerged paths — a wrong cause stated with the authority of a measurement.
 *
 * This module already had the right instinct: {@link mergeStateForHead} asks
 * `git ls-remote origin refs/pull/N/merge` rather than the field. The advice it
 * PRINTED in the `unknown` case did not, and pointed at `mergeable_state`
 * twice. That is fixed; the rule is the one `h2s9` arrived at independently —
 * **when a forge API and git disagree about git, git is the subject and the
 * API is a cache.**
 *
 * ## The hazard this script could itself have become
 *
 * A commit id GitHub has never heard of returns an empty run list, which is
 * indistinguishable from a real commit whose event was dropped. The first
 * draft reported `deadbeef…` as "has NO workflow run of any kind" — a
 * confident wrong answer, which is the exact failure this file exists to
 * prevent, reproduced inside it.
 *
 * So the id is resolved against the local repository FIRST: unknown here is
 * `cannot-ask`, not a finding. And a commit that exists locally but sits on no
 * remote ref genuinely has no run and always will, so it is reported with THAT
 * as the reason rather than implying GitHub lost something.
 *
 * Usage:  bun run check:head-has-run [<sha>]
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import { classifyResponse, withBackoff, type BackoffOptions } from "../src/core/retry.js";
import { scanTriggers, type TriggerScan, type WorkflowTrigger } from "../src/core/workflow-events.js";
import { detectRepoUrl, ownerRepo } from "../src/core/git-refs.js";
import { repoRootFor } from "../schemas/cat-harness.js";

const REPO = repoRootFor(resolve(import.meta.dir, ".."));

export interface RunRow {
  name: string;
  event: string;
  status: string;
  conclusion: string | null;
  html_url: string;
}

export type HeadRunVerdict =
  | { state: "has-run"; runs: RunRow[] }
  | { state: "no-run" }
  | { state: "cannot-ask"; reason: string };

/**
 * Every workflow run naming `sha` as its head.
 *
 * `head_sha` is asked of the API directly rather than filtering a branch
 * listing. A branch listing answers "what ran on this branch recently", which
 * is the question that MISLED in both of the bean's cases — the newest run was
 * for the predecessor commit, so the branch looked busy while the head had
 * nothing.
 */
export async function runsForHead(
  slug: string | undefined,
  sha: string,
  fetchImpl: typeof fetch = fetch,
  /**
   * Backoff options, so a test can inject a fast clock.
   *
   * Passed in rather than hardcoded because a retry loop with real sleeps is
   * untestable in any suite with a sane timeout — the first draft of this made
   * `a thrown fetch is cannot-ask` take 15 seconds and fail at 5.
   */
  backoff: BackoffOptions = {},
): Promise<HeadRunVerdict> {
  if (!slug) return { state: "cannot-ask", reason: "no GitHub `origin` remote to ask about" };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const url =
    `https://api.github.com/repos/${slug}/actions/runs` +
    `?head_sha=${encodeURIComponent(sha)}&per_page=100`;
  // Owner's rule, 2026-09-20: a falling-off retry rate on every error. A
  // dropped socket or a 5xx says nothing about the question — but a 404 or a
  // permission 403 IS the answer, and `classifyResponse` keeps those final so
  // four waits are not spent re-reaching a conclusion already in hand.
  let res: Response;
  try {
    res = await withBackoff(
      async () => {
        const r = await fetchImpl(url, {
          headers: {
            accept: "application/vnd.github+json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          signal: AbortSignal.timeout(20_000),
        });
        return { value: r, transient: classifyResponse(r.status, r.headers) };
      },
      {
        onRetry: (n, ms, why) => console.error(`  … attempt ${n} failed (${why}); retrying in ${ms}ms`),
        ...backoff,
      },
    );
  } catch (e) {
    // Retries exhausted. The verdict is the SAME third state it would have
    // been without them — backoff makes could-not-determine rarer, it never
    // converts it into an answer.
    return { state: "cannot-ask", reason: e instanceof Error ? e.message : String(e) };
  }
  if (!res.ok) {
    // 404 on a private repo without a token reads as "no run" if you squint,
    // and it is not: it is not being allowed to look.
    const hint =
      res.status === 404
        ? " — a private repo needs GITHUB_TOKEN or GH_TOKEN"
        : res.status === 403
          ? " — rate limited; set GITHUB_TOKEN to raise the limit"
          : "";
    return { state: "cannot-ask", reason: `HTTP ${res.status}${hint}` };
  }
  const body = (await res.json()) as { workflow_runs?: RunRow[] };
  const runs = body.workflow_runs ?? [];
  return runs.length > 0 ? { state: "has-run", runs } : { state: "no-run" };
}

/** Resolve a commit-ish to a full sha here, or `undefined` if git does not know it. */
export function resolveCommit(repo: string, rev: string): string | undefined {
  try {
    return execFileSync("git", ["-C", repo, "rev-parse", "--verify", `${rev}^{commit}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Why a pushed commit might legitimately have no `pull_request` run.
 *
 * `not-a-pr-head` — no open PR has this sha as its head, so no `pull_request`
 * event was ever owed. `conflicted` — a PR has it, and the forge is publishing
 * no merge ref for that PR. `mergeable` — the merge ref is there, so a run is
 * owed and its absence is unexplained. `unknown` — the probe itself failed.
 */
export type MergeState = "not-a-pr-head" | "conflicted" | "mergeable" | "unknown";

/**
 * Which open PR has `sha` as its head, asked of the forge with plain git.
 *
 * `refs/pull/*` is served to anyone who can clone, so this needs **no token** —
 * which is the point. The runs query above needs `GITHUB_TOKEN` and degrades to
 * `cannot-ask` without one, and that is precisely the situation in which an
 * operator is left staring at an absence. This probe still answers there.
 */
export type GitRunner = (args: string[]) => string;

/** The real one. Injected in tests, for the reason `runsForHead` gives for `fetchImpl`. */
export const gitRunner =
  (repo: string): GitRunner =>
  (args) =>
    execFileSync("git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

export function prNumberForHead(
  repo: string,
  sha: string,
  git: GitRunner = gitRunner(repo),
): number | undefined {
  try {
    const out = git(["ls-remote", "origin", "refs/pull/*/head"]);
    for (const line of out.split("\n")) {
      const [got, ref] = line.split(/\s+/);
      if (got === sha) {
        const n = /refs\/pull\/(\d+)\/head/.exec(ref ?? "");
        if (n) return Number(n[1]);
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Is a `pull_request` run OWED for this head, or is the PR unmergeable?
 *
 * **The merge ref is the discriminator; the clock is not.** Measured on PR
 * #813, 2026-09-21, one PR with mergeability the only variable:
 *
 * | | conflicted | resolved |
 * |---|---|---|
 * | `refs/pull/N/merge` | absent for 433 s | present within 15 s |
 * | `pull_request` runs | zero for 8+ minutes | five, 7 s after the push |
 *
 * Three simultaneous controls make the absence a measurement rather than a
 * wait: a normal latency measured at 2 m 43 s on a sibling PR from the same
 * base, twelve open mergeable PRs holding merge refs at that instant, and two
 * PRs CREATED DURING the polling window receiving theirs. The forge was
 * minting merge refs throughout the seven minutes it declined to mint this one.
 *
 * Bean `yv4z` proposes a `--wait` flag for this script. That is the wrong
 * instrument: `pull_request` latency varied more than twenty-fold in one hour
 * under normal operation (7 s against 2 m 43 s), which is why that bean's flat
 * timing series across six observations predicted nothing. A clock cannot
 * separate "will never run" from "has not run yet". This can.
 */
export function mergeStateForHead(
  repo: string,
  sha: string,
  git: GitRunner = gitRunner(repo),
): MergeState {
  const n = prNumberForHead(repo, sha, git);
  if (n === undefined) return "not-a-pr-head";
  try {
    const out = git(["ls-remote", "origin", `refs/pull/${n}/merge`]);
    return out.trim() === "" ? "conflicted" : "mergeable";
  } catch {
    // The head lookup succeeded and this one did not, so the difference is the
    // probe rather than the PR. Never `conflicted` on a failed read — that is
    // the confident wrong answer this file exists to prevent.
    return "unknown";
  }
}

/** Is this commit on any remote-tracking ref — i.e. has it been pushed? */
export function isPushed(repo: string, sha: string): boolean {
  try {
    return (
      execFileSync("git", ["-C", repo, "branch", "-r", "--contains", sha], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() !== ""
    );
  } catch {
    return false;
  }
}

/**
 * What to tell somebody whose pushed head has no run — as a STRING, so the
 * branch that used to give dangerous advice can be executed by a test.
 *
 * Extracted for the reason `reconcile()` was in `check-bean-front-matter`: a
 * message only reachable by running the whole script against a live forge in a
 * state you cannot conjure is a message nothing checks. The conflicted variant
 * is the one that matters and the one that was wrong, and no test could reach
 * it while it lived inline.
 */
export function noRunAdvice(merge: MergeState): string {
  if (merge === "conflicted") {
    // The one case with a KNOWN answer, and the one where the old advice was
    // actively harmful. Measured on PR #813: a conflicted PR gets no merge ref
    // and no `pull_request` run, and both return within seconds of resolution.
    return (
      "\n  Its pull request is UNMERGEABLE — the forge is publishing no\n" +
      "  `refs/pull/N/merge` for it. A `pull_request` run checks that ref out,\n" +
      "  so this head will NEVER get one until the conflict is resolved. This is\n" +
      "  not a dropped event, and waiting will not help.\n" +
      "\n  MERGE THE BASE BRANCH IN and push. Do NOT dispatch the workflow: a\n" +
      "  dispatch resolves `refs/heads/<branch>`, so it would test the branch\n" +
      "  rather than the merge result — a green signal for a tree that will never\n" +
      "  exist, which is worse than the absence it replaces.\n" +
      "  Beans `yv4z`, `sddf`; `prepare-merge` §Guardrails step 0."
    );
  }
  const head =
    "\n  Merging on \"nothing red\" here merges UNVERIFIED.\n" +
    "\n  WHY it has no run is NOT established. A pull request carrying zero\n" +
    "  checks looks exactly like one whose checks have not started, and this\n" +
    "  script cannot tell those apart — so it does not pick one.";
  if (merge === "mergeable") {
    return (
      head +
      "\n\n  What IS established: its PR is mergeable, so a `pull_request` run is\n" +
      "  owed and its absence is unexplained (bean `3pqn`). Latency is no guide —\n" +
      "  measured 7s and 2m43s within one hour on this repository, so elapsed\n" +
      "  time separates nothing. Re-pushing may not fix it either: on 2026-09-20\n" +
      "  two consecutive pushes were both dropped, 26s apart. Dispatching against\n" +
      "  this ref is safe HERE, because while the PR is mergeable the branch and\n" +
      "  the merge result agree."
    );
  }
  if (merge === "not-a-pr-head") {
    return (
      head +
      "\n\n  No open pull request has this sha as its head, so no `pull_request`\n" +
      "  event was ever owed for it. If you expected one, open the PR — or ask\n" +
      "  again about the head that IS the PR's."
    );
  }
  return (
    head +
    "\n\n  The mergeability probe itself failed, so even THAT is unknown here.\n" +
    "  Check by hand before dispatching anything — and ask GIT, not\n" +
    "  `mergeable_state`. Bean `fx5r`: that field kept serving a merged PR's\n" +
    "  pre-merge value 45 minutes after the merge, and `update-branch` called\n" +
    "  a CLOSED PR a conflict. Only `merged` goes stale-safe:\n" +
    "      gh pr view N --json merged          # merged? then nothing is owed\n" +
    "      git ls-remote origin refs/pull/N/merge   # the probe above, retried\n" +
    "  On a conflicted PR a dispatch tests a tree that will never exist."
  );
}

/**
 * Did the workflows that were OWED for this event actually run?
 *
 * Bean `9x9r`. {@link runsForHead} answers "is there a run", which is a
 * strictly weaker question than "did the gates fire" — and the gap is not
 * hypothetical here: `jsonld-gen-check` and `atomic-mass-gen-check` declare
 * both `push` and `pull_request`, so a push run satisfies the weaker question
 * on a commit whose `pull_request` event was dropped. PR #1309's head carried
 * two runs of `.jsonld siblings in sync with .ts manifests`, one per event.
 *
 * The required set is READ FROM `.github/workflows/`, never listed here, for
 * the reason `gates.ts` derives its list from `code-quality-gates.yml`: a list
 * maintained by hand is a list free to drift from what CI runs, and a gate
 * workflow that is renamed or deleted is exactly what option 2 of this bean
 * could not have caught.
 */
export interface WorkflowCoverage {
  /** Owed unconditionally. A `false` here is the finding. */
  required: { name: string; file: string; ran: boolean }[];
  /**
   * Declared behind `paths`/`types`/`branches`. **Not judged** — whether a run
   * was owed depends on the diff or the ref, and a sha carries neither. Printed
   * rather than dropped, because a silent omission reads as a pass.
   */
  conditional: { name: string; file: string; ran: boolean; filters: string[] }[];
  /** Workflow files that could not be read; while any exist, `required` is incomplete. */
  unreadable: TriggerScan["unreadable"];
}

/** Match on BOTH name and event: a `push` run of a workflow is not its `pull_request` run. */
function ranAs(runs: RunRow[], t: WorkflowTrigger, event: string): boolean {
  return runs.some((r) => r.name === t.name && r.event === event);
}

export function coverageFor(runs: RunRow[], scan: TriggerScan, event: string): WorkflowCoverage {
  return {
    required: scan.triggers
      .filter((t) => t.requirement === "required")
      .map((t) => ({ name: t.name, file: t.file, ran: ranAs(runs, t, event) })),
    conditional: scan.triggers
      .filter((t) => t.requirement === "conditional")
      .map((t) => ({ name: t.name, file: t.file, ran: ranAs(runs, t, event), filters: t.filters })),
    unreadable: scan.unreadable,
  };
}

/**
 * What to tell somebody whose head has runs but is MISSING a required one.
 *
 * A separate message from {@link noRunAdvice} on purpose: "nothing ran" and
 * "the gates did not run but other things did" put the operator in different
 * positions, and the second is the more dangerous of the two precisely because
 * it renders as activity.
 */
export function missingRequiredAdvice(missing: string[], merge: MergeState): string {
  const head =
    `\n  Its head has runs, but ${missing.length} workflow(s) owed for this event\n` +
    `  did NOT run: ${missing.join(", ")}.\n` +
    "\n  A run from a DIFFERENT workflow is not evidence about this one. Reading\n" +
    "  \"some checks exist\" as \"the gates passed\" is what bean `9x9r` measured:\n" +
    "  this script itself reported a ✓ in exactly this state.";
  if (merge === "conflicted") {
    return (
      head +
      "\n\n  Its pull request is UNMERGEABLE, so no `refs/pull/N/merge` exists and\n" +
      "  this head will never get a `pull_request` run until that is resolved.\n" +
      "  MERGE THE BASE BRANCH IN and push. Do NOT dispatch — a dispatch resolves\n" +
      "  `refs/heads/<branch>`, testing a tree that will never exist.\n" +
      "  Beans `yv4z`, `sddf`; `prepare-merge` §Guardrails step 0."
    );
  }
  if (merge === "mergeable") {
    return (
      head +
      "\n\n  Its PR is mergeable, so those runs were owed and their absence is\n" +
      "  unexplained (bean `3pqn`). Dispatching against this ref is safe HERE,\n" +
      "  because while the PR is mergeable the branch and the merge result agree."
    );
  }
  return (
    head +
    "\n\n  Mergeability is not established, so check by hand before dispatching\n" +
    "  anything — and ask GIT, not `mergeable_state`. Bean `fx5r` measured it\n" +
    "  still serving a merged PR's pre-merge value 45 minutes after the merge;\n" +
    "  only `merged` goes stale-safe:\n" +
    "      gh pr view N --json merged          # merged? then nothing is owed\n" +
    "      git ls-remote origin refs/pull/N/merge   # the probe above, retried\n" +
    "  On a conflicted PR a dispatch tests a tree that will never exist."
  );
}

if (import.meta.main) {
  const asked = process.argv[2] ?? "HEAD";
  const sha = resolveCommit(REPO, asked);
  if (sha === undefined) {
    // NOT a finding. An id git cannot resolve is one nothing can be
    // established about, and reporting it as "no run" is the confident wrong
    // answer this whole file is against.
    console.error(`? ${asked} — COULD NOT ASK: this repository has no such commit.`);
    process.exit(2);
  }
  const verdict = await runsForHead(ownerRepo(detectRepoUrl(REPO) ?? ""), sha);

  if (verdict.state === "cannot-ask") {
    console.error(`? ${sha.slice(0, 10)} — COULD NOT ASK: ${verdict.reason}.`);
    console.error(
      "  That is not the same as having no run, and it must not be read as either\n" +
        "  answer. Nothing has been established about this commit.",
    );
    process.exit(2);
  }
  if (verdict.state === "no-run") {
    console.error(`✗ ${sha.slice(0, 10)} has NO workflow run of any kind.`);
    if (!isPushed(REPO, sha)) {
      // The ordinary explanation, and it is not bean `3pqn`. Saying "GitHub
      // dropped your event" to somebody who has not pushed teaches them to
      // ignore the message.
      console.error(
        "\n  It is on no remote-tracking ref, so nothing has had the chance to run it.\n" +
          "  Push it, then ask again.",
      );
      process.exit(1);
    }
    // WHY is it not run? Asked rather than asserted, and the answer is a
    // pure function so a test can execute every branch — including the one
    // that used to say "the event was dropped" and tell you to dispatch.
    console.error(noRunAdvice(mergeStateForHead(REPO, sha)));
    process.exit(1);
  }
  console.log(`  ${sha.slice(0, 10)} — ${verdict.runs.length} run(s):`);
  for (const r of verdict.runs) {
    console.log(`    ${r.name.padEnd(36)} ${r.event.padEnd(16)} ${r.conclusion ?? r.status}`);
  }

  // Bean `9x9r`. Having runs is not having the RIGHT runs, and the old script
  // stopped here with a ✓. The event is only known when the sha is a PR head,
  // so that is the only case judged — which is also the only case `3pqn` is
  // about.
  const merge = mergeStateForHead(REPO, sha);
  if (merge === "not-a-pr-head") {
    console.log(
      "\n? No open pull request has this sha as its head, so no event is owed for it\n" +
        "  and WHICH workflows should have run cannot be determined. The runs above\n" +
        "  are reported; nothing about them has been judged.",
    );
    process.exit(0);
  }

  const event = "pull_request";
  const cov = coverageFor(verdict.runs, scanTriggers(REPO, event), event);

  if (cov.unreadable.length > 0) {
    console.error(`\n? ${cov.unreadable.length} workflow file(s) could not be read:`);
    for (const u of cov.unreadable) console.error(`    ${u.file}: ${u.problem}`);
    console.error(
      "  The required set is therefore INCOMPLETE, so this run cannot say the owed\n" +
        "  workflows ran. Could-not-ask is not a pass.",
    );
    process.exit(2);
  }
  if (cov.required.length === 0) {
    console.error(
      `\n? No workflow declares \`${event}\` without filters, so nothing is owed\n` +
        "  unconditionally and there was nothing to require. That is a finding about\n" +
        "  the workflows rather than about this commit — and it is NOT a pass.",
    );
    process.exit(2);
  }

  console.log(`\n  owed for \`${event}\`, read from .github/workflows/:`);
  for (const w of cov.required) console.log(`    ${w.ran ? "✓" : "✗"} ${w.name.padEnd(36)} required`);
  for (const w of cov.conditional) {
    console.log(
      `    ${w.ran ? "✓" : "?"} ${w.name.padEnd(36)} conditional (${w.filters.join(", ")}) — not judged`,
    );
  }
  if (cov.conditional.length > 0) {
    console.log(
      "\n  A conditional workflow that did not run is NOT a finding: its filters\n" +
        "  depend on the diff or the ref, and a commit id carries neither. It is not\n" +
        "  a pass either, which is why it is printed rather than dropped.",
    );
  }

  const missing = cov.required.filter((w) => !w.ran).map((w) => w.name);
  if (missing.length > 0) {
    console.error(`\n✗ ${sha.slice(0, 10)} is MISSING a required workflow run.`);
    console.error(missingRequiredAdvice(missing, merge));
    process.exit(1);
  }

  console.log(`\n✓ ${sha.slice(0, 10)} — all ${cov.required.length} workflow(s) owed for \`${event}\` ran.`);
  process.exit(0);
}
