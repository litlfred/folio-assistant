#!/usr/bin/env bun
/**
 * The merge-main bot's PR comment: what it says, and whether it says anything
 * at all (bean `qnob`, issue #1854).
 *
 * @module scripts/merge-main-comment
 * @graphNode none — a formatter called by `.github/workflows/merge-main.yml`
 * @covers none — it composes a comment and judges no declared graph
 *
 * ## Why it is a function and not shell
 *
 * The composition lived inline in the workflow's comment step, where no test
 * could reach its branches. Its last branch caught everything the others did
 * not, including a run that never finished: measured 2026-10-02 on #1777
 * (run 36986362911), a newer push to `main` cancelled the job mid-merge
 * (`concurrency: cancel-in-progress`), the `always()` comment step ran anyway
 * with an empty `STATUS`, and the PR's comment was rewritten to
 * "**Error** (exit ) — merge-base failed …". A superseded run is not an
 * error, and it knows nothing newer than the comment already there.
 *
 * ## What it decides
 *
 * - `leave`: the job was cancelled, or the merge step reported no status.
 *   The existing comment stays as it is; the run that superseded this one
 *   writes its own.
 * - `write`: the comment body, and whether to label `needs-merge-human`.
 *
 * Every `write` text is the text the workflow wrote before, unchanged.
 *
 * Usage (from the workflow; inputs in the environment, as the step sets them):
 *   bun run cat-harness/scripts/merge-main-comment.ts --log <merge.log>
 * prints one JSON object: {"action":"leave","reason":…} or
 * {"action":"write","body":…,"labelNeedsHuman":…}.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

export interface CommentInput {
  /** `job.status` of the running job: `success`, `failure` or `cancelled`. */
  jobStatus: string;
  /** merge-base's exit status; empty when the merge step never reported one. */
  status: string;
  merged: string;
  /** `success` when the push step reported a sha. */
  pushed: string;
  blocked: string;
  rejected: string;
  sha: string;
  /** merge-base's log; empty when there is none. */
  log: string;
  marker: string;
  runUrl: string;
  /** Names of main's failing check runs — asked only when the outcome needs them. */
  mainFailing: () => string;
}

export type CommentPlan =
  | { action: "leave"; reason: string }
  | {
      action: "write";
      body: string;
      labelNeedsHuman: boolean;
      /**
       * The merge succeeded or there was nothing to merge, so an earlier
       * refusal's `needs-merge-human` no longer describes the PR. Without this
       * the label outlived the problem it named (bean `wczm` item 3): a later
       * clean run fixed the branch and the PR still asked for a person.
       */
      clearNeedsHuman: boolean;
    };

