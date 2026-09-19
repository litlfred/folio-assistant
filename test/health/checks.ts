/**
 * The repository health checks — the registry, and the pure verdict logic.
 *
 * ## What this module is, and what it deliberately is not
 *
 * Every function here is **pure**: it is handed already-gathered evidence and
 * returns a {@link HealthCheckResult}. Nothing here runs `git`, touches the
 * network or reads a file. The gathering lives in `./probes.ts`, behind
 * {@link HealthContext}.
 *
 * That split is not tidiness. **A checker that returns `[]` for everything
 * passes a corpus test**: run it against a healthy repository and a function
 * that does nothing is indistinguishable from one that works. The only way to
 * know a check can fire is to hand it evidence that should make it fire — and
 * that is only possible if the evidence is a parameter. `checks.test.ts` does
 * exactly that, once per check, per threshold.
 *
 * ## Three states, everywhere
 *
 * A probe returns `ok` with a value, or `unknown` with a reason. A check
 * given an `unknown` probe returns `unknown` and says what it could not
 * determine. **"Could not read `gh-pages`" is never "0 MB of previews"** — the
 * rule `restore-staging.ts` was written for, applied one layer up. A determined
 * empty (the branch was read and carries no previews) is a real `ok`, and is
 * said differently.
 *
 * ## Every threshold carries its basis
 *
 * {@link HealthThreshold} requires `basis` structurally, so a check cannot ship
 * a bare constant. Where no external standard exists the basis says so and
 * gives the measurement it was calibrated against, with its date. A stated
 * arbitrary number is honest; an unstated one implies a rigour it does not have.
 *
 * ## Nothing here deletes anything
 *
 * Every `action` on every finding names something a **person** does. Several
 * of these checks are about artefacts accumulating, and the reflex is to have
 * the sweep tidy up. It must not: see
 * `skills/folio-core/deletion-requires-confirmation.md`, and bean `plj1` for
 * what a workflow that tidies up on its own initiative actually costs.
 *
 * @module test/health/checks
 */

import type {
  HealthCheckResult,
  HealthFinding,
  HealthMeasurement,
  HealthThreshold,
} from "../../schemas/health-report.ts";

// ── Evidence ────────────────────────────────────────────────────

/** A gathered fact, or the reason it could not be gathered. Never both, never neither. */
export type Probe<T> = { state: "ok"; value: T } | { state: "unknown"; reason: string };

/** One preview directory on the publish branch. */
export interface StagingPreview {
  /** The directory name under `STAGING/` — the sanitised branch slug. */
  slug: string;
  bytes: number;
  files: number;
}

export interface StagingEvidence {
  /**
   * Whether the publish branch exists at all.
   *
   * `absent` is a **determined** answer — a repository whose first deploy has
   * not happened has no previews, and saying so is correct. It is reached only
   * via `git ls-remote --exit-code`, whose exit 2 means "asked, and there is no
   * such ref", as against any other non-zero meaning "could not ask". Collapsing
   * those two is the whole of bean `plj1` in miniature.
   */
  branch: "present" | "absent";
  previews: StagingPreview[];
  /** Where they were read from, for the report's `command` fields. */
  command: string;
}

export interface RepoSizeEvidence {
  /** This clone's `.git`, on disk. Includes local gc state — see the check. */
  gitDirBytes: number;
  /** The sum of blob sizes at HEAD: the repository's CONTENT, gc-independent. */
  trackedBytes: number;
  packs: number;
  packBytes: number;
}

export interface BeanEvidence {
  id: string;
  title: string;
  status: string;
  /** ISO 8601, or `undefined` when the front matter carries none. */
  updatedAt?: string;
}

export interface TodoEvidence {
  id: string;
  status: string;
  /** ISO 8601 date, or `undefined` when the front matter carries none. */
  createdAt?: string;
}

/**
 * Everything the checks are allowed to see.
 *
 * A record of probes rather than a set of methods, so a fixture is a literal.
 */
