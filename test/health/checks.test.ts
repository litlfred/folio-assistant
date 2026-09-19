/**
 * Every check is shown FIRING, not merely returning clean.
 *
 * **A checker that returns `[]` for everything passes a corpus test.** Run the
 * registry against a healthy repository and a function that does nothing is
 * indistinguishable from one that works, so "the live repo is green" proves
 * nothing about any of these. Each check therefore gets fixture evidence
 * chosen to breach each of its thresholds, and the assertion NAMES the finding
 * rather than counting them — a count passes when the wrong finding fires.
 *
 * The three states get the same treatment: a determined empty and a
 * could-not-determine are asserted separately, because collapsing them is the
 * defect the whole family exists to refuse.
 *
 * @module test/health/checks.test
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "bun:test";

import { HealthReportSchema, healthVerdict } from "../../schemas/health-report.ts";
import {
  BEAN_OPEN_LIMIT,
  BEAN_RESOLVED_INLINE_LIMIT,
  HEALTH_CHECKS,
  STAGING_CRITICAL_BYTES,
  STAGING_WARN_BYTES,
  TRACKED_MAJOR_BYTES,
  TRACKED_WARN_BYTES,
  beanStoreCheck,
  formatBytes,
  repositorySizeCheck,
  runHealthChecks,
  stagingOrphanCheck,
  stagingSizeCheck,
  stagingSlug,
  todoStoreCheck,
  type BeanEvidence,
  type HealthContext,
  type StagingPreview,
} from "./checks.ts";

const MB = 1024 * 1024;

/** A context in which every probe succeeded and every store is healthy. */
function healthyContext(over: Partial<HealthContext> = {}): HealthContext {
  return {
    now: new Date("2026-09-19T12:00:00Z"),
    subject: "litlfred/folio-assistant",
    staging: {
      state: "ok",
      value: { branch: "present", previews: [{ slug: "claude-a", bytes: 10 * MB, files: 5 }], command: "fixture" },
    },
    openPrHeads: { state: "ok", value: ["claude/a"] },
    repoSize: { state: "ok", value: { gitDirBytes: 20 * MB, trackedBytes: 10 * MB, packs: 1, packBytes: 18 * MB } },
    beans: {
      state: "ok",
      value: [{ id: "b1", title: "one", status: "todo" }],
    },
    todos: { state: "ok", value: [{ id: "t1", status: "open", createdAt: "2026-09-18" }] },
    ...over,
  };
}

function previews(n: number, each: number): StagingPreview[] {
  return Array.from({ length: n }, (_, i) => ({ slug: `claude-p${i}`, bytes: each, files: 700 }));
}

/** Findings named by the metric they breached — assert by naming, not counting. */
function metrics(r: { findings: { metric?: string }[] }): (string | undefined)[] {
  return r.findings.map((f) => f.metric);
}

describe("staging-preview-size", () => {
  it("fires at `major` on the owner's 100 MB threshold", () => {
    // Three previews at the size measured on gh-pages 2026-09-19 (36.7–37.6 MB
    // each) — the case the threshold was chosen for.
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(3, 37 * MB), command: "fixture" } },
    }));
    expect(r.state).toBe("finding");
    expect(metrics(r)).toEqual(["staging-total-bytes"]);
    expect(r.findings[0].severity).toBe("major");
    expect(r.findings[0].summary).toContain("111.0 MB");
    // The action never removes anything — it asks.
    expect(r.findings[0].action).toContain("staging:cleanup");
  });

  it("escalates to `critical` past three-quarters of the Pages limit, and reports ONE breach not two", () => {
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(21, 37 * MB), command: "fixture" } },
    }));
    expect(r.state).toBe("finding");
    // 777 MB is over BOTH thresholds. One finding, not two: otherwise the
    // count would track how many thresholds happen to be declared.
    expect(r.findings).toHaveLength(1);
    expect(r.findings[0].severity).toBe("critical");
    expect(STAGING_CRITICAL_BYTES).toBeGreaterThan(STAGING_WARN_BYTES);
  });

  it("a branch that was read and carries no previews is a determined `ok`", () => {
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: [], command: "fixture" } },
    }));
    expect(r.state).toBe("ok");
    expect(r.measurements.find((m) => m.metric === "staging-total-bytes")?.value).toBe(0);
  });

  it("an unreadable publish branch is `unknown` — never 0 MB of previews", () => {
    const r = stagingSizeCheck(healthyContext({
      staging: { state: "unknown", reason: "git ls-remote origin gh-pages exited 128: could not read Username" },
    }));
    expect(r.state).toBe("unknown");
    expect(r.reason).toContain("ls-remote");
    // The distinction that matters: no measurement was invented to stand in.
    expect(r.measurements).toHaveLength(0);
    expect(r.findings).toHaveLength(0);
  });
});

