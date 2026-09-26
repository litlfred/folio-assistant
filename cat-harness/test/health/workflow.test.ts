/**
 * The daily trigger, and the tracking-issue path, exercised without opening one.
 *
 * Opening a real issue to test this code is forbidden here without the owner's
 * asking — so the path is exercised two ways instead. {@link render} is run
 * over a fixture report and the resulting issue body asserted; and the
 * workflow itself is parsed and its clauses asserted, because the properties
 * that matter are all about WHICH STEP RUNS ON WHICH VERDICT, and those are
 * `if:` expressions rather than behaviour.
 *
 * The one this file exists for is the last: **nothing may close the tracking
 * issue on `unknown`.** A sweep that could not read `gh-pages` has not
 * established that the previews are under 100 MB, and closing the issue would
 * report exactly that. It is a one-word edit away at any time and nothing else
 * in the repository would notice.
 *
 * @module test/health/workflow.test
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "bun:test";
import { parse } from "yaml";

import { buildReport, gates, render } from "./run.ts";
import { runHealthChecks, type HealthContext } from "./checks.ts";
import { repoRootFor } from "../../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "..", "..");
const WORKFLOW = resolve(repoRootFor(ROOT), ".github/workflows/health-check.yml");

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

  it("is also runnable locally, under a script name a person would guess", () => {
    const pkg = JSON.parse(readFileSync(resolve(repoRootFor(ROOT), "package.json"), "utf-8")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts.health).toContain("test/health/run.ts");
    expect(pkg.scripts["health:list"]).toContain("--list");
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
    expect(String(upload?.with?.path)).toContain("repository.health-report.json");
  });

  it("treats an exit 1 with no report as unchecked rather than as a finding", () => {
    // bun exits 1 on an uncaught exception too, so the exit code alone cannot
    // tell "found something" from "crashed"; the written report is what can.
    expect(stepNamed("Run the health checks")?.run).toContain('[ ! -s "$report" ]');
  });
});

describe("the issue body", () => {
  /** A context that makes three checks fire and one go blind. */
  function fixture(): HealthContext {
    const MB = 1024 * 1024;
    return {
      now: new Date("2026-09-19T12:00:00Z"),
      subject: "example/fixture",
      staging: {
        state: "ok",
        value: {
          branch: "present",
          // 2 x 300 MB, not 2 x 60 MB. The sizes are fixture values chosen to
          // BREACH the size threshold, and that threshold moved from 100 MB to
          // 500 MB on 2026-09-20 with `folio-assistant-1feu` — which made a
          // merged PR's preview go away, so the total drains and the number
          // now expresses a concurrency rather than a cumulative ceiling.
          // Two previews keeps the orphan case below intact; only the bytes
          // change.
          previews: [
            { slug: "claude-one", bytes: 300 * MB, files: 700 },
            { slug: "claude-two", bytes: 300 * MB, files: 700 },
          ],
          command: "fixture",
        },
      },
      openPrHeads: { state: "ok", value: ["claude/one"] },
      // Listed, and nothing on the remote slugifies to either preview — a
      // determined empty, so `claude-two` is a decided orphan rather than an
      // undetermined one.
      branches: { state: "ok", value: { candidates: [], defaultBranch: "main", command: "fixture" } },
      repoSize: { state: "unknown", reason: "git count-objects -v exited 128: not a git repository" },
      beans: { state: "ok", value: [{ id: "b1", title: "one", status: "todo" }] },
      todos: { state: "ok", value: [] },
    };
  }

  const report = (() => {
    const ctx = fixture();
    // Deliberately built through the same path the CLI uses, so the issue body
    // under test is the one the workflow would post.
    return buildReport(ctx, runHealthChecks(ctx), {
      hash: "0123456789ab",
      updatedAt: "2026-09-19T12:00:00Z",
    });
  })();

  it("leads with 'could not determine' when anything went blind, not with the findings", () => {
    expect(report.verdict).toBe("unknown");
    const md = render(report);
    expect(md).toContain("**Could not determine.**");
    expect(md).toContain("This is NOT a clean report");
    // And it still says WHAT went blind.
    expect(md).toContain("not a git repository");
  });

  it("names every finding and what a person should do about it", () => {
    const md = render(report);
    expect(md).toContain("staging-preview-size");
    expect(md).toContain("600.0 MB");
    expect(md).toContain("STAGING/claude-two");
    expect(md).toContain("staging:cleanup");
    // The preview whose PR is open is not proposed for anything.
    expect(md).not.toContain("STAGING/claude-one` (");
  });

  it("shows every threshold with the basis it was chosen on", () => {
    const md = render(report);
    expect(md).toContain("Thresholds, and what each is based on");
    expect(md).toContain("owner's explicit instruction");
    // The honest-arbitrary ones say so in those words rather than implying a standard.
    expect(md).toContain("NO EXTERNAL STANDARD");
  });

  it("gates on a major finding, and not on a minor one alone", () => {
    const majorOnly = { ...report, checks: report.checks.filter((c) => c.id === "staging-preview-size") };
    expect(gates(majorOnly, false)).toBe(true);
    const minorOnly = { ...report, checks: report.checks.filter((c) => c.id === "staging-preview-orphans") };
    expect(gates(minorOnly, false)).toBe(false);
    expect(gates(minorOnly, true)).toBe(true);
  });
});
