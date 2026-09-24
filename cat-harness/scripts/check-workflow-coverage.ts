#!/usr/bin/env bun
/**
 * Which GitHub Actions workflows are documented as BPMN, and which are not?
 *
 * @module scripts/check-workflow-coverage
 * @covers processes
 *
 * Owner, 2026-09-20: *"make sure all workflows documented as bpmn"* — bean
 * `7yvd`. `AGENTS.md` says every process here is BPMN and the diagrams are
 * executable. The `.github/workflows/*.yml` are processes by any reading —
 * triggers, gateways, parallel jobs, compensation paths — and they are the
 * ones whose behaviour a person most often has to reconstruct from comments.
 *
 * ## A diagram DECLARES its subject; nothing is inferred from a name
 *
 * `<folio:implements workflow=".github/workflows/x.yml"/>` on the process.
 * Matching on filename would be the `directory-conventions` mistake one level
 * out: `upstream-pin-watch.bpmn` and `upstream-pins.yml` do not share a
 * basename, and five diagrams MENTION a workflow file while documenting an
 * agent process that merely touches one. A mention is not coverage, and the
 * only thing that can tell them apart is a declaration inside the file.
 *
 * ## Coverage is not enough — a diagram that DRIFTS is worse than none
 *
 * The bean is explicit: *"a diagram that is drawn once and then drifts is
 * worse than none, because it is consulted."* Answering "is there a diagram"
 * does not answer "does it still match", and until 2026-09-20 nothing here
 * did. `feature-staging.bpmn` made that concrete — three start events for the
 * workflow's three jobs, and **nothing in the file saying which node was
 * which job**. Add a fourth job and every check stayed green.
 *
 * So a node that stands for a job DECLARES it:
 * `<folio:job name="stage"/>`, and the two sets are compared in **both**
 * directions. A job with no node is a diagram that has gone stale; a node
 * naming a job the YAML does not have is one that was stale already. Neither
 * is inferred from a label — same reason `<folio:implements>` is not inferred
 * from a filename.
 *
 * Declaring is OPT-IN per diagram: a covered workflow whose diagram names no
 * job at all is reported as undeclared rather than as fully drifted, because
 * "nobody has said yet" and "said, and wrong" are different answers and the
 * first is not a finding. What is never allowed is a diagram declaring SOME
 * of a workflow's jobs and being read as complete.
 *
 * ## Three states, and the third is why this exists
 *
 * - **covered** — a diagram declares this workflow.
 * - **uncovered** — no diagram declares it. A determined absence.
 * - **unknown** — the workflow could not be PARSED, so neither its triggers
 *   nor its shape can be read; or a diagram declares a workflow that is not
 *   there. Never rendered as covered, and it is what `--strict` fails on
 *   first, because a sweep blind on one file has not cleared the others.
 *
 * Same rule as `ci-health.md`: could-not-determine is never rendered as clean.
 *
 * ## Why the trigger class is part of the report
 *
 * Measured 2026-09-20: of 38 workflows here, **8 auto-trigger** and 30 are
 * `workflow_dispatch`- or `workflow_call`-only. A dispatch-only workflow and a
 * scheduled one are different processes, and treating all 38 as one backlog
 * would bury the eight that actually run on their own. So coverage is reported
 * per class, and `--auto` narrows the gate to the ones that fire without
 * somebody pressing a button.
 *
 * `--strict` has NO package.json alias on purpose. A named script nothing
 * runs is the defect bean `ot9a` records — `translate-kg-viewer:check` was red
 * on `main` while CI was green, because nothing ran it — and `gates.test.ts`
 * now fails on exactly that. An alias for a flag combination that no workflow
 * uses yet is aspiration, not a check, and it is not what `SCRIPT_EXEMPTIONS`
 * is for. Whoever wires the strict gate when coverage reaches zero adds the
 * script and the workflow step in the same change.
 *
 * Usage:  bun run check:workflow-coverage [--auto] [--strict]
 * Exit:   0 clean · 1 a declaration names a workflow that is not there
 *         2 a workflow could not be read — COULD NOT DETERMINE
 *         With `--strict`, an uncovered workflow is also exit 1.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

import { workflowFiles } from "./known-skills.js";
import { repoRootFor } from "../schemas/cat-harness.js";
import { ownElementPattern } from "../schemas/namespaces.js";

const HERE = resolve(import.meta.dir, "..");
const REPO = repoRootFor(HERE);

/**
 * Triggers that fire WITHOUT a person pressing a button.
 *
 * `workflow_dispatch` and `workflow_call` are deliberately absent: the first
 * needs somebody to ask, and the second needs another workflow to call it, so
 * neither is a process that runs on its own schedule.
 */