export interface HealthContext {
  now: Date;
  /** `owner/repo`, or the instance name when there is no GitHub remote. */
  subject: string;
  staging: Probe<StagingEvidence>;
  /** Head refs of the currently open pull requests — `claude/foo`, unsanitised. */
  openPrHeads: Probe<string[]>;
  repoSize: Probe<RepoSizeEvidence>;
  beans: Probe<BeanEvidence[]>;
  todos: Probe<TodoEvidence[]>;
}

// ── Helpers ─────────────────────────────────────────────────────

const MB = 1024 * 1024;

export function formatBytes(n: number): string {
  if (n >= 1024 * MB) return `${(n / (1024 * MB)).toFixed(2)} GB`;
  if (n >= MB) return `${(n / MB).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${n} B`;
}

/**
 * Slugify a branch name the way `feature-staging.yml` does.
 *
 * Copied from that workflow's `Determine staging slug` step, 2026-09-19:
 * `sed 's|[^a-zA-Z0-9._-]|-|g' | sed 's|--*|-|g' | sed 's|^-||;s|-$||'`.
 *
 * **Forward only, deliberately.** The orphan check slugifies the open PRs'
 * heads and compares against the directory names; it never tries to recover a
 * branch name from a slug. That direction is ambiguous — `claude/a-b` and
 * `claude-a-b` produce the same slug — and an ambiguous inverse would let the
 * check name the wrong PR, which on a finding whose action is "consider
 * removing this" is the worst available failure.
 */
