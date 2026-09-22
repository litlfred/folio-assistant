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
 * | has a run | at least one workflow run names this exact `head_sha` | 0 |
 * | **no run** | GitHub answered, and nothing names it | 1 |
 * | could not ask | no remote, no network, rate limited, HTTP error | 2 |
 *
 * **Could-not-ask is never reported as "has a run"**, and never as "no run"
 * either: telling somebody their commit is unverified when you simply could
 * not look would train them to ignore it, which costs more than the gap.
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
    "  Check `mergeable_state` by hand before dispatching anything: on a\n" +
    "  conflicted PR a dispatch tests a tree that will never exist."
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
  console.log(`✓ ${sha.slice(0, 10)} — ${verdict.runs.length} run(s):`);
  for (const r of verdict.runs) {
    console.log(`    ${r.name.padEnd(32)} ${r.event.padEnd(16)} ${r.conclusion ?? r.status}`);
  }
  process.exit(0);
}
