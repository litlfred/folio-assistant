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

import { parse as parseYaml } from "yaml";

/**
 * Does a workflow's YAML fire on every push to its branches?
 *
 * `true` every push, `false` never, **`undefined` cannot tell** — and the third
 * is the one that carries the design. GitHub spells the trigger three ways
 * (`on: push`, `on: [push, …]`, a mapping with a `push:` key); `on` is also the
 * YAML 1.1 boolean `true` under some parsers, so that key is checked rather
 * than assumed absent.
 *
 * A `push:` block carrying `paths`, `paths-ignore`, `branches`,
 * `branches-ignore`, `tags` or `tags-ignore` fires on SOME pushes, and which
 * ones is not answerable from this file — deciding it would mean evaluating the
 * filter against the commit's changed files, which a health report has no
 * business fetching. So it answers `undefined`, and every caller treats that as
 * "claim nothing".
 *
 * That clause was not foreseen; it was measured. `jsonld-gen-check.yml`
 * declares `on.push` under fifteen `paths:` entries, and the first version of
 * this returned `true` for it — putting a false "no run has judged the current
 * head" on a workflow that owed no run, which is the exact false fire the
 * trigger check exists to prevent.
 */
export function pushTriggerOf(text: string): boolean | undefined {
  let doc: unknown;
  try {
    doc = parseYaml(text);
  } catch {
    return undefined;
  }
  if (!doc || typeof doc !== "object") return undefined;
  const d = doc as Record<string, unknown>;
  const on = "on" in d ? d.on : d[true as unknown as string];
  if (on === undefined || on === null) return undefined;
  if (typeof on === "string") return on === "push";
  if (Array.isArray(on)) return on.includes("push");
  if (typeof on !== "object") return undefined;
  if (!Object.hasOwn(on as object, "push")) return false;
  const push = (on as Record<string, unknown>).push;
  if (push === null || push === undefined) return true;
  if (typeof push !== "object") return true;
  const FILTERS = ["paths", "paths-ignore", "branches", "branches-ignore", "tags", "tags-ignore"];
  return FILTERS.some((k) => Object.hasOwn(push as object, k)) ? undefined : true;
}

