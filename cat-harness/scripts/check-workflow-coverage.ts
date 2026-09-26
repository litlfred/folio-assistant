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
 * ## A workflow DECLARES its diagram; nothing is inferred from a name
 *
 * `# bpmn: cat-harness/processes/x.bpmn` at the top of the workflow
 * (`workflow-bpmn.ts`). Matching on filename would be the
 * `directory-conventions` mistake one level out: `upstream-pin-watch.bpmn`
 * and `upstream-pins.yml` do not share a basename, and five diagrams MENTION a
 * workflow file while documenting an agent process that merely touches one. A
 * mention is not coverage, and the only thing that can tell them apart is a
 * declaration inside a file.
 *
 * The declaration is on the WORKFLOW because the workflow depends on the
 * process it carries out: the dependent holds the pointer (data-modelling
 * step 8). It was `<cat-harness.processes:implements workflow>` on the diagram until bean
 * `61ca` — nine `arrow-direction` findings (#1168 B5).
 *
 * ## Coverage is not enough — a diagram that DRIFTS is worse than none
 *
 * The bean is explicit: *"a diagram that is drawn once and then drifts is
 * worse than none, because it is consulted."* Answering "is there a diagram"
 * does not answer "does it still match", and until 2026-09-20 nothing here
 * did. `feature-staging.bpmn` made that concrete — three start events for the
 * workflow's three jobs, and **nothing in either file saying which node was
 * which job**. Add a fourth job and every check stayed green.
 *
 * So a job that stands for a node DECLARES it — `# bpmn-node: Start_PR`
 * inside the job — and the two are compared in **both** directions. A job
 * with no node is a diagram that has gone stale; a node the diagram does not
 * have is one that was stale already. Neither is inferred from a label.
 *
 * Declaring is OPT-IN per workflow: a covered workflow none of whose jobs
 * names a node is reported as undeclared rather than as fully drifted,
 * because "nobody has said yet" and "said, and wrong" are different answers
 * and the first is not a finding. What is never allowed is SOME jobs naming a
 * node and the workflow being read as complete.
 *
 * ## Three states, and the third is why this exists
 *
 * - **covered** — the workflow names a diagram that exists.
 * - **uncovered** — it names none. A determined absence.
 * - **unknown** — the workflow could not be PARSED, so neither its triggers
 *   nor its shape can be read. A workflow naming a diagram that is not
 *   there is reported separately, as dangling. Never rendered as covered, and it is what `--strict` fails on
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
 * Exit:   0 clean · 1 a workflow names a diagram that is not there, or drifted
 *         2 a workflow could not be read — COULD NOT DETERMINE
 *         With `--strict`, an uncovered workflow is also exit 1.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { bpmnIds, workflowBpmn, workflowPaths } from "./workflow-bpmn.js";
import { repoRootFor } from "../schemas/cat-harness.js";

const REPO = repoRootFor(resolve(import.meta.dir, ".."));

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
  /** Repo-relative path. */
  path: string;
  /** Does it fire on its own? `undefined` when the file could not be read. */
  auto?: boolean;
  coverage: Coverage;
  /** Diagrams this workflow names that exist, repo-relative. */
  diagrams: string[];
  /** Why, when `coverage` is `unknown`. */
  reason?: string;
  /**
   * How the workflow's jobs compare to the nodes they name.
   *
   * `undefined` when there is nothing to compare — an uncovered or unreadable
   * workflow. `declared: false` means covered but no job has said which node
   * it is yet, which is not a finding.
   */
  jobs?: JobDrift;
}

