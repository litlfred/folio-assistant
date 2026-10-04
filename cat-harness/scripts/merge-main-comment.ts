#!/usr/bin/env bun
/**
 * The merge-main bot's REPORTING: what its PR comment says, whether it says
 * anything at all (bean `qnob`, issue #1854), and whether a failure notifies
 * anybody (bean `03nl`).
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
 * ## What it decides, second: whether the run NOTIFIES
 *
 * `merge-main.yml` fires on every push to `main` — many an hour — and runs one
 * matrix member per opted-in PR. One member's failure made the whole run
 * `failure`, and GitHub emails a failed run: measured on run 37179860536, where
 * exactly one of the members failed (#1801) on a condition already fixed on
 * another branch, and the owner was emailed about it on every push. *A run that
 * is red because one of fifteen PRs needs a person tells the owner nothing
 * actionable, dozens of times a day.*
 *
 * So the member no longer decides the run's colour (`continue-on-error` on the
 * job) and {@link aggregateVerdicts} does, once per run, on three conditions:
 * a NEW or CHANGED failure, a SYSTEMIC one (every selected PR failed), and a
 * member that could not say what happened. {@link classifyVerdict} is the
 * per-member half, and {@link signatureOf} is what makes "the same failure
 * again" answerable at all.
 *
 * **Quiet is not silent.** `1xhc`'s standing rule is that a gate which does not
 * fire cannot be told from one that passed, and the same holds one layer out: a
 * failure that does not notify must still be findable. Every quiet failure
 * keeps its PR comment (edited in place, carrying the signature), its line in
 * the job summary, a warning annotation, and its own red member job. What it
 * loses is the second, third and fortieth email about one condition.
 *
 * Usage (from the workflow; inputs in the environment, as the step sets them):
 *   bun run cat-harness/scripts/merge-main-comment.ts --log <merge.log> [--plan-out <plan.json>]
 * prints one JSON object: {"action":"leave","reason":…} or
 * {"action":"write","body":…,"labelNeedsHuman":…,"signature":…};
 *   bun run cat-harness/scripts/merge-main-comment.ts --verdict <verdict.json>
 * classifies this member for the run, writes it, and reports it (always exit 0:
 * the member's own redness is decided by the workflow's failure step, not here);
 *   bun run cat-harness/scripts/merge-main-comment.ts --aggregate <dir>
 * reads every member's verdict and exits 1 only if the run should notify.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
  /**
   * The PR's head sha as selected. Part of the failure signature, so a push by
   * the AUTHOR makes a repeating failure new again and notifies once more —
   * main's sha is deliberately not, since main moves every few minutes and the
   * failure is not about main.
   */
  headSha: string;
  marker: string;
  runUrl: string;
  /** Names of main's failing check runs — asked only when the outcome needs them. */
  mainFailing: () => string;
}

export type CommentPlan =
  | { action: "leave"; reason: string }
  | { action: "write"; body: string; labelNeedsHuman: boolean; signature: string };

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
  const text = `${body.join("\n")}\n\n[Run](${i.runUrl}) · \`.github/workflows/merge-main.yml\` (bean \`d33q\`). Remove the \`merge-main\` label to stop.`;
  // The signature is carried BY THE COMMENT, as its last line and as an HTML
  // comment, so the durable record and the dedup key are one object and a
  // reader sees no change. See `signatureOf`.
  const signature = signatureOf(i, text);
  return {
    action: "write",
    body: `${text}\n<!-- merge-main-signature: ${signature} -->`,
    labelNeedsHuman,
    signature,
  };
}

/**
 * The marker that carries a failure's SIGNATURE inside the bot's own comment.
 *
 * The comment is the durable record of a failure; the red run is only its
 * notification. So the record is also where the signature lives: the next run
 * reads back what the last one reported and can tell "this again" from
 * "something else". No second store, and nothing to go stale separately —
 * delete the comment and the next failure is new again, which is the correct
 * reading of a record that is gone.
 */
const SIGNATURE_RE = /<!-- merge-main-signature: ([0-9a-f]{6,64}) -->/;

/** The signature an existing comment records, or `""` when it records none. */
export function signatureIn(body: string): string {
  return SIGNATURE_RE.exec(body)?.[1] ?? "";
}

/**
 * Lines of merge-base's log that name a CAUSE, normalised.
 *
 * Deliberately a declared list of markers rather than everything that looks
 * like an error: the signature's job is to tell one cause from another, and a
 * log line carrying a duration or a sha would make every run's signature
 * different, which is the spam this exists to stop. Being wrong in the other
 * direction — two different causes sharing a signature — is why the ABORTED
 * line is in the list: `merge-base`'s own exit text is the one place the reason
 * is written down, and without it every `exit 1` that is not a refusal looked
 * identical (the head text for that branch is generic by design).
 */