/** The fields of a GitHub Actions run this module reads. */
export interface RunSummary {
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url?: string;
  /** `.github/workflows/x.yml` — the file the run came from, if any. */
  path?: string;
  /** The commit this run judged. Absent when the caller did not supply it. */
  head_sha?: string;
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
  /**
   * The newest run is **not** the one this verdict came from — it is still in
   * flight, or it ended in a non-verdict (`cancelled`, `skipped`, `neutral`).
   *
   * Set whenever `runs[0]` is not `settled[0]`, and it is the difference
   * between a trend and an answer. `health` describes the newest *settled*
   * run, which can be older than the commit in front of the reader; when this
   * is set, that verdict says nothing about the head.
   *
   * Measured 2026-09-19, bean `gpuu`. `main` took a merge at 02:39 that broke
   * `kg:audit:check`; a run of this check a minute later printed three green
   * rows, because the run for the breaking commit had not settled and the
   * previous green was reported as current. An agent then wrote "`main` is not
   * red" into a pull request body on that basis, and flagged the PR that was
   * fixing it as mistaken. Both claims merged.
   *
   * This is the same class as the three rules this module already carries —
   * "could not check" is never green, a week-old red is flagged stale, a
   * superseded red is named as superseded. All exist so uncertainty never
   * renders as green. An unsettled newest run was the one uncertainty left
   * uncovered, in a module written for bean `xom7`: a red workflow that looked
   * green from inside the repo.
   *
   * It is deliberately **not** folded into `health`. The existing `running`
   * state means "nothing has settled at all", and overloading it would erase
   * the trend — a workflow red for six runs with a seventh in flight is still
   * red, and a reader needs both facts. So the verdict stays a verdict and
   * this says what it does not cover.
   */
  newestUnsettled?: boolean;
  /**
   * No run in the window judged the branch head at all.
   *
   * The sibling of {@link newestUnsettled}, and the case that one does not
   * reach. `newestUnsettled` answers "a run for the head exists but has not
   * finished". This answers "no run for the head was ever created" — the
   * workflow did not fire, or has not yet. Either way the verdict below is
   * about some earlier commit, and `docs-site.yml` sat in exactly this state
   * for two months under bean `xom7`.
   *
   * **Three facts must all be known before this is set, and any unknown means
   * silence rather than a finding.** The caller must supply the head sha
   * ({@link AssessOptions.headSha}); no run in the window may carry it; and
   * {@link AssessOptions.triggersOnPush} must return exactly `true` for this
   * workflow.
   *
   * That last one is not caution for its own sake. `witness-refresh.yml` and
   * `qa-sweep.yml` are `workflow_dispatch`-only and will never have a run for
   * any head, so without the trigger check this would report two permanent
   * false fires — which is precisely the defect the `superseded` rule was
   * added to retire. A health report earns its inattention one false fire at
   * a time.
   */
  headUnjudged?: boolean;
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
export function classifyRuns(
  runs: RunSummary[],
  now = new Date(),
  headSha?: string,
): Omit<WorkflowHealth, "workflow"> {
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

  // The verdict above is computed from `settled`. When the newest run is not
  // the newest settled one, the verdict is about an older commit and must say
  // so — see `newestUnsettled`. `health === "running"` already covers the case
  // where nothing has settled at all, so exclude it rather than report both.
  const newestUnsettled = runs.length > 0 && settled[0] !== runs[0] && health !== "running";

  // Only whether a run for the head EXISTS. Whether this workflow was supposed
  // to produce one is the caller's to answer, in `assess` — see `headUnjudged`.
  const headSeen = headSha !== undefined && runs.some((r) => r.head_sha === headSha);

  return {
    health,
    consecutiveFailures,
    lastSuccess,
    daysSinceSuccess,
    daysSinceLastRun,
    lastRun: runs[0]?.created_at,
    latestUrl: runs[0]?.html_url,
    ...(newestUnsettled ? { newestUnsettled: true } : {}),
    ...(headSha !== undefined && !headSeen ? { headUnjudged: true } : {}),
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
  /**
   * The commit at the tip of the branch being reported on.
   *
   * Omit it and {@link WorkflowHealth.headUnjudged} is never set: not knowing
   * which commit is current must not be rendered as "nothing judged it".
   * Whoever supplies this must be sure of it — a stale local ref is a wrong
   * answer, not a missing one, so a caller that cannot ask the forge directly
   * should pass nothing.
   */
  headSha?: string;
  /**
   * Does this workflow run on a push to the branch at all?
   *
   * `true` means a missing run for the head is a real gap. `false` or
   * `undefined` means nothing is claimed — a `workflow_dispatch`-only file has
   * no business having a run for every commit, and reporting one as unjudged
   * is a false fire that costs the whole report its credibility.
   *
   * Omit it and `headUnjudged` is never set, for the same reason
   * `workflowExists` omitted filters nothing: not knowing must not manufacture
   * a finding.
   */
  triggersOnPush?: (path: string) => boolean | undefined;
}

export function assess(runs: RunSummary[], opts: AssessOptions = {}): WorkflowHealth[] {
  const now = opts.now ?? new Date();
  const live = opts.workflowExists
    ? runs.filter((r) => !r.path || opts.workflowExists!(r.path))
    : runs;
  return [...byWorkflow(live).entries()]
    .map(([workflow, rs]) => {
      const h: WorkflowHealth = {
        workflow,
        path: rs[0]?.path,
        ...classifyRuns(rs, now, opts.headSha),
      };
      // `classifyRuns` only saw that no run carries the head sha. Whether this
      // workflow OWES one is a fact about its triggers, which only the caller
      // can read — and every unknown here clears the flag rather than keeping
      // it, so the report stays silent on anything it cannot establish.
      if (h.headUnjudged && opts.triggersOnPush?.(h.path ?? "") !== true) {
        delete h.headUnjudged;
      }
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

  // A workflow whose newest run has not settled is reported by name, above the
  // summary, because the summary is the line a reader takes away. Saying
  // "every workflow is green" while a run is in flight over the commit they
  // are looking at is the exact sentence bean `gpuu` was opened for.
  const pending = health.filter((h) => h.newestUnsettled || h.headUnjudged);
  for (const h of pending) {
    // Two different silences, and the difference is what a reader acts on: a
    // run exists and has not finished (wait), or no run was ever created for
    // this commit (go and look at why).
    const why = h.headUnjudged
      ? "no run has judged the current head"
      : "newest run has not reported";
    lines.push(
      `- ⏳ **${h.workflow}** — ${why}; the ${h.health} below ` +
        `is the last settled verdict and may predate the current head.` +
        (h.latestUrl ? `\n      ${h.latestUrl}` : ""),
    );
  }

  const ok = health.filter((h) => h.health !== "red" && h.health !== "superseded");
  if (red.length === 0 && superseded.length === 0 && pending.length === 0) {
    lines.push(`✓ every workflow with a recent run on \`${opts.branch}\` is green (${ok.length}).`);
  } else if (red.length === 0 && superseded.length === 0) {
    lines.push(
      `_(no settled failures; ${pending.length} workflow(s) still reporting. ` +
        `Not "all green" — the head has not been judged.)_`,
    );
  } else if (red.length === 0) {
    // Not "all green" — that would be the lie this module exists to prevent.
    lines.push("", `_(no live failures; ${ok.length} workflow(s) green.)_`);
  } else {
    lines.push("", `_(${ok.length} other workflow(s) not failing.)_`);
  }
  lines.push("");
  return lines.join("\n");
}
