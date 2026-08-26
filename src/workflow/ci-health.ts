/**
 * Is CI actually green, or has it merely been red for so long that nobody looks?
 *
 * `5rfy` fixed workflows that never **fire** — a header advertising a schedule
 * its `on:` block did not have. This is the opposite defect, and the one that
 * cost more: `docs-site.yml` fired on every push to `main` and **failed all 30
 * times** between 2026-06-29 and 2026-08-26. The published site sat two months
 * stale, and the workflow diagrams merged in #135 never reached it.
 *
 * The trigger was fine. The *outcome* was invisible. From inside the repo a
 * workflow that runs and passes and one that runs and fails look identical, and
 * GitHub's failure email is evidently a channel nobody reads.
 *
 * So this classifies each workflow's recent history on the default branch, and
 * the session-start sweep prints it where attention already goes.
 *
 * ## "Could not check" is not "healthy"
 *
 * Every function here distinguishes *red*, *green* and *unknown*, and the
 * caller must too. A health report that silently treats an unreachable API as
 * fine is the same failure one level up — which is precisely the mistake the
 * sibling-branch section of `session-start-coord-sweep.sh` already refuses to
 * make ("Treat this section as unread, not as empty").
 *
 * @module folio-assistant/workflow/ci-health
 */

/** The fields of a GitHub Actions run this module reads. */
export interface RunSummary {
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url?: string;
  /** `.github/workflows/x.yml` — the file the run came from, if any. */
  path?: string;
}

export type Health = "green" | "red" | "running" | "no-runs" | "superseded";

export interface WorkflowHealth {
  workflow: string;
  health: Health;
  /** Consecutive non-success runs, newest first. 0 when the latest passed. */
  consecutiveFailures: number;
  /** ISO date of the most recent success, if there is one in the window. */
  lastSuccess?: string;
  /** Whole days since that success. `undefined` when there is none in window. */
  daysSinceSuccess?: number;
  /** Newest run, for a link to hand the reader. */
  latestUrl?: string;
  /**
   * Whole days since the most recent run of any conclusion.
   *
   * Age is what separates an active fire from a stale scorch mark. Two of this
   * repo's workflows show "no success in the window" — and both last ran on
   * 2026-08-07 against a commit whose files were changed the next day. Reporting
   * those identically to something that broke an hour ago is how a health
   * report earns the inattention it exists to fix.
   */
  daysSinceLastRun?: number;
  /** ISO date of the most recent run of any conclusion. */
  lastRun?: string;
  /**
   * ISO date of the change that made this workflow's last verdict obsolete.
   *
   * Set only on a red whose newest run **predates** the last edit to its
   * workflow file: the version that failed no longer exists, so the failure is
   * history rather than a live problem — the same distinction `workflowExists`
   * already draws for a workflow that was deleted outright.
   */
  supersededBy?: string;
  /** `.github/workflows/x.yml`, carried through for the reader. */
  path?: string;
}

/** Conclusions that are not a pass but are also not the workflow's fault. */
const NOT_A_VERDICT = new Set(["cancelled", "skipped", "neutral"]);

/**
 * Classify one workflow's runs, newest first.
 *
 * A run still in flight defers the verdict rather than counting as either — a
 * queued run is not evidence of health, and calling it a failure would cry wolf
 * on every push.
 */
export function classifyRuns(runs: RunSummary[], now = new Date()): Omit<WorkflowHealth, "workflow"> {
  const settled = runs.filter((r) => r.status === "completed" && !NOT_A_VERDICT.has(r.conclusion ?? ""));

  const lastSuccessRun = settled.find((r) => r.conclusion === "success");
  const lastSuccess = lastSuccessRun?.created_at;
  const daysSinceSuccess = lastSuccess
    ? Math.floor((now.getTime() - new Date(lastSuccess).getTime()) / 86_400_000)
    : undefined;

  let consecutiveFailures = 0;
  for (const r of settled) {
    if (r.conclusion === "success") break;
    consecutiveFailures++;
  }

  let health: Health;
  if (runs.length === 0) health = "no-runs";
  else if (settled.length === 0) health = "running";
  else health = consecutiveFailures === 0 ? "green" : "red";

  const daysSinceLastRun = runs[0]
    ? Math.floor((now.getTime() - new Date(runs[0].created_at).getTime()) / 86_400_000)
    : undefined;

  return {
    health,
    consecutiveFailures,
    lastSuccess,
    daysSinceSuccess,
    daysSinceLastRun,
    lastRun: runs[0]?.created_at,
    latestUrl: runs[0]?.html_url,
  };
}

/** Group a flat run list by workflow name, newest first within each group. */
export function byWorkflow(runs: RunSummary[]): Map<string, RunSummary[]> {
  const out = new Map<string, RunSummary[]>();
  const sorted = [...runs].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const r of sorted) {
    const list = out.get(r.name) ?? [];
    list.push(r);
    out.set(r.name, list);
  }
  return out;
}

