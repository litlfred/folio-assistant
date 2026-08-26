import { describe, expect, test } from "bun:test";
import { assess, byWorkflow, classifyRuns, render, type RunSummary } from "../../src/workflow/ci-health";

/**
 * `docs-site.yml` fired on every push to `main` and failed all 30 times over
 * two months. The trigger was fine; the *outcome* was invisible, and from
 * inside the repo a workflow that runs and passes and one that runs and fails
 * look identical. See bean `xom7`.
 *
 * These tests pin the two distinctions that make a health report worth reading:
 * a run still in flight is not a verdict either way, and "could not check" is
 * never rendered as "green". A report that goes quiet when it cannot see is
 * worse than no report, because it reads as reassurance.
 */

const NOW = new Date("2026-08-26T12:00:00Z");
const run = (over: Partial<RunSummary> = {}): RunSummary => ({
  name: "Docs site",
  status: "completed",
  conclusion: "success",
  created_at: "2026-08-26T10:00:00Z",
  ...over,
});

describe("classifying one workflow's history", () => {
  test("latest success is green, with no failure count", () => {
    const h = classifyRuns([run(), run({ conclusion: "failure" })], NOW);
    expect(h.health).toBe("green");
    expect(h.consecutiveFailures).toBe(0);
  });

  test("consecutive failures are counted from the newest run backwards", () => {
    const h = classifyRuns(
      [
        run({ conclusion: "failure", created_at: "2026-08-26T10:00:00Z" }),
        run({ conclusion: "failure", created_at: "2026-08-25T10:00:00Z" }),
        run({ conclusion: "failure", created_at: "2026-08-24T10:00:00Z" }),
        run({ conclusion: "success", created_at: "2026-08-20T10:00:00Z" }),
        run({ conclusion: "failure", created_at: "2026-08-19T10:00:00Z" }),
      ],
      NOW,
    );
    expect(h.health).toBe("red");
    expect(h.consecutiveFailures).toBe(3);
    expect(h.daysSinceSuccess).toBe(6);
  });

  test("no success anywhere in the window leaves daysSinceSuccess undefined", () => {
    // The real docs-site shape: red as far back as the window reaches. Guessing
    // a number here would understate how long it had been broken.
    const h = classifyRuns([run({ conclusion: "failure" }), run({ conclusion: "failure" })], NOW);
    expect(h.health).toBe("red");
    expect(h.daysSinceSuccess).toBeUndefined();
    expect(h.lastSuccess).toBeUndefined();
  });

  test("a run still in flight is not a verdict either way", () => {
    // Counting a queued run as a failure would cry wolf on every push; counting
    // it as a pass would be the exact lie this whole module exists to prevent.
    expect(classifyRuns([run({ status: "in_progress", conclusion: null })], NOW).health).toBe(
      "running",
    );
  });

  test("cancelled and skipped runs are not the workflow's fault, and are ignored", () => {
    const h = classifyRuns(
      [
        run({ conclusion: "cancelled" }),
        run({ conclusion: "skipped" }),
        run({ conclusion: "success", created_at: "2026-08-26T09:00:00Z" }),
      ],
      NOW,
    );
    expect(h.health).toBe("green");
    expect(h.consecutiveFailures).toBe(0);
  });

  test("no runs at all is its own state, not green", () => {
    expect(classifyRuns([], NOW).health).toBe("no-runs");
  });
});