describe("staging-preview-orphans", () => {
  it("names the preview whose PR is closed, and leaves the open one alone", () => {
    const r = stagingOrphanCheck(healthyContext({
      staging: {
        state: "ok",
        value: {
          branch: "present",
          previews: [
            { slug: "claude-live", bytes: 37 * MB, files: 700 },
            { slug: "claude-merged-last-week", bytes: 36 * MB, files: 690 },
          ],
          command: "fixture",
        },
      },
      openPrHeads: { state: "ok", value: ["claude/live"] },
    }));
    expect(r.state).toBe("finding");
    expect(r.findings.map((f) => f.summary)).toEqual([
      expect.stringContaining("STAGING/claude-merged-last-week"),
    ]);
    expect(r.findings[0].severity).toBe("minor");
    expect(r.findings[0].action).toContain("Ask the owner");
  });

  it("is `unknown` when the PR list could not be fetched, rather than calling every preview an orphan", () => {
    const r = stagingOrphanCheck(healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(6, 37 * MB), command: "fixture" } },
      openPrHeads: { state: "unknown", reason: "GitHub API returned 403 for litlfred/folio-assistant/pulls" },
    }));
    expect(r.state).toBe("unknown");
    expect(r.findings).toHaveLength(0);
    expect(r.reason).toContain("403");
  });

  it("agrees with `feature-staging.yml`'s own sed pipeline, branch for branch", () => {
    // A CHECKED duplication, in the idiom `check:harness-dirs` uses for
    // `.beans.yml`: the rule is written in sed inside the workflow and in
    // TypeScript here, and it cannot be written once because one runs in a
    // shell step and the other in this process. What can be avoided is an
    // UNCHECKED duplication — a drift here would make the orphan check name
    // the wrong preview, on a finding whose action invites removal.
    const wf = readFileSync(resolve(import.meta.dir, "..", "..", ".github/workflows/feature-staging.yml"), "utf-8");
    const pipelines = [...wf.matchAll(/SLUG=\$\(echo "\$BRANCH" \| (.+)\)$/gm)].map((m) => m[1]);
    // Both occurrences, so a fix applied to one of them is caught.
    expect(pipelines.length).toBeGreaterThanOrEqual(2);
    expect(new Set(pipelines).size).toBe(1);

    for (const branch of [
      "claude/health-checks",
      "feat/a//b",
      "-lead-and-trail-",
      "release/v1.2.3",
      // ASCII only, deliberately: `sed`'s `[^a-zA-Z0-9._-]` is byte-oriented
      // or character-oriented depending on the locale, so a non-ASCII branch
      // name would make this test's verdict a fact about `LC_ALL` rather than
      // about either implementation. A failure nobody can act on is worse
      // than a gap.
      "a__b--c",
    ]) {
      const r = spawnSync("bash", ["-c", `echo "$1" | ${pipelines[0]}`, "_", branch], { encoding: "utf-8" });
      expect(r.status).toBe(0);
      expect(stagingSlug(branch)).toBe(r.stdout.trim());
    }
  });

  it("slugifies the branch the way feature-staging.yml does, and only forwards", () => {
    expect(stagingSlug("claude/health-checks")).toBe("claude-health-checks");
    expect(stagingSlug("feat/a//b")).toBe("feat-a-b");
    expect(stagingSlug("-lead-and-trail-")).toBe("lead-and-trail");
    // `claude/a-b` and `claude-a-b` collide, which is exactly why the check
    // never tries to recover a branch name from a directory name.
    expect(stagingSlug("claude/a-b")).toBe(stagingSlug("claude-a-b"));
  });
});

describe("repository-size", () => {
  it("fires `minor` past the 250 MB early-warning point", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: {
        state: "ok",
        value: { gitDirBytes: 300 * MB, trackedBytes: TRACKED_WARN_BYTES + MB, packs: 1, packBytes: 290 * MB },
      },
    }));
    expect(metrics(r)).toEqual(["tracked-tree-bytes"]);
    expect(r.findings[0].severity).toBe("minor");
  });

  it("fires `major` past GitHub's documented 1 GB recommendation", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: {
        state: "ok",
        value: { gitDirBytes: 2000 * MB, trackedBytes: TRACKED_MAJOR_BYTES + MB, packs: 1, packBytes: 1900 * MB },
      },
    }));
    expect(r.findings.find((f) => f.metric === "tracked-tree-bytes")?.severity).toBe("major");
  });

  it("fires on the history-to-tree ratio — this repository's own shape on 2026-09-19", () => {
    // 349 MB of .git against 29 MB of blobs at HEAD: 12.0x.
    const r = repositorySizeCheck(healthyContext({
      repoSize: { state: "ok", value: { gitDirBytes: 349 * MB, trackedBytes: 29 * MB, packs: 42, packBytes: 308 * MB } },
    }));
    expect(metrics(r)).toEqual(["git-dir-to-tree-ratio"]);
    expect(r.findings[0].summary).toContain("12.0x");
    // It sends the reader to `git gc` FIRST, because a high pack count is
    // local housekeeping and moves the number without history changing.
    expect(r.findings[0].action).toContain("git gc");
  });

  it("does not fire the ratio on a small clone, however lopsided", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: { state: "ok", value: { gitDirBytes: 2 * MB, trackedBytes: 0.1 * MB, packs: 1, packBytes: 2 * MB } },
    }));
    expect(r.state).toBe("ok");
  });

  it("is `unknown` when git could not be asked", () => {
    const r = repositorySizeCheck(healthyContext({
      repoSize: { state: "unknown", reason: "git count-objects -v exited 128" },
    }));
    expect(r.state).toBe("unknown");
    expect(r.measurements).toHaveLength(0);
  });
});