export interface AssessOptions {
  now?: Date;
  /**
   * Does this workflow file still exist? Runs of a **deleted** workflow are
   * history, not a live problem, and reporting them cries wolf — which is how a
   * health report earns the same inattention that let `docs-site` rot.
   *
   * Omit it and nothing is filtered: not knowing which files exist must not
   * silently drop failures.
   */
  workflowExists?: (path: string) => boolean;
  /**
   * When was this workflow file last changed? ISO date, or `undefined` if not
   * known.
   *
   * A red verdict is a verdict about *the file as it was when it ran*. Edit the
   * file and that verdict is about a version that no longer exists — most
   * sharply when the failure was a startup failure, where the YAML never parsed
   * and no job ran at all.
   *
   * Two of this repo's workflows sit exactly there. `witness-refresh.yml` and
   * `qa-sweep.yml` failed to parse, fired on `push` despite being
   * `workflow_dispatch`-only (GitHub could not read the `on:` block to filter
   * on), and were fixed the next day. They only run on dispatch, and this
   * report only reads the default branch — so nothing will ever run them here
   * again, and without this rule they stay red forever. Two permanent false
   * fires erode exactly the attention the report exists to protect.
   *
   * Omit it and nothing is superseded: not knowing when a file changed must
   * leave a failure reported, never explain it away.
   */
  workflowChangedAt?: (path: string) => string | undefined;
}

export function assess(runs: RunSummary[], opts: AssessOptions = {}): WorkflowHealth[] {
  const now = opts.now ?? new Date();
  const live = opts.workflowExists
    ? runs.filter((r) => !r.path || opts.workflowExists!(r.path))
    : runs;
  return [...byWorkflow(live).entries()]
    .map(([workflow, rs]) => {
      const h: WorkflowHealth = { workflow, path: rs[0]?.path, ...classifyRuns(rs, now) };
      // A failure against a version of the file that is gone is history. Note
      // that this only ever DEMOTES a red — it can never turn a failure into a
      // pass, because a later edit is evidence the failing version is gone, not
      // evidence the new one works.
      if (h.health === "red" && h.path && h.lastRun && opts.workflowChangedAt) {
        const changed = opts.workflowChangedAt(h.path);
        if (changed && changed > h.lastRun) {
          h.health = "superseded";
          h.supersededBy = changed;
        }
      }
      return h;
    })
    .sort((a, b) => {
      // Worst first: a reader who reads one line should read the worst one.
      const order: Health[] = ["red", "running", "superseded", "green", "no-runs"];
      const rank = (h: WorkflowHealth) => order.indexOf(h.health);
      return rank(a) - rank(b) || b.consecutiveFailures - a.consecutiveFailures;
    });
}

/**
 * Render for the session-start sweep.
 *
 * `unreachable` is its own outcome, printed as loudly as a failure, because a
 * health check that goes quiet when it cannot see is worse than no check: it
 * reads as reassurance.
 */
export function render(
  health: WorkflowHealth[],
  opts: { unreachable?: string; branch: string },
): string {
  const lines = ["## CI health", ""];
  if (opts.unreachable) {
    lines.push(
      `**Not checked — treat as unknown, not as green.** ${opts.unreachable}`,
      "",
      "`docs-site.yml` was red for 30 consecutive runs over two months without",
      "anyone noticing (bean `xom7`). An unchecked section is exactly how that",
      "looked from in here.",
      "",
    );
    return lines.join("\n");
  }
  if (health.length === 0) {
    lines.push(`_No runs on \`${opts.branch}\` in the window checked._`, "");
    return lines.join("\n");
  }

  const red = health.filter((h) => h.health === "red");
  const STALE_DAYS = 7;
  for (const h of red) {
    const since =
      h.daysSinceSuccess === undefined
        ? "no success in the window"
        : `last green ${h.daysSinceSuccess}d ago`;
    // A red that has not re-run in a week may already be fixed — flag it as
    // stale so the reader triages it differently from something failing now.
    const age =
      h.daysSinceLastRun === undefined
        ? ""
        : h.daysSinceLastRun >= STALE_DAYS
          ? `, but has not run in ${h.daysSinceLastRun}d — may be stale`
          : `, last ran ${h.daysSinceLastRun}d ago`;
    lines.push(
      `- ❌ **${h.workflow}** — ${h.consecutiveFailures} consecutive failure(s), ${since}${age}` +
        (h.latestUrl ? `\n      ${h.latestUrl}` : ""),
    );
  }
  // Reported, but below the fold and never as a pass: the failing version of
  // the file is gone, which is not the same as knowing the current one works.
  const superseded = health.filter((h) => h.health === "superseded");
  for (const h of superseded) {
    lines.push(
      `- ❔ **${h.workflow}** — last failed ${h.daysSinceLastRun}d ago, but the ` +
        `workflow file changed after that. Verdict is stale, not green; nothing ` +
        `has re-run it since.`,
    );
  }

  const ok = health.filter((h) => h.health !== "red" && h.health !== "superseded");
  if (red.length === 0 && superseded.length === 0) {
    lines.push(`✓ every workflow with a recent run on \`${opts.branch}\` is green (${ok.length}).`);
  } else if (red.length === 0) {
    // Not "all green" — that would be the lie this module exists to prevent.
    lines.push("", `_(no live failures; ${ok.length} workflow(s) green.)_`);
  } else {
    lines.push("", `_(${ok.length} other workflow(s) not failing.)_`);
  }
  lines.push("");
  return lines.join("\n");
}