const SALIENT = [/STILL fails/, /^merge-base: ABORTED/, /^fatal:/, /\berror:/, /Script not found/, /^ {2}✗ /];

/** Strip what differs between two runs of the SAME condition. */
function normalise(line: string): string {
  return line
    .replace(/\b[0-9a-f]{7,40}\b/g, "<sha>")
    .replace(/\b\d{4}-\d{2}-\d{2}T[\d:.]+Z?\b/g, "<time>")
    .replace(/\b\d+(?:\.\d+)?\s?(?:ms|s|m)\b/g, "<dur>")
    .replace(/\s+/g, " ")
    .trim();
}

/** The salient lines of a log: normalised, de-duplicated, sorted, bounded. */
export function salientLines(log: string): string[] {
  const seen = new Set<string>();
  for (const raw of log.split("\n")) {
    if (!SALIENT.some((re) => re.test(raw))) continue;
    const l = normalise(raw);
    if (l !== "") seen.add(l);
  }
  // Sorted, so the order merge-base happened to print them in is not part of
  // the signature; bounded, so one pathological log cannot make every run
  // differ from every other.
  return [...seen].sort().slice(0, 20);
}

/**
 * A stable fingerprint of WHAT THIS RUN FOUND.
 *
 * Three inputs, each for a reason:
 *
 *  - the PR's head sha, so a push by the author makes the condition new again
 *    and notifies once. Not main's sha: main moves every few minutes and the
 *    failure is not about main.
 *  - the salient log lines, so a failure whose CAUSE changed is new even when
 *    the comment's head sentence is the same generic Error text.
 *  - the comment body the run would write, minus the run link — the outcome as
 *    the reader will see it.
 */
export function signatureOf(i: CommentInput, body: string): string {
  const volatile = body
    .replace(SIGNATURE_RE, "")
    .replace(/\[Run\]\([^)]*\)/g, "")
    // Main's own failing checks are information ABOUT MAIN, not about this
    // failure — the same reason main's sha is not an input. They flap between
    // runs while the PR's condition is unchanged, and an input that flaps is a
    // signature that never matches, which is the spam back again.
    .replace(/Failing on main right now:[^\n]*/g, "")
    .replace(/\b[0-9a-f]{7,40}\b/g, "<sha>");
  // NOT normalised: `normalise` is what makes two runs of one condition look
  // the same, and it collapses every sha — so running the head through it would
  // make an author's push invisible, which is the one thing it has to show.
  const input = [`head=${i.headSha.slice(0, 12)}`, ...salientLines(i.log), normalise(volatile)].join("\n");
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

/** What one matrix member reports to the run about itself. */
export interface Verdict {
  pr: string;
  /** The outcome's name; `notify` is the decision, this is the reason for it. */
  verdict: "merged" | "up-to-date" | "refused" | "blocked" | "race" | "repeat" | "new" | "undetermined";
  notify: boolean;
  reason: string;
  signature: string;
  previous: string;
}

/** True for the outcomes in which this member's job is RED. */
export function isFailure(v: Verdict["verdict"]): boolean {
  return v === "repeat" || v === "new" || v === "undetermined";
}

export interface VerdictInput {
  pr: string;
  /** `job.status` as the verdict step sees it. */
  jobStatus: string;
  /** The outcome of the step that checks the head did not move since selection. */
  headCheck: string;
  /** `steps.merge.outcome`. */
  mergeOutcome: string;
  /** `steps.push.outcome`; `skipped` when there was nothing to push. */
  pushOutcome: string;
  status: string;
  refused: string;
  merged: string;
  pushed: string;
  blocked: string;
  rejected: string;
  /** This run's signature, from the comment plan; `""` when there is none. */
  signature: string;
  /** The signature the existing comment records; `""` when it records none. */
  previous: string;
}

/**
 * Whether this member's outcome is something the owner has not already been
 * told.
 *
 * Every branch is quiet or loud for a stated reason, and the quiet ones are
 * still RECORDED — the PR comment, the job summary, a warning annotation, and
 * the member job's own red. `1xhc`'s rule is that a gate which does not fire
 * cannot be told from one that passed; a notification that does not arrive must
 * therefore leave the finding somewhere a person can reach it.
 */