describe("bean-store", () => {
  const bean = (o: Partial<BeanEvidence> & { id: string }): BeanEvidence => ({
    title: `title ${o.id}`,
    status: "todo",
    ...o,
  });

  it("fires `major` on a duplicate title — the 14,688-duplicate shape, at its leading edge", () => {
    const r = beanStoreCheck(healthyContext({
      beans: {
        state: "ok",
        value: [
          bean({ id: "aaaa", title: "Drain the exposition swarm" }),
          bean({ id: "bbbb", title: "drain the exposition swarm" }),
          bean({ id: "cccc", title: "Something else" }),
        ],
      },
    }));
    expect(metrics(r)).toEqual(["bean-duplicate-title-groups"]);
    expect(r.findings[0].severity).toBe("major");
    expect(r.findings[0].summary).toContain("aaaa, bbbb");
    // The action is `scrapped`, and it says outright not to delete.
    expect(r.findings[0].action).toContain("scrapped");
    expect(r.findings[0].action).toContain("Never `beans delete`");
  });

  it("fires `minor` on a claim nobody has honoured for a fortnight", () => {
    const r = beanStoreCheck(healthyContext({
      beans: {
        state: "ok",
        value: [
          bean({ id: "stale", status: "in-progress", updatedAt: "2026-08-01T00:00:00Z" }),
          bean({ id: "fresh", status: "in-progress", updatedAt: "2026-09-18T00:00:00Z" }),
        ],
      },
    }));
    expect(metrics(r)).toEqual(["bean-stale-in-progress"]);
    expect(r.findings[0].summary).toContain("`stale`");
    expect(r.findings[0].summary).toContain("49 days");
  });

  it("an `in-progress` bean with no timestamp is not reported as stale", () => {
    // A missing date is not an old one. Guessing here would report a fresh
    // claim as abandoned, which is a false accusation against a sibling.
    const r = beanStoreCheck(healthyContext({
      beans: { state: "ok", value: [bean({ id: "undated", status: "in-progress" })] },
    }));
    expect(r.state).toBe("ok");
  });

  it("fires on resolved beans still inline, and the action MOVES rather than deletes", () => {
    const value = Array.from({ length: BEAN_RESOLVED_INLINE_LIMIT + 1 }, (_, i) =>
      bean({ id: `c${i}`, title: `done ${i}`, status: "completed" }),
    );
    const r = beanStoreCheck(healthyContext({ beans: { state: "ok", value } }));
    expect(metrics(r)).toEqual(["bean-resolved-inline"]);
    expect(r.findings[0].action).toContain("beans archive");
    expect(r.findings[0].action).toContain("MOVES");
  });

  it("fires on an open backlog past the calibration point", () => {
    const value = Array.from({ length: BEAN_OPEN_LIMIT + 1 }, (_, i) => bean({ id: `o${i}`, title: `open ${i}` }));
    const r = beanStoreCheck(healthyContext({ beans: { state: "ok", value } }));
    expect(metrics(r)).toEqual(["bean-open"]);
  });

  it("is `unknown` when the store could not be read", () => {
    const r = beanStoreCheck(healthyContext({
      beans: { state: "unknown", reason: "beans/beans.json could not be read" },
    }));
    expect(r.state).toBe("unknown");
  });
});