export interface JobDrift {
  /** Has any job named its node? */
  declared: boolean;
  /** Jobs that name no node. */
  missing: string[];
  /** Nodes a job names that no diagram this workflow names has. */
  extra: string[];
  /** Jobs naming more than one node. */
  duplicated: string[];
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

/**
 * Compare a workflow's real jobs against the nodes they name.
 *
 * @param real the job names the YAML declares
 * @param claims each `# bpmn-node:` with its job
 * @param ids every element id in the diagrams the workflow names
 */
export function compareJobs(real: string[], claims: { job: string; node: string }[], ids: ReadonlySet<string>): JobDrift {
  const counts = new Map<string, number>();
  for (const c of claims) counts.set(c.job, (counts.get(c.job) ?? 0) + 1);
  return {
    declared: claims.length > 0,
    missing: real.filter((r) => !counts.has(r)).sort(),
    extra: [...new Set(claims.map((c) => c.node).filter((n) => !ids.has(n)))].sort(),
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
 * Diagram paths are REPOSITORY-relative, the one spelling `.github/workflows/`
 * can use for a diagram inside an instance (`cat-harness/processes/…`). When
 * the diagram carried the pointer this took two roots, and a first version
 * that passed the repository root for both found no diagrams at all.
 *
 * @param repo the repository root, holding `.github/workflows/`
 */
export function surveyWorkflows(repo: string = REPO): {
  rows: WorkflowRow[];
  /** Workflows naming a diagram that is not there. */
  dangling: { diagram: string; workflow: string }[];
} {
  const dangling: { diagram: string; workflow: string }[] = [];
  const rows: WorkflowRow[] = workflowPaths(repo).map((rel) => {
    let auto: boolean | undefined;
    let reason: string | undefined;
    let jobs: JobDrift | undefined;
    let diagrams: string[] = [];
    try {
      const yaml = readFileSync(join(repo, rel), "utf-8");
      const declared = workflowBpmn(yaml);
      for (const d of declared.diagrams) {
        if (existsSync(join(repo, d))) diagrams.push(d);
        // Unambiguous, and it breaks a reader who follows it — the same tier
        // `check-workflow-refs.ts` puts a dangling `<bootstrap.processes:skill ref>` in.
        else dangling.push({ diagram: d, workflow: rel });
      }
      diagrams = diagrams.sort();
      const r = autoTriggered(yaml);
      if (typeof r === "boolean") auto = r;
      else reason = r.reason;
      if (reason === undefined && diagrams.length > 0) {
        const real = workflowJobs(yaml);
        // A workflow whose `jobs:` cannot be read is UNKNOWN, not drift-free.
        // Leaving `jobs` undefined here would report a covered workflow as
        // having nothing to say about its jobs, which is the pass-shaped
        // blindness this whole file is against; `reason` moves it to unknown.
        if (Array.isArray(real)) {
          const ids = new Set(diagrams.flatMap((d) => [...bpmnIds(readFileSync(join(repo, d), "utf-8"))]));
          jobs = compareJobs(real, declared.nodes, ids);
        } else reason = real.reason;
      }
    } catch (e) {
      reason = `could not be read: ${e instanceof Error ? e.message : String(e)}`;
    }
    // A workflow this tool cannot read is `unknown` EVEN IF it names a
    // diagram: the declaration says a diagram exists, not that it still
    // matches a file nobody could parse.
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

  // A workflow whose jobs name SOME nodes and is read as complete is the
  // failure the bean names: its diagram is consulted, and it is wrong. One
  // that has named NOTHING yet is not a finding — nobody has said anything to
  // be wrong about.
  const drifted = rows.filter(
    (r) =>
      r.jobs?.declared &&
      r.jobs.missing.length + r.jobs.extra.length + r.jobs.duplicated.length > 0,
  );
  const undeclared = rows.filter((r) => r.jobs && !r.jobs.declared);
  if (undeclared.length > 0) {
    console.log(
      `${undeclared.length} documented workflow(s) name no node for any job, so their diagrams are\n` +
        `not checked for drift. That is a gap, not a finding: nothing has been claimed.\n`,
    );
  }

  if (dangling.length > 0) {
    console.error("\n✗ DECLARED BUT ABSENT — a workflow names a diagram that is not there:");
    for (const d of dangling) console.error(`    ${d.workflow} → ${d.diagram}`);
  }
  if (drifted.length > 0) {
    console.error("\n✗ DRIFTED — the diagram no longer matches the workflow it documents:");
    for (const r of drifted) {
      console.error(`    ${r.path}  (${r.diagrams.join(", ")})`);
      const j = r.jobs!;
      if (j.missing.length) console.error(`      job(s) with no node: ${j.missing.join(", ")}`);
      if (j.extra.length) console.error(`      node(s) a job names that the diagram does not have: ${j.extra.join(", ")}`);
      if (j.duplicated.length) console.error(`      job(s) naming more than one node: ${j.duplicated.join(", ")}`);
    }
    console.error(
      "\n  A diagram that is drawn once and then drifts is worse than none, because\n" +
        "  it is consulted. Update the diagram, or the job's `# bpmn-node:` line.",
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