const AUTO_TRIGGERS = new Set([
  "push",
  "pull_request",
  "pull_request_target",
  "schedule",
  "release",
  "issues",
  "issue_comment",
  "check_suite",
  "check_run",
  "repository_dispatch",
  "status",
  "deployment",
  "discussion",
  "milestone",
  "label",
  "merge_group",
  "page_build",
  "registry_package",
  "watch",
]);

export type Coverage = "covered" | "uncovered" | "unknown";

export interface WorkflowRow {
  /** Repo-relative path, which is also what a declaration must spell. */
  path: string;
  /** Does it fire on its own? `undefined` when the file could not be read. */
  auto?: boolean;
  coverage: Coverage;
  /** Diagrams declaring this workflow, repo-relative. */
  diagrams: string[];
  /** Why, when `coverage` is `unknown`. */
  reason?: string;
  /**
   * How the diagram's declared jobs compare to the workflow's real ones.
   *
   * `undefined` when there is nothing to compare — an uncovered or unreadable
   * workflow. `declared: false` means covered but no diagram has said which
   * node is which job yet, which is not a finding.
   */
  jobs?: JobDrift;
}

export interface JobDrift {
  /** Has any diagram declared a job for this workflow? */
  declared: boolean;
  /** Jobs in the YAML that no node claims. */
  missing: string[];
  /** Jobs a node claims that the YAML does not have. */
  extra: string[];
  /** Jobs claimed by more than one node, with the count. */
  duplicated: string[];
}

/** Every `<folio:implements workflow="…"/>` in a diagram. */
export function declaredWorkflows(xml: string): string[] {
  const out: string[] = [];
  for (const m of xml.matchAll(ownElementPattern(xml, "implements", String.raw`[^>]*\bworkflow="([^"]+)"`))) {
    out.push(m[1]!);
  }
  return out;
}

/**
 * Every `<folio:job name="…"/>` in a diagram, with the node declaring it.
 *
 * Matched as an element BODY rather than by proximity: a self-closing node
 * has no body and so declares nothing, and a `folio:job` is attributed to the
 * element that actually contains it. Walking backwards to the nearest
 * preceding `id="…"` would attribute a job to whatever happened to be typed
 * above it, which is the kind of near-miss that reads correct in every
 * example somebody tries.
 */
export function declaredJobs(xml: string): { node: string; job: string }[] {
  const out: { node: string; job: string }[] = [];
  const pat = /<bpmn:([A-Za-z]+)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/bpmn:\1>/g;
  for (const m of xml.matchAll(pat)) {
    for (const j of m[3]!.matchAll(ownElementPattern(xml, "job", String.raw`[^>]*\bname="([^"]+)"`))) {
      out.push({ node: m[2]!, job: j[1]! });
    }
  }
  return out;
}

/**
 * The job names a workflow declares, or why they could not be read.
 *
 * A reason rather than an empty list, for the same reason `autoTriggered`
 * returns one: a workflow whose `jobs:` cannot be read has UNKNOWN jobs, and
 * an empty list would make every declared job look like an `extra` — turning
 * a parse failure into a wall of false findings pointing at the diagram.
 */