export function classifyVerdict(i: VerdictInput): Verdict {
  const v = (verdict: Verdict["verdict"], notify: boolean, reason: string): Verdict =>
    ({ pr: i.pr, verdict, notify, reason, signature: i.signature, previous: i.previous });

  if (i.jobStatus === "cancelled") {
    return v("race", false, "superseded: a newer run for this PR cancelled this one");
  }
  // An expected race, and the single loudest source of the spam this fixes:
  // under a fast merge cadence the head moves between selection and checkout
  // several times an hour, and the step that notices exits 1.
  if (i.headCheck === "failure") {
    return v("race", false, "the PR's head moved between selection and checkout; the next push to main picks it up");
  }
  if (i.mergeOutcome !== "success") {
    return v("undetermined", true, `the merge step did not run to completion (outcome: ${i.mergeOutcome || "none"}) — the bot itself could not do its work`);
  }
  if (i.status.trim() === "") {
    return v("undetermined", true, "the merge step reported no exit status, and the job was not cancelled");
  }
  if (i.refused === "true") {
    return v("refused", false, "refused: an authored or undeclared conflict needs a person — reported in the PR comment, and not a bot failure");
  }
  if (i.merged === "true" && i.pushed === "success") return v("merged", false, "merged and pushed");
  if (i.merged === "true" && i.blocked === "workflows") {
    return v("blocked", false, "the merge commit changes a workflow file and the token has no `workflows` scope (#1829) — a person pushes it; no retry can succeed");
  }
  if (i.merged === "true" && i.rejected === "true") {
    return v("race", false, "the branch moved during the run; nothing was overwritten and the next push to main retries");
  }
  if (i.status === "0" && i.merged !== "true") return v("up-to-date", false, "already contains main; nothing to push");

  // Everything from here is a genuine failure: either the push failed for a
  // reason that is not a race, or merge-base exited non-zero without refusing.
  const same = i.signature !== "" && i.signature === i.previous;
  if (same) {
    return v("repeat", false, "the PR comment already reports this exact failure on this exact head — nothing new to say");
  }
  if (i.signature === "") {
    return v("undetermined", true, "the failure has no signature, so it cannot be told from one already reported");
  }
  return v("new", true, i.previous === ""
    ? "a failure this PR's comment did not already report"
    : `the failure changed (was ${i.previous}, now ${i.signature})`);
}