describe("assessing a whole repo", () => {
  const mixed: RunSummary[] = [
    run({ name: "Docs site", conclusion: "failure", created_at: "2026-08-26T10:00:00Z" }),
    run({ name: "Docs site", conclusion: "failure", created_at: "2026-08-25T10:00:00Z" }),
    run({ name: "Code-quality gates", conclusion: "success", created_at: "2026-08-26T11:00:00Z" }),
    run({ name: "QA sweep", conclusion: "failure", created_at: "2026-08-01T10:00:00Z" }),
  ];

  test("runs are grouped by workflow, newest first", () => {
    const g = byWorkflow(mixed);
    expect([...g.keys()].sort()).toEqual(["Code-quality gates", "Docs site", "QA sweep"]);
    expect(g.get("Docs site")![0].created_at).toBe("2026-08-26T10:00:00Z");
  });

  test("the worst workflow sorts first — one line read should be the worst one", () => {
    const h = assess(mixed, { now: NOW });
    expect(h[0].workflow).toBe("Docs site");
    expect(h[0].consecutiveFailures).toBe(2);
    expect(h.at(-1)!.workflow).toBe("Code-quality gates");
  });

  test("runs of a DELETED workflow are history, not a live problem", () => {
    const withGhost = [
      ...mixed,
      run({
        name: ".github/workflows/paper-builder-image.yml",
        path: ".github/workflows/paper-builder-image.yml",
        conclusion: "failure",
      }),
    ];
    const exists = (p: string) => p !== ".github/workflows/paper-builder-image.yml";
    const names = assess(withGhost, { now: NOW, workflowExists: exists }).map((h) => h.workflow);
    expect(names).not.toContain(".github/workflows/paper-builder-image.yml");
    // Still reports the live failure — the filter must not swallow real ones.
    expect(names).toContain("Docs site");
  });

  test("without a workflowExists predicate nothing is filtered", () => {
    // Not knowing which files exist must not silently drop failures.
    const withGhost = [...mixed, run({ name: "Gone", path: "x.yml", conclusion: "failure" })];
    expect(assess(withGhost, { now: NOW }).map((h) => h.workflow)).toContain("Gone");
  });
});

describe("age separates an active fire from a stale scorch mark", () => {
  test("a red that has not re-run in a week is flagged as possibly stale", () => {
    // The real shape of two of this repo's workflows: last red 2026-08-07,
    // against a commit whose files were changed the next day.
    const out = render(
      assess(
        [
          run({ name: "QA sweep", conclusion: "failure", created_at: "2026-08-07T15:04:09Z" }),
          run({ name: "QA sweep", conclusion: "failure", created_at: "2026-08-07T15:04:08Z" }),
        ],
        { now: NOW },
      ),
      { branch: "main" },
    );
    // 2026-08-07T15:04 to 2026-08-26T12:00 is 18 whole days, not 19.
    expect(out).toContain("has not run in 18d");
    expect(out).toContain("may be stale");
  });

  test("a red that ran today is NOT softened as stale", () => {
    const out = render(
      assess([run({ name: "Docs site", conclusion: "failure", created_at: "2026-08-26T10:00:00Z" })], {
        now: NOW,
      }),
      { branch: "main" },
    );
    expect(out).toContain("last ran 0d ago");
    expect(out).not.toContain("may be stale");
  });
});

describe("rendering, and the thing it must never do", () => {
  test("an unreachable API renders as unknown, never as green", () => {
    const out = render([], { unreachable: "GitHub API returned 403", branch: "main" });
    expect(out).toContain("Not checked");
    expect(out).toContain("treat as unknown, not as green");
    expect(out).not.toMatch(/✓|green \(/);
  });

  test("a failing workflow is named with its failure count and staleness", () => {
    const out = render(assess([
      run({ name: "Docs site", conclusion: "failure", created_at: "2026-08-26T10:00:00Z" }),
      run({ name: "Docs site", conclusion: "failure", created_at: "2026-08-25T10:00:00Z" }),
    ], { now: NOW }), { branch: "main" });
    expect(out).toContain("Docs site");
    expect(out).toContain("2 consecutive failure(s)");
    expect(out).toContain("no success in the window");
  });

  test("all green says so explicitly rather than printing nothing", () => {
    // An empty section is indistinguishable from a section that did not run.
    const out = render(assess([run({ name: "Code-quality gates" })], { now: NOW }), {
      branch: "main",
    });
    expect(out).toContain("every workflow with a recent run");
  });

  test("no runs in the window is stated, not rendered as green", () => {
    const out = render([], { branch: "main" });
    expect(out).toContain("No runs on");
    expect(out).not.toContain("green");
  });
});