export function workflowJobs(yaml: string): string[] | { reason: string } {
  let doc: unknown;
  try {
    doc = Bun.YAML.parse(yaml);
  } catch (e) {
    return { reason: `YAML will not parse: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (doc === null || typeof doc !== "object") return { reason: "is not a YAML mapping" };
  const jobs = (doc as Record<string, unknown>)["jobs"];
  if (jobs === undefined) return { reason: "declares no `jobs:`" };
  if (typeof jobs !== "object" || jobs === null || Array.isArray(jobs)) {
    return { reason: "`jobs:` is not a mapping" };
  }
  return Object.keys(jobs);
}

/** Compare a workflow's real jobs against what its diagrams claim. */
export function compareJobs(real: string[], claimed: string[]): JobDrift {
  const realSet = new Set(real);
  const counts = new Map<string, number>();
  for (const c of claimed) counts.set(c, (counts.get(c) ?? 0) + 1);
  return {
    declared: claimed.length > 0,
    missing: real.filter((r) => !counts.has(r)).sort(),
    extra: [...counts.keys()].filter((c) => !realSet.has(c)).sort(),
    duplicated: [...counts.entries()].filter(([, n]) => n > 1).map(([c]) => c).sort(),
  };
}

/**
 * Does this workflow fire without somebody asking?
 *
 * A reason rather than a bare `false` when it cannot be told: a workflow whose
 * YAML will not parse has UNKNOWN triggers, and reporting that as
 * "dispatch-only" would quietly shrink the set this gate covers — which is the
 * `plj1` shape (a check reporting clean over what it could not see).
 */
export function autoTriggered(yaml: string): boolean | { reason: string } {
  let doc: unknown;
  try {
    doc = Bun.YAML.parse(yaml);
  } catch (e) {
    return { reason: `YAML will not parse: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (doc === null || typeof doc !== "object") return { reason: "is not a YAML mapping" };
  // Both keys, because `on` is a YAML 1.1 boolean. VERIFIED rather than
  // assumed: `Bun.YAML.parse` returns the STRING key `"on"` today, so the
  // first lookup is the one that fires here. The `true` fallback is for a
  // parser that follows YAML 1.1 literally — a reader that checked only one
  // spelling and met the other would find no triggers and quietly call every
  // workflow dispatch-only, which is a gate shrinking itself in silence.
  const rec = doc as Record<string, unknown>;
  const on = rec["on"] ?? rec["true"] ?? (rec as Record<string, unknown>)[String(true)];
  if (on === undefined) return { reason: "declares no `on:` triggers" };
  const names =
    typeof on === "string"
      ? [on]
      : Array.isArray(on)
        ? on.map(String)
        : typeof on === "object" && on !== null
          ? Object.keys(on)
          : [];
  if (names.length === 0) return { reason: "`on:` is empty, so no trigger can be read" };
  return names.some((n) => AUTO_TRIGGERS.has(n));
}

/**
 * Every workflow file, with its coverage.
 *
 * TWO ROOTS, and conflating them was a real defect here rather than a
 * hypothetical one. `.github/workflows/` sits at the REPOSITORY root, while
 * the diagrams live in the graph an INSTANCE declares — `cat-harness/` in this
 * checkout. A first version passed `repoRootFor(...)` to both and found no
 * diagrams at all, so it reported 0/38 while a declaration was sitting on
 * disk. The unit tests could not catch it: their scratch repository puts both
 * at the same path, which is exactly the case where the bug is invisible.
 *
 * @param repo the repository root, holding `.github/workflows/`
 * @param instance the instance root whose declared graph holds the diagrams
 */
export function surveyWorkflows(repo: string = REPO, instance: string = HERE): {
  rows: WorkflowRow[];
  /** Declarations pointing at a workflow that is not there. */
  dangling: { diagram: string; workflow: string }[];
} {
  const dir = join(repo, ".github", "workflows");
  const files = existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
        .sort()
    : [];

  // diagram -> declared workflows, and the inverse.
  const byWorkflow = new Map<string, string[]>();
  // The jobs each diagram claims. A diagram declares ONE workflow in practice,
  // so its jobs are attributed to every workflow it implements — which is the
  // only reading that does not invent a second declaration syntax for a case
  // nobody has.
  const jobsByWorkflow = new Map<string, string[]>();
  const dangling: { diagram: string; workflow: string }[] = [];
  for (const d of workflowFiles(instance).filter((f) => f.endsWith(".bpmn"))) {
    const rel = relative(repo, d);
    const xml = readFileSync(d, "utf-8");
    const claimed = declaredJobs(xml).map((j) => j.job);
    for (const w of declaredWorkflows(xml)) {
      if (!existsSync(join(repo, w))) {
        // Unambiguous, and it breaks a reader who follows it — the same tier
        // `check-workflow-refs.ts` puts a dangling `<folio:skill ref>` in.
        dangling.push({ diagram: rel, workflow: w });
        continue;
      }
      byWorkflow.set(w, [...(byWorkflow.get(w) ?? []), rel]);
      jobsByWorkflow.set(w, [...(jobsByWorkflow.get(w) ?? []), ...claimed]);
    }
  }

  const rows: WorkflowRow[] = files.map((f) => {
    const rel = `.github/workflows/${f}`;
    const diagrams = (byWorkflow.get(rel) ?? []).sort();
    let auto: boolean | undefined;
    let reason: string | undefined;
    let jobs: JobDrift | undefined;
    try {
      const yaml = readFileSync(join(dir, f), "utf-8");
      const r = autoTriggered(yaml);
      if (typeof r === "boolean") auto = r;
      else reason = r.reason;
      if (reason === undefined && diagrams.length > 0) {
        const real = workflowJobs(yaml);
        // A workflow whose `jobs:` cannot be read is UNKNOWN, not drift-free.
        // Leaving `jobs` undefined here would report a covered workflow as
        // having nothing to say about its jobs, which is the pass-shaped
        // blindness this whole file is against; `reason` moves it to unknown.
        if (Array.isArray(real)) jobs = compareJobs(real, jobsByWorkflow.get(rel) ?? []);
        else reason = real.reason;
      }
    } catch (e) {
      reason = `could not be read: ${e instanceof Error ? e.message : String(e)}`;
    }
    // A workflow this tool cannot read is `unknown` EVEN IF a diagram declares
    // it: the declaration says a diagram exists, not that it still matches a
    // file nobody could parse.
    const coverage: Coverage =
      reason !== undefined ? "unknown" : diagrams.length > 0 ? "covered" : "uncovered";
    return {
      path: rel,
      auto,
      coverage,
      diagrams,
      ...(reason ? { reason } : {}),
      ...(coverage === "covered" && jobs ? { jobs } : {}),
    };
  });

  return { rows, dangling };
}

if (import.meta.main) {
  const onlyAuto = process.argv.includes("--auto");
  const strict = process.argv.includes("--strict");
  const { rows, dangling } = surveyWorkflows();

  const considered = onlyAuto ? rows.filter((r) => r.auto === true || r.coverage === "unknown") : rows;
  const auto = rows.filter((r) => r.auto === true);
  const manual = rows.filter((r) => r.auto === false);
  const unknown = rows.filter((r) => r.coverage === "unknown");

  console.log(
    `Workflow BPMN coverage — ${rows.length} workflow(s): ` +
      `${auto.length} auto-triggering, ${manual.length} dispatch/call-only, ${unknown.length} unreadable\n`,
  );

  const show = (label: string, set: WorkflowRow[]): void => {
    if (set.length === 0) return;
    console.log(label);
    for (const r of set) {
      const mark = r.coverage === "covered" ? "✓" : r.coverage === "unknown" ? "?" : "·";
      const drift = r.jobs
        ? r.jobs.declared
          ? r.jobs.missing.length + r.jobs.extra.length + r.jobs.duplicated.length > 0
            ? "  ✗ DRIFTED"
            : "  (jobs match)"
          : "  (no job declared)"
        : "";
      const note =
        r.coverage === "covered"
          ? r.diagrams.map((d) => basename(d)).join(", ") + drift
          : r.coverage === "unknown"
            ? `COULD NOT DETERMINE — ${r.reason}`
            : "";
      console.log(`  ${mark} ${basename(r.path).padEnd(34)} ${note}`);
    }
    console.log("");
  };

  show("Auto-triggering — these run on their own:", considered.filter((r) => r.auto === true));
  if (!onlyAuto) show("Dispatch- or call-only:", manual);
  show("Unreadable:", unknown);

  const gap = considered.filter((r) => r.coverage === "uncovered");
  const coveredN = considered.filter((r) => r.coverage === "covered").length;
  console.log(
    `${coveredN}/${considered.length} documented${onlyAuto ? " (auto-triggering only)" : ""}, ` +
      `${gap.length} not, ${unknown.length} could not be determined.`,
  );

  // A diagram that declares SOME of a workflow's jobs and is read as complete
  // is the failure the bean names: it is consulted, and it is wrong. A
  // diagram that has declared NOTHING yet is not a finding — nobody has said
  // anything to be wrong about.
  const drifted = rows.filter(
    (r) =>
      r.jobs?.declared &&
      r.jobs.missing.length + r.jobs.extra.length + r.jobs.duplicated.length > 0,
  );
  const undeclared = rows.filter((r) => r.jobs && !r.jobs.declared);
  if (undeclared.length > 0) {
    console.log(
      `${undeclared.length} documented workflow(s) declare no job, so their diagrams are\n` +
        `not checked for drift. That is a gap, not a finding: nothing has been claimed.\n`,
    );
  }

  if (dangling.length > 0) {
    console.error("\n✗ DECLARED BUT ABSENT — a diagram documents a workflow that is not there:");
    for (const d of dangling) console.error(`    ${d.diagram} → ${d.workflow}`);
  }
  if (drifted.length > 0) {
    console.error("\n✗ DRIFTED — the diagram no longer matches the workflow it documents:");
    for (const r of drifted) {
      console.error(`    ${r.path}  (${r.diagrams.join(", ")})`);
      const j = r.jobs!;
      if (j.missing.length) console.error(`      job(s) with no node: ${j.missing.join(", ")}`);
      if (j.extra.length) console.error(`      node(s) naming a job the workflow does not have: ${j.extra.join(", ")}`);
      if (j.duplicated.length) console.error(`      job(s) claimed by more than one node: ${j.duplicated.join(", ")}`);
    }
    console.error(
      "\n  A diagram that is drawn once and then drifts is worse than none, because\n" +
        "  it is consulted. Update the diagram, or the `<folio:job>` that names the job.",
    );
  }
  if (unknown.length > 0) {
    console.error(
      "\n✗ A workflow could not be read. That is not the same as uncovered, and a\n" +
        "  sweep blind on one file has not cleared the others.",
    );
  }

  // Order matters: an unreadable file outranks a coverage gap, because it is
  // the state that can hide one.
  if (unknown.length > 0) process.exit(2);
  // Drift and dangling are the same tier: both are a diagram that misleads a
  // reader who follows it, and neither waits on `--strict`.
  if (dangling.length > 0 || drifted.length > 0) process.exit(1);
  if (strict && gap.length > 0) {
    console.error(`\n✗ ${gap.length} workflow(s) carry no diagram. Run without --strict to report only.`);
    process.exit(1);
  }
  process.exit(0);
}
