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
): Promise<HeadRunVerdict> {
  if (!slug) return { state: "cannot-ask", reason: "no GitHub `origin` remote to ask about" };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const url =
    `https://api.github.com/repos/${slug}/actions/runs` +
    `?head_sha=${encodeURIComponent(sha)}&per_page=100`;
  let res: Response;
  try {
    res = await fetchImpl(url, {
      headers: {
        accept: "application/vnd.github+json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
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
    console.error(
      "\n  It IS pushed, so this is bean `3pqn`: the event was dropped.\n" +
        "\n  A pull request carrying zero checks looks exactly like one whose checks\n" +
        "  have not started. Merging on \"nothing red\" here merges UNVERIFIED.\n" +
        "\n  Re-pushing may not fix it — on 2026-09-20 two consecutive pushes were\n" +
        "  both dropped, the second 26s after the first. Dispatch the workflow\n" +
        "  against this ref instead, and read that run.",
    );
    process.exit(1);
  }
  console.log(`✓ ${sha.slice(0, 10)} — ${verdict.runs.length} run(s):`);
  for (const r of verdict.runs) {
    console.log(`    ${r.name.padEnd(32)} ${r.event.padEnd(16)} ${r.conclusion ?? r.status}`);
  }
  process.exit(0);
}