describe("todo-store", () => {
  it("fires on a todo left open for a quarter", () => {
    const r = todoStoreCheck(healthyContext({
      todos: { state: "ok", value: [{ id: "old", status: "open", createdAt: "2026-01-01" }] },
    }));
    expect(metrics(r)).toEqual(["todo-stale-days"]);
    expect(r.findings[0].action).toContain("only they");
  });

  it("fires on too many open todos, and does not count the closed ones", () => {
    const open = Array.from({ length: 26 }, (_, i) => ({ id: `o${i}`, status: "open" }));
    const closed = Array.from({ length: 50 }, (_, i) => ({ id: `d${i}`, status: "done" }));
    const r = todoStoreCheck(healthyContext({ todos: { state: "ok", value: [...open, ...closed] } }));
    expect(metrics(r)).toEqual(["todo-open"]);
    expect(r.measurements.find((m) => m.metric === "todo-open")?.value).toBe(26);
  });

  it("an empty todo store is a determined `ok`, unlike an empty bean store", () => {
    const r = todoStoreCheck(healthyContext({ todos: { state: "ok", value: [] } }));
    expect(r.state).toBe("ok");
  });
});

describe("the registry and the report", () => {
  it("every registered id has a check that answers to it", () => {
    const ran = runHealthChecks(healthyContext());
    expect(ran.map((r) => r.id).sort()).toEqual(HEALTH_CHECKS.map((c) => c.id).sort());
  });

  it("every threshold states its basis", () => {
    // The structural half is in the schema; this is the corpus half — no
    // shipped check may carry a bare number.
    for (const r of runHealthChecks(healthyContext())) {
      for (const t of r.thresholds) {
        expect(t.basis.length).toBeGreaterThan(40);
      }
    }
  });

  it("every finding names something a person does", () => {
    const ctx = healthyContext({
      staging: { state: "ok", value: { branch: "present", previews: previews(6, 37 * MB), command: "fixture" } },
      openPrHeads: { state: "ok", value: [] },
      repoSize: { state: "ok", value: { gitDirBytes: 349 * MB, trackedBytes: 29 * MB, packs: 42, packBytes: 308 * MB } },
    });
    const findings = runHealthChecks(ctx).flatMap((r) => r.findings);
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) expect(f.action.length).toBeGreaterThan(20);
  });

  it("one `unknown` takes the whole verdict to unknown, even beside findings", () => {
    // The precedence that matters: a sweep blind on one check has not cleared
    // the others, so `unknown` outranks `findings`.
    expect(healthVerdict([{ state: "ok" }, { state: "finding" }, { state: "unknown" }])).toBe("unknown");
    expect(healthVerdict([{ state: "ok" }, { state: "finding" }])).toBe("findings");
    expect(healthVerdict([{ state: "ok" }])).toBe("clean");
  });

  it("the schema refuses a report that claims ok while holding findings", () => {
    const base = {
      $schema: "health-report/v1",
      producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
      subject: { kind: "repository", id: "litlfred/folio-assistant" },
      updated_at: "2026-09-19T12:00:00Z",
      verdict: "clean",
      checks: [
        {
          id: "x",
          state: "ok",
          summary: "s",
          thresholds: [],
          measurements: [],
          findings: [{ summary: "a thing", severity: "minor", action: "do something about it" }],
        },
      ],
    };
    expect(() => HealthReportSchema.parse(base)).toThrow(/false pass/);
  });

  it("the schema refuses an `unknown` that does not say what it could not determine", () => {
    expect(() =>
      HealthReportSchema.parse({
        $schema: "health-report/v1",
        producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
        subject: { kind: "repository", id: "r" },
        updated_at: "2026-09-19T12:00:00Z",
        verdict: "unknown",
        checks: [{ id: "x", state: "unknown", summary: "s", thresholds: [], measurements: [], findings: [] }],
      }),
    ).toThrow(/gives no reason/);
  });

  it("the schema refuses a stored verdict that disagrees with its own checks", () => {
    expect(() =>
      HealthReportSchema.parse({
        $schema: "health-report/v1",
        producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
        subject: { kind: "repository", id: "r" },
        updated_at: "2026-09-19T12:00:00Z",
        verdict: "clean",
        checks: [
          {
            id: "x",
            state: "finding",
            summary: "s",
            thresholds: [],
            measurements: [],
            findings: [{ summary: "a thing", severity: "major", action: "do something about it" }],
          },
        ],
      }),
    ).toThrow(/disagrees with the checks/);
  });

  it("the schema refuses a sweep with no checks in it at all", () => {
    expect(() =>
      HealthReportSchema.parse({
        $schema: "health-report/v1",
        producer: { script: "test/health/run.ts", script_hash: "deadbeefcafe" },
        subject: { kind: "repository", id: "r" },
        updated_at: "2026-09-19T12:00:00Z",
        verdict: "clean",
        checks: [],
      }),
    ).toThrow();
  });

  it("formats bytes the way the report reads them", () => {
    expect(formatBytes(222 * MB)).toBe("222.0 MB");
    expect(formatBytes(2 * 1024 * MB)).toBe("2.00 GB");
  });
});