/** The run-level decision: does this run notify, and what does it say it saw. */
export function aggregateVerdicts(i: {
  selected: readonly string[];
  verdicts: readonly Verdict[];
  selectResult: string;
}): { loud: boolean; summary: string; lines: string[] } {
  const lines: string[] = [];
  const have = new Set(i.verdicts.map((v) => String(v.pr)));
  const missing = i.selected.filter((pr) => !have.has(String(pr)));
  const failures = i.verdicts.filter((v) => isFailure(v.verdict));
  const newOnes = i.verdicts.filter((v) => v.notify);

  // `select` has no `continue-on-error`, so its own failure already reds the
  // run. Saying so without failing again keeps one condition to one email.
  if (i.selectResult !== "success") {
    lines.push(`selection did not succeed (${i.selectResult}) — that job is loud by itself, so this one does not fail as well`);
  }

  // Every member failing is not news about fifteen PRs; it is news about the
  // bot or about main, and it is loud even when each member is a repeat.
  const systemic = i.selected.length >= 2 && i.verdicts.length === i.selected.length && failures.length === i.verdicts.length;

  const rows = [...i.verdicts]
    .sort((a, b) => Number(a.pr) - Number(b.pr))
    .map((v) => `| #${v.pr} | ${v.verdict} | ${v.notify ? "**notifies**" : "quiet"} | ${v.reason} |`);
  const summary = [
    "## merge-main: what this run found",
    "",
    `Selected: ${i.selected.length === 0 ? "none" : i.selected.map((p) => `#${p}`).join(", ")}.`,
    "",
    "| PR | outcome | notification | why |",
    "|---|---|---|---|",
    ...(rows.length ? rows : ["| — | nothing to merge | quiet | no opted-in PR was behind main |"]),
    "",
    ...missing.map((pr) => `- **#${pr} reported no verdict at all** — its job did not reach the step that writes one. Loud: a member that cannot say what happened is not a member that passed.`),
    ...(systemic ? ["- **Every selected PR failed.** That is systemic — the bot's own tool, or main — so it is loud even though each member on its own is a repeat."] : []),
    "",
    failures.length === 0
      ? "No member failed."
      : `${failures.length} member(s) failed; ${newOnes.length} of them are new or undetermined. A failure that is not new stays in its PR's comment and in that job's summary, and its job is still red — it just does not email anybody a second time.`,
  ].join("\n");

  for (const pr of missing) lines.push(`#${pr}: no verdict was written`);
  for (const v of newOnes) lines.push(`#${v.pr}: ${v.verdict} — ${v.reason}`);
  if (systemic) lines.push("every selected PR failed — systemic");
  return { loud: missing.length > 0 || newOnes.length > 0 || systemic, summary, lines };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const at = args.indexOf(name);
    return at >= 0 ? args[at + 1] : undefined;
  };
  const env = (k: string): string => process.env[k] ?? "";
  /**
   * Say it in the run's own summary as well as in the log.
   *
   * The log of a job nobody is emailed about is read by nobody, and the step
   * summary is the one surface that survives on the run page itself. Printed
   * too, so a local invocation shows the same text.
   */
  const report = (markdown: string): void => {
    console.log(markdown);
    const to = env("GITHUB_STEP_SUMMARY");
    if (to !== "") appendFileSync(to, `${markdown}\n`);
  };

  const aggregateDir = flag("--aggregate");
  if (aggregateDir !== undefined) {
    const verdicts: Verdict[] = (existsSync(aggregateDir) ? readdirSync(aggregateDir) : [])
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(readFileSync(join(aggregateDir, f), "utf-8")) as Verdict);
    const selected = (JSON.parse(env("PRS") === "" ? "[]" : env("PRS")) as unknown[]).map(String);
    const { loud, summary, lines } = aggregateVerdicts({ selected, verdicts, selectResult: env("SELECT_RESULT") });
    report(summary);
    // An annotation per reason, so the run page names them even when the email
    // does not go out. `::error::` only when this job is about to fail: an
    // error annotation on a green run is the noise this change exists to stop.
    for (const l of lines) console.log(`::${loud ? "error" : "warning"}::merge-main: ${l}`);
    process.exit(loud ? 1 : 0);
  }

  const verdictOut = flag("--verdict");
  if (verdictOut !== undefined) {
    const planPath = flag("--plan");
    const plan = planPath !== undefined && existsSync(planPath)
      ? (JSON.parse(readFileSync(planPath, "utf-8")) as CommentPlan)
      : undefined;
    const verdict = classifyVerdict({
      pr: env("PR"),
      jobStatus: env("JOB_STATUS"),
      headCheck: env("HEAD_CHECK"),
      mergeOutcome: env("MERGE_OUTCOME"),
      pushOutcome: env("PUSH_OUTCOME"),
      status: env("STATUS"),
      refused: env("REFUSED"),
      merged: env("MERGED"),
      pushed: env("PUSHED"),
      blocked: env("BLOCKED"),
      rejected: env("REJECTED"),
      signature: plan?.action === "write" ? plan.signature : "",
      previous: env("PREVIOUS_SIGNATURE"),
    });
    writeFileSync(verdictOut, JSON.stringify(verdict));
    report([
      `## merge-main on #${verdict.pr}: ${verdict.verdict}`,
      "",
      verdict.reason,
      "",
      verdict.notify
        ? "**This is new, so the run fails and the owner is emailed once.**"
        : "Not notified: this is not new. The PR comment above carries the finding, this summary records it, and this job is red — only the email is withheld.",
      "",
      `signature \`${verdict.signature || "none"}\`, previously reported \`${verdict.previous || "none"}\`.`,
    ].join("\n"));
    // Loud or quiet, the member's own redness is the workflow's failure step to
    // decide; this step only reports. It never fails, so it cannot mask it.
    console.log(`::${verdict.notify ? "error" : "warning"}::merge-main #${verdict.pr}: ${verdict.verdict} — ${verdict.reason}`);
    process.exit(0);
  }

  const logPath = flag("--log");
  const plan = composeComment({
    jobStatus: env("JOB_STATUS"),
    status: env("STATUS"),
    merged: env("MERGED"),
    pushed: env("PUSHED"),
    blocked: env("BLOCKED"),
    rejected: env("REJECTED"),
    sha: env("SHA"),
    // A cancelled run may never have written the log; that is not an error here.
    log: logPath !== undefined && existsSync(logPath) ? readFileSync(logPath, "utf-8") : "",
    headSha: env("HEAD_SHA"),
    marker: env("MARKER"),
    runUrl: env("RUN_URL"),
    mainFailing: () => {
      const r = spawnSync("gh", ["api", `repos/${env("REPO")}/commits/main/check-runs?per_page=100`, "--jq",
        '[.check_runs[] | select(.conclusion == "failure") | .name] | join(", ")'], { encoding: "utf-8" });
      // "Could not check" is never rendered as "none failing".
      return r.status === 0 ? r.stdout.trim() : "(could not be checked)";
    },
  });
  // The plan is written out as well as printed, so the verdict step reads the
  // SAME decision rather than recomputing it from the same inputs — two
  // spellings of one answer are free to disagree.
  const planOut = flag("--plan-out");
  if (planOut !== undefined) writeFileSync(planOut, JSON.stringify(plan));
  console.log(JSON.stringify(plan));
}
