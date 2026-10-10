/**
 * `health-check.yml`: the daily trigger, and the tracking-issue path, parsed
 * rather than run.
 *
 * Opening a real issue to test this code is forbidden without the owner's
 * asking, so the workflow is parsed and its clauses asserted, because the
 * properties that matter are all about WHICH STEP RUNS ON WHICH VERDICT, and
 * those are `if:` expressions rather than behaviour.
 *
 * The one this file exists for: **nothing may close the tracking issue on
 * `unknown`.** A sweep that could not read `gh-pages` has not established that
 * the previews are under 100 MB, and closing the issue would report exactly
 * that.
 *
 * The workflow half of cat-harness's `test/health/workflow.test.ts`, moved
 * here (owner's ruling 2026-10-09, litlfred/folio-assistant#2521, ruling
 * 1(c)): it reads this repository's own `.github/workflows/health-check.yml`.
 * The issue body the workflow posts — `render` over a fixture report — is
 * tested beside the renderer, in cat-harness.
 *
 * @module test/workflows/health-check-workflow.test
 */
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "bun:test";
import { parse } from "yaml";

import { healthReportPath } from "../../cat-harness/schemas/health-report.ts";

/** This index repository's root, where the workflow runs and its upload path is resolved. */
const INDEX = resolve(import.meta.dir, "..", "..");
/** The platform the workflow runs: the mounted cat-harness instance. */
const PLATFORM = resolve(INDEX, "cat-harness");
const WORKFLOW = resolve(INDEX, ".github/workflows/health-check.yml");

interface Step {
  name?: string;
  if?: string;
  run?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

const wf = parse(readFileSync(WORKFLOW, "utf-8")) as {
  // `on` is parsed by YAML 1.1 rules in some readers; `yaml` keeps it a string key.
  on: { schedule?: { cron: string }[]; workflow_dispatch?: unknown };
  permissions: Record<string, string>;
  jobs: Record<string, { steps: Step[] }>;
};
const steps = wf.jobs.report.steps;
const stepNamed = (fragment: string): Step | undefined =>
  steps.find((s) => (s.name ?? "").toLowerCase().includes(fragment.toLowerCase()));

describe("the trigger", () => {
  it("fires once every 24 hours, as asked, and off the hour", () => {
    const crons = (wf.on.schedule ?? []).map((s) => s.cron);
    expect(crons).toHaveLength(1);
    const [minute, hour, dom, month, dow] = crons[0].split(" ");
    // Daily: a fixed hour, every day of every month, any weekday.
    expect(dom).toBe("*");
    expect(month).toBe("*");
    expect(dow).toBe("*");
    expect(Number(hour)).toBeGreaterThanOrEqual(0);
    expect(Number(minute)).not.toBe(0);
  });

  it("is runnable on demand, because a check reachable only from a cron cannot be reproduced", () => {
    expect(wf.on).toHaveProperty("workflow_dispatch");
  });

  it("can ask which pull requests are open, or the orphan check is blind by construction", () => {
    expect(wf.permissions["pull-requests"]).toBe("read");
    expect(wf.permissions.issues).toBe("write");
  });

  it("checks out the whole history, without which the size ratio cannot fire", () => {
    const checkout = steps.find((s) => (s.uses ?? "").startsWith("actions/checkout"));
    expect(checkout?.with?.["fetch-depth"]).toBe(0);
  });
});

describe("the tracking issue", () => {
  const open = stepNamed("Open or update the tracking issue");
  const close = stepNamed("Close the tracking issue");
  const refuse = stepNamed("Refuse to report success");

  it("is opened or edited only on findings", () => {
    expect(open?.if).toBe("steps.check.outputs.verdict == 'findings'");
  });

  it("is EDITED in place rather than commented on, so a persistent finding stays one unread item", () => {
    expect(open?.run).toContain("gh issue edit");
    expect(open?.run).not.toContain("gh issue comment");
  });

  it("is closed only when every check ran and was clean", () => {
    expect(close?.if).toBe("steps.check.outputs.verdict == 'clean'");
  });

  it("is NEVER closed on `unknown`, and the job fails instead", () => {
    // The property this file exists for. `unknown` must reach no step that
    // touches the issue, and must reach one that fails.
    const touchesIssue = steps.filter((s) => (s.run ?? "").includes("gh issue"));
    expect(touchesIssue.length).toBeGreaterThan(0);
    for (const s of touchesIssue) {
      expect(s.if).toBeDefined();
      expect(s.if).not.toContain("unknown'");
      // Each is pinned to exactly one of the two determined verdicts.
      expect(["findings", "clean"].some((v) => (s.if ?? "").includes(`'${v}'`))).toBe(true);
    }
    expect(refuse?.if).toBe("steps.check.outputs.verdict == 'unknown'");
    expect(refuse?.run).toContain("exit 1");
  });

  it("keeps the machine-readable report whatever the verdict, including when it went blind", () => {
    const upload = steps.find((s) => (s.uses ?? "").startsWith("actions/upload-artifact"));
    expect(upload?.if).toBe("always()");
    // The EXACT path the producer writes, relative to the repository root the
    // step runs in. `toContain(filename)` passed over the pre-#437 path for
    // as long as it was wrong, and the artifact was never kept (bean r7v6, C3).
    expect(String(upload?.with?.path)).toBe(relative(INDEX, healthReportPath(PLATFORM)));
    // A missing report is an error, not a warning: `warn` is what let a wrong
    // path stay green.
    expect(upload?.with?.["if-no-files-found"]).toBe("error");
  });

  it("runs every step from the repository root, so the upload path is resolved there", () => {
    for (const s of steps) expect((s as { "working-directory"?: string })["working-directory"]).toBeUndefined();
  });

  it("treats an exit 1 with no report as unchecked rather than as a finding", () => {
    // bun exits 1 on an uncaught exception too, so the exit code alone cannot
    // tell "found something" from "crashed"; the written report is what can.
    expect(stepNamed("Run the health checks")?.run).toContain('[ ! -s "$report" ]');
  });
});
