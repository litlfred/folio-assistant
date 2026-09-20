#!/usr/bin/env bun
/**
 * Which open pull requests have NO CI run on their head?
 *
 * @module scripts/check-prs-have-runs
 *
 * Bean `3pqn`. `check:head-has-run` answers this for one commit, and the
 * remaining gap was stated when it shipped: **a pull request with zero checks
 * is invisible precisely because nobody is looking**, so a check that runs
 * only when somebody remembers to look is the weakest possible placement.
 * This is the unattended half.
 *
 * ## It is not hypothetical
 *
 * Measured 2026-09-20 over the six open pull requests on this repository:
 * **two had no run of any kind on their head** — `#525`, updated three
 * minutes earlier, and `#477`, updated one minute earlier. A third of the
 * open set, sitting with nothing to merge on.
 *
 * ## The age gate is the whole difference between useful and ignored
 *
 * A head pushed thirty seconds ago legitimately has no run yet, and a sweep
 * that reports those is a sweep nobody reads — which is the failure this bean
 * is about, reproduced by its own fix. So a head is only a finding once it is
 * **older than `--min-age-minutes` (default 15)**, and a younger one is
 * reported as **too new to judge** rather than as clean. That is the third
 * state, not a rounding-down.
 *
 * **The age is the HEAD COMMIT's committer date, which is a proxy for push
 * time**, and the limitation is stated rather than hidden: a commit authored
 * long ago and pushed just now reads as old and can be flagged early. GitHub
 * exposes no per-ref push time on the pull request, and in practice a commit
 * and its push are seconds apart here. A false finding of this shape says
 * "no run", which a reader disproves in one click — the opposite error,
 * staying silent, is the one that costs.
 *
 * ## Three states, and `unknown` outranks a finding
 *
 * | verdict | means | exit |
 * |---|---|---|
 * | `clean` | every eligible head has a run | 0 |
 * | `findings` | at least one eligible head has none | 1 |
 * | `unknown` | the list or a run query could not be read | 2 |
 *
 * A sweep blind on one pull request has not cleared the others, so a single
 * unreadable answer makes the whole run `unknown` — never a partial clean.
 * Same rule as `ci-health` and the repository health sweep.
 *
 * Usage:  bun run check:prs-have-runs [--min-age-minutes N] [--out <file>]
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { runsForHead } from "./check-head-has-run.js";
import { classifyResponse, withBackoff } from "../src/core/retry.js";
import { detectRepoUrl, ownerRepo } from "../src/core/git-refs.js";
import { repoRootFor } from "../schemas/cat-harness.js";

const REPO = repoRootFor(resolve(import.meta.dir, ".."));

export interface PrRow {
  number: number;
  title: string;
  sha: string;
  /** Head commit's committer date — the proxy for push time. */
  headAt?: string;
  state: "has-run" | "no-run" | "too-new" | "unknown";
  detail?: string;
}

export type Verdict = "clean" | "findings" | "unknown";

/** The verdict a set of rows implies. `unknown` outranks a finding. */
export function verdictFor(rows: PrRow[]): Verdict {
  if (rows.some((r) => r.state === "unknown")) return "unknown";
  return rows.some((r) => r.state === "no-run") ? "findings" : "clean";
}

/**
 * Is this head old enough for "no run" to mean something?
 *
 * Returns `undefined` when the date could not be read — which is `unknown`,
 * not "old enough". Assuming eligibility from a missing timestamp would
 * manufacture findings out of a gap.
 */
export function isEligible(headAt: string | undefined, minAgeMinutes: number, now = Date.now()): boolean | undefined {
  if (!headAt) return undefined;
  const t = Date.parse(headAt);
  if (Number.isNaN(t)) return undefined;
  return now - t >= minAgeMinutes * 60_000;
}

