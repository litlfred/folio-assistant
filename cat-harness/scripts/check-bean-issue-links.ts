#!/usr/bin/env bun
/**
 * A bean and its issue reach each other — in BOTH directions, where that is
 * checkable from a checkout.
 *
 * Bean `oh78`, measured 2026-09-20: 54 proposals merged in one four-hour
 * window and **2 issues changed**, both newly opened. Issue #558 (*"Sticky pin:
 * unpinning loses the theme"*) carries no bean link although `ivfw` is its
 * subject verbatim; #464 is open on a `completed` bean.
 *
 * ## One direction is a real check; the other is honestly undetermined
 *
 * | direction | source | verdict |
 * |---|---|---|
 * | bean → issue | the bean's own body | **checked** — every reference is extracted and listed |
 * | issue → bean, for a TRACKED issue | `issue-marks/` | **checked** — a tracked issue no open bean names is a finding |
 * | issue → bean, in general | GitHub | **could not determine** — needs the API, and a checkout is not it |
 *
 * The third row is the one that must not be quietly dropped. A check that
 * reported the first two as a clean bill of health would be asserting
 * something about every issue in the repository on the evidence of two files.
 * So the third state is printed every run, named, with what would settle it —
 * the rule `could-not-determine-is-a-third-state-everywhere` already states
 * for this repository, applied to its own coverage rather than to its inputs.
 *
 * `issue-marks/` is the right offline source for row two precisely because of
 * what it is: an id and two timestamps for an issue some session decided was
 * worth tracking. An issue in there is one the work plan has already engaged
 * with, so "no bean names it" is a defect rather than an absence.
 *
 * Exit: 0 clean or nothing to check, 1 a tracked issue no bean names, 2 unknown.
 *
 * @module folio-assistant/scripts/check-bean-issue-links
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { directoriesForGraph, repoRootFor } from "../schemas/cat-harness.js";
import { OPEN_STATUSES, readBeanFiles } from "./bean-store-read.ts";

// Same reason as `agent-memory.ts` and `check-waivers.ts`: reading the whole
// declaration refuses an unregistered kind, and `folio` registers on import.
import "../schemas/folio-graph-kind.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
export const INSTANCE_ROOT = resolve(import.meta.dir, "..");
/**
 * The REPOSITORY root, which is where the bean store is.
 *
 * The two parted company when `#437` moved this instance under `cat-harness/`,
 * and they are needed for different questions here: `directoriesForGraph`
 * resolves a declaration from the INSTANCE, while `beans/` is repository-scoped
 * and sits a level up. Reading beans from the instance root returns `null` —
 * "no store" — which is a clean-looking answer to a question that was asked in
 * the wrong place, and it is what the first draft of this module did.
 */
export const REPO_ROOT = repoRootFor(INSTANCE_ROOT);

/** `#123`, `issues/123`, or a full issue URL. Repo-qualified refs are kept whole. */
const ISSUE_REF = /(?:issues\/(\d{1,6}))|(?:(?<![\w/])#(\d{1,6})\b)/g;

export interface BeanIssueReport {
  /** Issue number → the open beans naming it. */
  forward: Record<string, string[]>;
  /** Tracked in `issue-marks/` and named by no open bean. */
  untracked: string[];
  /** How many issue marks were read, so a zero is legible. */
  marksRead: number;
  /** Always present: what this check structurally cannot see. */
  undetermined: string;
}

/** Issue numbers this repository tracks a read-mark for. */
export function markedIssues(root: string): string[] {
  const dirs = directoriesForGraph(root, "issue-marks");
  const out: string[] = [];
  for (const dir of dirs) {
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      const n = JSON.parse(readFileSync(join(dir, name), "utf8")) as { issue?: string };
      const m = /#(\d+)\s*$/.exec(n.issue ?? "");
      if (m) out.push(m[1]!);
    }
  }
  return [...new Set(out)].sort((a, b) => Number(a) - Number(b));
}

export function checkBeanIssueLinks(root: string = INSTANCE_ROOT): BeanIssueReport {
  const undetermined =
    "issue → bean for every OTHER issue needs the GitHub API and is NOT checked here; " +
    "read this as unknown, never as clean.";
  const beans = readBeanFiles(REPO_ROOT);
  const forward: Record<string, string[]> = {};
  for (const b of (beans ?? []).filter((x) => !x.archived && OPEN_STATUSES.has(x.status))) {
    for (const m of b.body.matchAll(ISSUE_REF)) {
      const n = m[1] ?? m[2];
      if (!n) continue;
      (forward[n] ??= []).push(b.id);
    }
  }
  for (const k of Object.keys(forward)) forward[k] = [...new Set(forward[k]!)].sort();
  const marks = markedIssues(root);
  return {
    forward,
    untracked: marks.filter((n) => !forward[n]),
    marksRead: marks.length,
    undetermined,
  };
}

function formatReport(r: BeanIssueReport): string {
  const linked = Object.keys(r.forward).length;
  const out = [`Bean ↔ issue links (${linked} issue(s) named by an open bean, ${r.marksRead} tracked)`];
  if (r.untracked.length === 0) {
    out.push("  ✓ every tracked issue is named by at least one open bean");
  } else {
    for (const n of r.untracked) {
      out.push(`  ✗ #${n} is tracked in \`issue-marks/\` and no open bean names it — the work plan cannot reach it`);
    }
    out.push("");
    out.push("  Name the issue in the bean that owns its subject, or open one. See");
    out.push("  skills/folio-core/issue-working.md §\"When the work has a BEAN and no issue\".");
  }
  out.push(`  ? ${r.undetermined}`);
  return out.join("\n");
}

if (import.meta.main) {
  let report: BeanIssueReport;
  try {
    report = checkBeanIssueLinks();
  } catch (e) {
    console.error(`Could not check bean/issue links: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass. Treat it as unknown.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));
  process.exit(report.untracked.length ? 1 : 0);
}