/** The three lists the comment reports, read from merge-base's own output. */
export function parseLog(log: string): { resolved: string; refused: string; unrepaired: string } {
  const lines = log.split("\n");
  const counts = new Map<string, number>();
  for (const l of lines) {
    if (!/^ {2}✓ .* {2}\[[a-z0-9-]+: /.test(l)) continue;
    const id = l.replace(/.*\[([^:]+):.*/, "$1");
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const resolved = [...counts.keys()].sort().map((id) => `- \`${id}\`: ${counts.get(id)}`).join("\n");
  const refused = lines.filter((l) => /^ {2}✗ .* {2}\[/.test(l)).map((l) => l.replace(/^ {2}✗ /, "- ")).join("\n");
  const unrepaired = lines.filter((l) => l.includes("STILL fails")).map((l) => l.replace(/^ *✗ /, "- ")).join("\n");
  return { resolved, refused, unrepaired };
}

/** Decide what the bot's comment says this run, if anything. */
export function composeComment(i: CommentInput): CommentPlan {
  if (i.jobStatus === "cancelled") {
    return { action: "leave", reason: "superseded: this run was cancelled (a newer push to main started another); the existing comment is left as it was" };
  }
  if (i.status.trim() === "") {
    return { action: "leave", reason: "the merge step reported no exit status (it did not run to completion); the existing comment is left as it was" };
  }
  const { resolved, refused, unrepaired } = parseLog(i.log);
  let head: string;
  let labelNeedsHuman = false;
  if (i.merged === "true" && i.pushed === "success") {
    head = `**Merged \`main\` and pushed \`${i.sha.slice(0, 9)}\`.** Every conflict was resolved by a declared pattern and the gate set reproduced the result; CI now judges it.`;
  } else if (i.merged === "true" && i.blocked === "workflows") {
    head = "**Merged and proved, but GitHub refused the push: the merge commit changes a workflow file**, and the workflow's token has no `workflows` permission, so no retry can succeed. Needs a person to push the merge (run the `merge:main` script locally). The fix is the owner's credentials design (#1829): a token with `workflows` scope.";
    labelNeedsHuman = true;
  } else if (i.merged === "true" && i.rejected === "true") {
    head = "**Merged and proved, but the push was rejected** — the branch moved during the run. Nothing was overwritten; the next push to `main` retries.";
  } else if (i.merged === "true") {
    head = "**Error** — merged and proved, but the push failed for a reason not recognised; see the run log. Nothing pushed.";
  } else if (i.status === "0") {
    head = "**Already up to date with `main`.** Nothing to push.";
  } else if (refused !== "") {
    head = "**Refused — nothing pushed.** These conflicts are authored or named by no declared pattern, so they need a person. Adding a pattern is a deliberate change with its reason (skill `merge-conflict-patterns`), never a widened glob.";
    labelNeedsHuman = true;
  } else if (unrepaired !== "") {
    const failing = i.mainFailing();
    head = `**Not proved — nothing pushed.** Every conflict matched a pattern, but regen could not reproduce these checks. If \`main\` is red on the same checks, it is main's red, not this PR's. Failing on main right now: ${failing || "none"}.`;
  } else {
    head = `**Error** (exit ${i.status}) — merge-base failed for a reason that is neither a refusal nor an unrepaired check; see the run log. Nothing pushed, and this run is marked failed.`;
  }
  const body = [
    i.marker,
    head,
    resolved ? `\nResolved by pattern:\n${resolved}` : "",
    refused ? `\nRefused:\n${refused}` : "",
    unrepaired ? `\nUnrepaired:\n${unrepaired}` : "",
  ].filter((s, n) => n < 2 || s !== "");
  return {
    action: "write",
    body: `${body.join("\n")}\n\n[Run](${i.runUrl}) · \`.github/workflows/merge-main.yml\` (bean \`d33q\`). Remove the \`merge-main\` label to stop.`,
    labelNeedsHuman,
    clearNeedsHuman: !labelNeedsHuman && ((i.merged === "true" && i.pushed === "success") || (i.merged !== "true" && i.status === "0")),
  };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--log");
  const logPath = at >= 0 ? args[at + 1] : undefined;
  const env = (k: string) => process.env[k] ?? "";
  const plan = composeComment({
    jobStatus: env("JOB_STATUS"),
    status: env("STATUS"),
    merged: env("MERGED"),
    pushed: env("PUSHED"),
    blocked: env("BLOCKED"),
    rejected: env("REJECTED"),
    sha: env("SHA"),
    // A cancelled run may never have written the log; that is not an error here.
    log: logPath && existsSync(logPath) ? readFileSync(logPath, "utf-8") : "",
    marker: env("MARKER"),
    runUrl: env("RUN_URL"),
    mainFailing: () => {
      const r = spawnSync("gh", ["api", `repos/${env("REPO")}/commits/main/check-runs?per_page=100`, "--jq",
        '[.check_runs[] | select(.conclusion == "failure") | .name] | join(", ")'], { encoding: "utf-8" });
      // "Could not check" is never rendered as "none failing".
      return r.status === 0 ? r.stdout.trim() : "(could not be checked)";
    },
  });
  console.log(JSON.stringify(plan));
}