/** Render the report a workflow puts into an issue or a comment. */
export function render(rows: PrRow[], opts: { minAge: number }): string {
  const bad = rows.filter((r) => r.state === "no-run");
  const unknown = rows.filter((r) => r.state === "unknown");
  const tooNew = rows.filter((r) => r.state === "too-new");
  const lines: string[] = [];
  lines.push(`Open pull requests whose head has **no CI run of any kind**.`);
  lines.push("");
  lines.push(
    `A pull request showing zero checks is indistinguishable from one whose ` +
      `checks have not started — so "nothing red" here is not "nothing wrong", ` +
      `it is *nothing was asked*. Bean \`3pqn\`.`,
  );
  lines.push("");
  if (bad.length > 0) {
    lines.push(`## ${bad.length} with no run`);
    lines.push("");
    lines.push("| PR | head | pushed |");
    lines.push("|---|---|---|");
    for (const r of bad) {
      lines.push(`| #${r.number} — ${r.title.slice(0, 60)} | \`${r.sha.slice(0, 10)}\` | ${r.headAt ?? "?"} |`);
    }
    lines.push("");
    lines.push(
      "Dispatch the workflow against the branch and read that run. Re-pushing " +
        "may not produce one — on 2026-09-20 two consecutive pushes were both dropped.",
    );
    lines.push("");
  }
  if (unknown.length > 0) {
    lines.push(`## ${unknown.length} COULD NOT BE DETERMINED`);
    lines.push("");
    for (const r of unknown) lines.push(`- #${r.number} — ${r.detail ?? "no reason recorded"}`);
    lines.push("");
    lines.push("This is not a clean result for them, and it outranks the findings above.");
    lines.push("");
  }
  lines.push(
    `Checked ${rows.length} open pull request(s); ${tooNew.length} head(s) younger than ` +
      `${opts.minAge} minutes were **not judged** — a head pushed moments ago has no run yet, ` +
      `and reporting those is how a sweep gets ignored.`,
  );
  return lines.join("\n") + "\n";
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const flag = (n: string): string | undefined => {
    const i = argv.findIndex((a) => a === `--${n}` || a.startsWith(`--${n}=`));
    if (i === -1) return undefined;
    return argv[i]!.includes("=") ? argv[i]!.split("=").slice(1).join("=") : argv[i + 1];
  };
  const minAge = Number(flag("min-age-minutes") ?? 15);
  const outFile = flag("out");
  const slug = ownerRepo(detectRepoUrl(REPO) ?? "");
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const hdrs = {
    accept: "application/vnd.github+json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };

  const rows: PrRow[] = [];
  let listFailed: string | undefined;
  // Falling-off retry on every error (owner's rule, 2026-09-20). This call is
  // the one worth protecting hardest: it fails the WHOLE sweep, where a single
  // pull request's failure only makes that row `unknown`.
  const ask = (url: string) =>
    withBackoff(
      async () => {
        const r = await fetch(url, { headers: hdrs, signal: AbortSignal.timeout(20_000) });
        return { value: r, transient: classifyResponse(r.status, r.headers) };
      },
      { onRetry: (n, ms, why) => console.error(`  … attempt ${n} failed (${why}); retrying in ${ms}ms`) },
    );

  try {
    const res = await ask(`https://api.github.com/repos/${slug}/pulls?state=open&per_page=100`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const prs = (await res.json()) as {
      number: number;
      title: string;
      draft?: boolean;
      head: { sha: string };
    }[];
    for (const pr of prs) {
      // A draft is a work in progress by declaration; its author has said so.
      if (pr.draft) continue;
      let headAt: string | undefined;
      try {
        const c = await ask(`https://api.github.com/repos/${slug}/commits/${pr.head.sha}`);
        if (c.ok) headAt = ((await c.json()) as { commit?: { committer?: { date?: string } } }).commit?.committer?.date;
      } catch {
        // left undefined -> `unknown` below, never "old enough"
      }
      const eligible = isEligible(headAt, minAge);
      if (eligible === undefined) {
        rows.push({ number: pr.number, title: pr.title, sha: pr.head.sha, state: "unknown", detail: "head commit date unreadable" });
        continue;
      }
      if (!eligible) {
        rows.push({ number: pr.number, title: pr.title, sha: pr.head.sha, headAt, state: "too-new" });
        continue;
      }
      const v = await runsForHead(slug, pr.head.sha);
      rows.push({
        number: pr.number,
        title: pr.title,
        sha: pr.head.sha,
        headAt,
        state: v.state === "has-run" ? "has-run" : v.state === "no-run" ? "no-run" : "unknown",
        detail: v.state === "cannot-ask" ? v.reason : undefined,
      });
    }
  } catch (e) {
    listFailed = e instanceof Error ? e.message : String(e);
  }

  if (listFailed !== undefined) {
    const text = `Could not list open pull requests: ${listFailed}.\n\nNothing has been established.\n`;
    if (outFile) writeFileSync(outFile, text);
    console.error(`? COULD NOT ASK — ${listFailed}`);
    process.exit(2);
  }

  // Written BEFORE any exit path, so a red always has a report and a crash
  // before this point does not — the disambiguation `ci-health.yml` relies on.
  const report = render(rows, { minAge });
  if (outFile) writeFileSync(outFile, report);

  for (const r of rows) {
    const mark = { "has-run": "✓", "no-run": "✗", "too-new": "·", unknown: "?" }[r.state];
    console.log(`  ${mark} #${String(r.number).padEnd(5)} ${r.state.padEnd(9)} ${r.title.slice(0, 56)}`);
  }
  const verdict = verdictFor(rows);
  console.log(`\n${rows.length} open PR(s) checked — verdict: ${verdict}`);
  process.exit(verdict === "unknown" ? 2 : verdict === "findings" ? 1 : 0);
}