export function stagingSlug(branch: string): string {
  return branch
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** Build an `unknown` result for a check whose evidence did not arrive. */
function unknownResult(
  id: string,
  summary: string,
  thresholds: HealthThreshold[],
  reason: string,
): HealthCheckResult {
  return { id, state: "unknown", summary, thresholds, measurements: [], findings: [], reason };
}

function settle(
  id: string,
  summary: string,
  thresholds: HealthThreshold[],
  measurements: HealthMeasurement[],
  findings: HealthFinding[],
): HealthCheckResult {
  return {
    id,
    state: findings.length > 0 ? "finding" : "ok",
    summary,
    thresholds,
    measurements,
    findings,
  };
}

function daysBetween(later: Date, iso: string | undefined): number | undefined {
  if (iso === undefined) return undefined;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return undefined;
  return Math.floor((later.getTime() - t) / 86_400_000);
}

// ── Thresholds ──────────────────────────────────────────────────

/**
 * The owner's number, 2026-09-19: *"issue warning to user when exceeds >
 * 100mb"*.
 *
 * It is not arbitrary even though it was given as a round one. GitHub
 * documents a hard limit of **1 GB for a published Pages site**, and the
 * previews share that budget with the main site, so 100 MB is a tenth of the
 * ceiling — an early-warning point that leaves room to act. Measured against
 * this repository on 2026-09-19, a single preview is 36.7–37.6 MB, so the
 * third concurrent review breaches it.
 */
export const STAGING_WARN_BYTES = 100 * MB;

/**
 * Three-quarters of the documented Pages ceiling.
 *
 * At this point the previews alone occupy most of the budget the main site
 * also has to fit inside, and the next deploy is the one that fails outright.
 * `critical` rather than `major` because something is about to be LOST: a
 * Pages build that exceeds the limit does not publish, so the site stops
 * updating.
 */
export const STAGING_CRITICAL_BYTES = 750 * MB;

/** See {@link repositorySizeCheck} for the basis of each of these. */
export const TRACKED_WARN_BYTES = 250 * MB;
export const TRACKED_MAJOR_BYTES = 1024 * MB;
export const GIT_DIR_RATIO = 8;
export const GIT_DIR_FLOOR_BYTES = 100 * MB;

/** See {@link beanStoreCheck}. */
export const BEAN_STALE_DAYS = 14;
export const BEAN_RESOLVED_INLINE_LIMIT = 100;
export const BEAN_OPEN_LIMIT = 150;

/** See {@link todoStoreCheck}. */
export const TODO_OPEN_LIMIT = 25;
export const TODO_STALE_DAYS = 90;

// ── The checks ──────────────────────────────────────────────────

const STAGING_SIZE_THRESHOLDS: HealthThreshold[] = [
  {
    metric: "staging-total-bytes",
    value: STAGING_WARN_BYTES,
    unit: "bytes",
    severity: "major",
    basis:
      "The owner's explicit instruction, 2026-09-19 (\"issue warning to user when exceeds > 100mb\"). " +
      "It is also a tenth of GitHub's documented 1 GB limit for a published Pages site, which the " +
      "previews share with the main site — an early-warning point that leaves room to act rather " +
      "than a limit in itself. One preview measured 36.7–37.6 MB on 2026-09-19, so the third " +
      "concurrent review breaches it.",
  },
  {
    metric: "staging-total-bytes",
    value: STAGING_CRITICAL_BYTES,
    unit: "bytes",
    severity: "critical",
    basis:
      "Three-quarters of GitHub's documented 1 GB Pages limit. Past here the previews occupy most " +
      "of the budget the main site must also fit inside, and the next deploy is the one that fails " +
      "to publish — so something is about to be lost, which is what `critical` means on this scale.",
  },
];

/**
 * How much of the publish branch the review previews occupy.
 *
 * **This is a growth curve for the first time.** Until #377, `docs-site.yml`
 * deleted every preview on every push to `main` (bean `plj1`), so the total
 * never accumulated — it was garbage-collected by accident, against
 * `feature-staging.yml`'s written retention policy, and nobody had decided
 * that. Fixing it is what makes a size check necessary: previews now persist
 * until somebody explicitly asks for one to go.
 */
export function stagingSizeCheck(ctx: HealthContext): HealthCheckResult {
  const id = "staging-preview-size";
  const summary =
    "The review previews under `STAGING/` on the publish branch have grown past what a " +
    "GitHub Pages site can carry alongside the main site.";
  if (ctx.staging.state === "unknown") {
    return unknownResult(id, summary, STAGING_SIZE_THRESHOLDS, ctx.staging.reason);
  }
  const ev = ctx.staging.value;
  const total = ev.previews.reduce((s, p) => s + p.bytes, 0);
  const measurements: HealthMeasurement[] = [
    { metric: "staging-total-bytes", value: total, unit: "bytes", command: ev.command },
    { metric: "staging-preview-count", value: ev.previews.length, unit: "count", command: ev.command },
  ];
  const findings: HealthFinding[] = [];

  // Deliberately ordered critical-first and `else`-chained: one breach, not
  // two. A total over 750 MB is also over 100 MB, and reporting both would
  // make the count of findings a function of how many thresholds happen to be
  // declared rather than of what is wrong.
  if (total > STAGING_CRITICAL_BYTES) {
    findings.push({
      metric: "staging-total-bytes",
      severity: "critical",
      summary:
        `${ev.previews.length} staging preview(s) total ${formatBytes(total)}, past three-quarters ` +
        `of GitHub's 1 GB Pages limit — the main site shares that budget.`,
      action:
        "Ask which previews are still under review, then have the owner add `staging:cleanup` to the " +
        "PRs whose previews are finished with. Do not remove any preview without that label.",
    });
  } else if (total > STAGING_WARN_BYTES) {
    findings.push({
      metric: "staging-total-bytes",
      severity: "major",
      summary: `${ev.previews.length} staging preview(s) total ${formatBytes(total)}, over the 100 MB warning point.`,
      action:
        "Report the list below to the owner and ask which are finished with. Removal is by adding " +
        "`staging:cleanup` to that PR — never by this sweep, and never on an agent's own initiative.",
    });
  }
  return settle(id, summary, STAGING_SIZE_THRESHOLDS, measurements, findings);
}

/**
 * A preview whose pull request is no longer open.
 *
 * `minor`, and the severity is the argument. A retained preview is
 * `feature-staging.yml`'s **policy working as written**: it removes one on PR
 * close only with a `staging:cleanup` label, and otherwise posts "Staging
 * preview retained … so reviewers can continue comparing". So this is not a
 * defect report. It is the list somebody needs in order to make the decision
 * the policy reserves for them, and it is the only place the size curve above
 * can actually be bent.
 */
export function stagingOrphanCheck(ctx: HealthContext): HealthCheckResult {
  const id = "staging-preview-orphans";
  const summary =
    "A `STAGING/` preview whose pull request is no longer open. Retained by policy, not by mistake — " +
    "this is the list a person needs in order to decide, never a list to act on unasked.";
  // No thresholds: this is a reference that resolves to nothing, not a
  // quantity. A threshold of "more than zero" would be a number pretending to
  // be a judgement.
  const thresholds: HealthThreshold[] = [];
  if (ctx.staging.state === "unknown") return unknownResult(id, summary, thresholds, ctx.staging.reason);
  if (ctx.openPrHeads.state === "unknown") {
    return unknownResult(
      id,
      summary,
      thresholds,
      `the previews were read, but the open pull requests were not: ${ctx.openPrHeads.reason}. ` +
        "Without them every preview looks orphaned, which is the one false positive this check must never produce.",
    );
  }
  const ev = ctx.staging.value;
  const open = new Set(ctx.openPrHeads.value.map(stagingSlug));
  const orphans = ev.previews.filter((p) => !open.has(p.slug));
  const measurements: HealthMeasurement[] = [
    { metric: "staging-orphan-count", value: orphans.length, unit: "count", command: ev.command },
    {
      metric: "staging-orphan-bytes",
      value: orphans.reduce((s, p) => s + p.bytes, 0),
      unit: "bytes",
      command: ev.command,
    },
  ];
  // Named, not counted: a reader acts on a slug, never on a number.
  const findings: HealthFinding[] = orphans.map((p) => ({
    severity: "minor" as const,
    summary: `\`STAGING/${p.slug}\` (${formatBytes(p.bytes)}, ${p.files} files) matches no open pull request.`,
    action:
      `Ask the owner whether the review of \`${p.slug}\` is finished. If it is, they add \`staging:cleanup\` ` +
      "to that PR and re-run `feature-staging.yml`. Leaving it is a valid answer.",
  }));
  return settle(id, summary, thresholds, measurements, findings);
}

const REPO_SIZE_THRESHOLDS: HealthThreshold[] = [
  {
    metric: "tracked-tree-bytes",
    value: TRACKED_WARN_BYTES,
    unit: "bytes",
    severity: "minor",
    basis:
      "A quarter of the 1 GB that GitHub's own documentation recommends a repository stay under " +
      "(\"ideally less than 1 GB\"). Chosen as an early-warning point that leaves time to act before " +
      "the documented recommendation, NOT as a limit in itself.",
  },
  {
    metric: "tracked-tree-bytes",
    value: TRACKED_MAJOR_BYTES,
    unit: "bytes",
    severity: "major",
    basis: "GitHub's documented recommendation that a repository remain under 1 GB.",
  },
  {
    metric: "git-dir-to-tree-ratio",
    value: GIT_DIR_RATIO,
    unit: "ratio",
    severity: "minor",
    basis:
      "NO EXTERNAL STANDARD EXISTS for this ratio and this number is calibrated on this repository, " +
      "which measured 12.0x on 2026-09-19 (`.git` 349 MB against 29 MB of blobs at HEAD). It is " +
      "worth measuring because `ci-health.yml` documents `fetch-depth: 0` as load-bearing here, so " +
      "every CI job and every agent container downloads the PACK, not the tree — at 8x, seven " +
      "eighths of that download is content no longer present anywhere in the checkout.",
  },
  {
    metric: "git-dir-bytes",
    value: GIT_DIR_FLOOR_BYTES,
    unit: "bytes",
    severity: "minor",
    basis:
      "A floor on the ratio above, not a limit of its own: a 2 MB clone with a 0.16 MB tree is " +
      "12x and means nothing. Both must be exceeded before the ratio is reported.",
  },
];

/**
 * How big the repository is, measured two ways that answer different questions.
 *
 * **`tracked-tree-bytes` is the content** — the sum of blob sizes at `HEAD`. It
 * is independent of how recently anyone ran `git gc`, so it is the number to
 * compare against an external recommendation.
 *
 * **`git-dir-bytes` is what a clone costs**, and it is partly a measurement of
 * THIS clone's housekeeping: 42 packs and 857 prune-packable objects were
 * measured here on 2026-09-19, and a `git gc` moves the number without a single
 * byte of history changing. The finding says so, because a check that reported
 * "your repository is large" when the answer is "run `git gc`" would send the
 * reader after the wrong thing.
 */
export function repositorySizeCheck(ctx: HealthContext): HealthCheckResult {
  const id = "repository-size";
  const summary =
    "The repository's tracked content, and what a full-history clone of it costs. " +
    "Two different questions, reported separately.";
  if (ctx.repoSize.state === "unknown") return unknownResult(id, summary, REPO_SIZE_THRESHOLDS, ctx.repoSize.reason);
  const ev = ctx.repoSize.value;
  const ratio = ev.trackedBytes > 0 ? ev.gitDirBytes / ev.trackedBytes : 0;
  const measurements: HealthMeasurement[] = [
    {
      metric: "tracked-tree-bytes",
      value: ev.trackedBytes,
      unit: "bytes",
      command: "git ls-tree -r -l HEAD (blob sizes summed)",
    },
    { metric: "git-dir-bytes", value: ev.gitDirBytes, unit: "bytes", command: "du -sb .git" },
    { metric: "pack-bytes", value: ev.packBytes, unit: "bytes", command: "git count-objects -v" },
    { metric: "pack-count", value: ev.packs, unit: "count", command: "git count-objects -v" },
    {
      metric: "git-dir-to-tree-ratio",
      value: Number(ratio.toFixed(2)),
      unit: "ratio",
      command: "git-dir-bytes / tracked-tree-bytes",
    },
  ];
  const findings: HealthFinding[] = [];
  if (ev.trackedBytes > TRACKED_MAJOR_BYTES) {
    findings.push({
      metric: "tracked-tree-bytes",
      severity: "major",
      summary: `Tracked content at HEAD is ${formatBytes(ev.trackedBytes)}, past GitHub's recommended 1 GB.`,
      action:
        "Find the largest tracked blobs (`git ls-tree -r -l HEAD | sort -k4 -rn | head`) and decide, WITH the " +
        "owner, whether any belong in release assets or an LFS store instead. Nothing is removed by this sweep.",
    });
  } else if (ev.trackedBytes > TRACKED_WARN_BYTES) {
    findings.push({
      metric: "tracked-tree-bytes",
      severity: "minor",
      summary: `Tracked content at HEAD is ${formatBytes(ev.trackedBytes)}, past the 250 MB early-warning point.`,
      action:
        "Note it and re-measure next sweep. No action is due until it approaches 1 GB; this exists so the " +
        "approach is visible rather than sudden.",
    });
  }
  if (ratio > GIT_DIR_RATIO && ev.gitDirBytes >= GIT_DIR_FLOOR_BYTES) {
    findings.push({
      metric: "git-dir-to-tree-ratio",
      severity: "minor",
      summary:
        `\`.git\` is ${formatBytes(ev.gitDirBytes)} against ${formatBytes(ev.trackedBytes)} of tracked ` +
        `content — ${ratio.toFixed(1)}x, in ${ev.packs} pack(s).`,
      action:
        "Run `git gc` in this clone FIRST and re-measure: a high pack count is local housekeeping, not " +
        "repository history, and moves the number without anything changing upstream. If the ratio survives a " +
        "gc, the history carries large objects no longer in the tree, and what to do about that is the owner's " +
        "call — a history rewrite is not something a sweep proposes on its own.",
    });
  }
  return settle(id, summary, REPO_SIZE_THRESHOLDS, measurements, findings);
}

/** Bean statuses that mean the item is still live. */
const OPEN_BEAN_STATUSES = new Set(["todo", "in-progress", "in_progress", "blocked"]);
/** Bean statuses that mean it is finished with — and so archivable, never deletable. */
const RESOLVED_BEAN_STATUSES = new Set(["completed", "done", "scrapped"]);

const BEAN_THRESHOLDS: HealthThreshold[] = [
  {
    metric: "bean-duplicate-title-groups",
    value: 0,
    unit: "count",
    severity: "major",
    basis:
      "Zero, and the zero is the point. `beans create` is not idempotent and dedupes on nothing " +
      "(AGENTS.md); an unguarded re-run in the `qou` folio on 2026-08-04 produced 14,688 duplicates — " +
      "92% of every open bean — which starved the idle-backlog policy of signal and collided with 15 " +
      "real ids. Any duplicate at all is the leading edge of that, so there is no tolerance band.",
  },
  {
    metric: "bean-stale-in-progress",
    value: BEAN_STALE_DAYS,
    unit: "days",
    severity: "minor",
    basis:
      "NO EXTERNAL STANDARD; calibrated here. A claimed bean is a claim a sibling session is expected " +
      "to respect, and `skills/folio-core/bean-blocking.md` says a block with no expiry cannot be told " +
      "from abandoned work. Sessions are container-scoped and reclaimed, so a claim that has outlived " +
      "two weeks of containers is not one anybody is honouring. Measured 2026-09-19: 29 in-progress, " +
      "0 of them older than 14 days.",
  },
  {
    metric: "bean-resolved-inline",
    value: BEAN_RESOLVED_INLINE_LIMIT,
    unit: "count",
    severity: "minor",
    basis:
      "AGENTS.md already calls this repo's flat `beans list` \"100+ ids in creation order … data, not a " +
      "plan\". The `beans` CLI ships `beans archive` for exactly this, and archiving MOVES rather than " +
      "deletes, so it is the one tidy-up here that is not a deletion. Measured 2026-09-19: 182 resolved " +
      "beans still inline.",
  },
  {
    metric: "bean-open",
    value: BEAN_OPEN_LIMIT,
    unit: "count",
    severity: "minor",
    basis:
      "NO EXTERNAL STANDARD; calibrated against 81 open beans measured 2026-09-19. Roughly double that " +
      "is a backlog that has grown faster than it drains, which is a fact about the plan rather than " +
      "about any one bean.",
  },
];

/**
 * The state of the work plan as a store, rather than of any item in it.
 *
 * Four findings, and none of their actions is "delete". `beans archive` MOVES
 * resolved items; a bean that turned out not to be wanted is `scrapped`, which
 * records that it was considered and rejected. AGENTS.md: *"never delete ANY
 * bean, including your own"*.
 */
export function beanStoreCheck(ctx: HealthContext): HealthCheckResult {
  const id = "bean-store";
  const summary =
    "The work-plan store itself: duplicates, claims nobody is honouring, resolved items still inline, " +
    "and the size of the open backlog.";
  if (ctx.beans.state === "unknown") return unknownResult(id, summary, BEAN_THRESHOLDS, ctx.beans.reason);
  const beans = ctx.beans.value;

  const byTitle = new Map<string, BeanEvidence[]>();
  for (const b of beans) {
    const key = b.title.trim().toLowerCase();
    const bucket = byTitle.get(key);
    if (bucket) bucket.push(b);
    else byTitle.set(key, [b]);
  }
  const dupGroups = [...byTitle.values()].filter((g) => g.length > 1);
  const open = beans.filter((b) => OPEN_BEAN_STATUSES.has(b.status));
  const resolved = beans.filter((b) => RESOLVED_BEAN_STATUSES.has(b.status));
  const stale = beans
    .filter((b) => b.status === "in-progress" || b.status === "in_progress")
    .map((b) => ({ bean: b, age: daysBetween(ctx.now, b.updatedAt) }))
    .filter((x): x is { bean: BeanEvidence; age: number } => x.age !== undefined && x.age > BEAN_STALE_DAYS);

  const cmd = "beans/defs/*.md front matter";
  const measurements: HealthMeasurement[] = [
    { metric: "bean-total", value: beans.length, unit: "count", command: cmd },
    { metric: "bean-open", value: open.length, unit: "count", command: cmd },
    { metric: "bean-resolved-inline", value: resolved.length, unit: "count", command: cmd },
    { metric: "bean-duplicate-title-groups", value: dupGroups.length, unit: "count", command: cmd },
    { metric: "bean-stale-in-progress", value: stale.length, unit: "count", command: cmd },
  ];
  const findings: HealthFinding[] = [];
  for (const g of dupGroups) {
    findings.push({
      metric: "bean-duplicate-title-groups",
      severity: "major",
      summary: `${g.length} beans share the title "${g[0].title}": ${g.map((b) => b.id).join(", ")}.`,
      action:
        "Keep the earliest, and set each of the others to `scrapped` with a note naming the one that " +
        "survives. Never `beans delete` — a scrapped bean records a considered rejection, a deleted one " +
        "leaves a sibling unable to tell abandonment from accident.",
    });
  }
  for (const s of stale) {
    findings.push({
      metric: "bean-stale-in-progress",
      severity: "minor",
      summary: `\`${s.bean.id}\` has been \`in-progress\` for ${s.age} days ("${s.bean.title}").`,
      action:
        "Ask whoever claimed it whether it is still live. If nobody answers, move it back to `todo` with a " +
        "note saying the claim expired — do not resolve a sibling's bean, and do not delete it.",
    });
  }
  if (resolved.length > BEAN_RESOLVED_INLINE_LIMIT) {
    findings.push({
      metric: "bean-resolved-inline",
      severity: "minor",
      summary: `${resolved.length} completed or scrapped beans are still inline in \`beans/defs/\`.`,
      action:
        "Run `beans archive`, which MOVES them to the archive rather than removing them — the one tidy-up " +
        "in this sweep that is not a deletion. Confirm with the owner first all the same: it rewrites the " +
        "store a sibling session may be reading.",
    });
  }
  if (open.length > BEAN_OPEN_LIMIT) {
    findings.push({
      metric: "bean-open",
      severity: "minor",
      summary: `${open.length} open beans (todo + in-progress), past the ${BEAN_OPEN_LIMIT} calibration point.`,
      action:
        "Read `beans roadmap` rather than `beans list` and check the backlog still has a shape. This is a " +
        "fact about the plan, not about any one item.",
    });
  }
  return settle(id, summary, BEAN_THRESHOLDS, measurements, findings);
}

const CLOSED_TODO_STATUSES = new Set(["done", "completed", "closed", "scrapped", "resolved"]);

const TODO_THRESHOLDS: HealthThreshold[] = [
  {
    metric: "todo-open",
    value: TODO_OPEN_LIMIT,
    unit: "count",
    severity: "minor",
    basis:
      "NO EXTERNAL STANDARD; calibrated here. `todos/` holds a PERSON's outstanding items and the human-todos " +
      "page renders them as one list, so the limit is where a single list stops being readable at a glance. " +
      "Measured 2026-09-19: 3 open.",
  },
  {
    metric: "todo-stale-days",
    value: TODO_STALE_DAYS,
    unit: "days",
    severity: "minor",
    basis:
      "A quarter. A todo raised about content and untouched for three months is either already done or no " +
      "longer wanted; either way the status on the file is wrong, and a wrong status is worse than a long list.",
  },
];

/**
 * The human half of memory — `todos/`, as against the agent's `beans/`.
 *
 * Quiet on this repository today (3 open, 2026-09-19) and shipped anyway. **A
 * check that has never had anything to say is still the one that will notice**;
 * the alternative is adding it on the day it is already too late, which is the
 * whole of bean `xom7`.
 */
export function todoStoreCheck(ctx: HealthContext): HealthCheckResult {
  const id = "todo-store";
  const summary = "The human todo store: how many items are open, and whether any have gone stale.";
  if (ctx.todos.state === "unknown") return unknownResult(id, summary, TODO_THRESHOLDS, ctx.todos.reason);
  const todos = ctx.todos.value;
  const open = todos.filter((t) => !CLOSED_TODO_STATUSES.has(t.status));
  const stale = open
    .map((t) => ({ todo: t, age: daysBetween(ctx.now, t.createdAt) }))
    .filter((x): x is { todo: TodoEvidence; age: number } => x.age !== undefined && x.age > TODO_STALE_DAYS);

  const cmd = "todos/items/*.md front matter";
  const measurements: HealthMeasurement[] = [
    { metric: "todo-total", value: todos.length, unit: "count", command: cmd },
    { metric: "todo-open", value: open.length, unit: "count", command: cmd },
    { metric: "todo-stale-open", value: stale.length, unit: "count", command: cmd },
  ];
  const findings: HealthFinding[] = [];
  if (open.length > TODO_OPEN_LIMIT) {
    findings.push({
      metric: "todo-open",
      severity: "minor",
      summary: `${open.length} open todos, past the ${TODO_OPEN_LIMIT} calibration point.`,
      action: "Show the owner the list and ask which are still wanted. Nothing here is an agent's to close.",
    });
  }
  for (const s of stale) {
    findings.push({
      metric: "todo-stale-days",
      severity: "minor",
      summary: `\`${s.todo.id}\` has been open for ${s.age} days.`,
      action:
        "Ask the owner whether it is still wanted. A todo records a PERSON's outstanding work, so only they " +
        "can say it is finished — an agent may neither close nor remove one.",
    });
  }
  return settle(id, summary, TODO_THRESHOLDS, measurements, findings);
}

// ── The registry ────────────────────────────────────────────────

/**
 * One entry per check.
 *
 * **Adding a check is one entry here plus one fixture test.** The runner, the
 * report writer and the markdown renderer all read this array, so nothing else
 * needs touching — the same property `content/pipeline/readme-sections.ts` has
 * and for the same reason.
 *
 * Order is the order a reader should meet them: the owner's explicit ask
 * first, then what drives it, then the two stores.
 */
export const HEALTH_CHECKS: readonly {
  id: string;
  /** One line for `--list`. */
  summary: string;
  run: (ctx: HealthContext) => HealthCheckResult;
}[] = [
  {
    id: "staging-preview-size",
    summary: "Total size of the `STAGING/` review previews on the publish branch (owner's 100 MB warning).",
    run: stagingSizeCheck,
  },
  {
    id: "staging-preview-orphans",
    summary: "Previews whose pull request is no longer open — retained by policy, listed for a person to decide.",
    run: stagingOrphanCheck,
  },
  {
    id: "repository-size",
    summary: "Tracked content at HEAD, and what a full-history clone costs.",
    run: repositorySizeCheck,
  },
  {
    id: "bean-store",
    summary: "Duplicate titles, unhonoured claims, resolved items still inline, and the open backlog.",
    run: beanStoreCheck,
  },
  {
    id: "todo-store",
    summary: "Open and stale items in the human todo store.",
    run: todoStoreCheck,
  },
];

/** Run every registered check against one context. */
export function runHealthChecks(ctx: HealthContext): HealthCheckResult[] {
  return HEALTH_CHECKS.map((c) => c.run(ctx));
}
