/**
 * The re-pin train's decisions (issue #2873, owner card Q-SPD-3 B): when a
 * train opens, and when a train PR has no new failures compared with main.
 * The workflows that call them are pinned at the end.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { baselineByName, compare, decide, type CheckRun, type TrainPr } from "../../.github/scripts/repin-train.ts";

const ROOT = resolve(import.meta.dir, "../..");
let nextId = 1;
const run = (name: string, conclusion: string | null, status = "completed"): CheckRun => ({ id: nextId++, name, status, conclusion });
const tree = (c: string) => c.repeat(40);
const pr = (number: number, state: "open" | "closed", t: string, verdict?: TrainPr["verdict"]): TrainPr => ({
  number,
  state,
  merged: false,
  body: `pins…\n<!-- repin-train:tree=${t} -->`,
  verdict,
});

describe("no new failures compared with main", () => {
  test("a failure main also has is known, not new", () => {
    const v = compare([run("e2e (1)", "failure"), run("lint", "success")], [run("e2e (1)", "failure"), run("lint", "success")]);
    expect(v).toEqual({ state: "success", pending: [], newFailures: [], knownFailures: ["e2e (1)"] });
  });

  test("a failure main passes is new and blocks", () => {
    const v = compare([run("bun test (3)", "failure")], [run("bun test (3)", "success")]);
    expect(v.state).toBe("failure");
    expect(v.newFailures).toEqual(["bun test (3)"]);
  });

  test("a failing check main does not run at all is new", () => {
    expect(compare([run("stage", "failure")], [run("lint", "success")]).newFailures).toEqual(["stage"]);
  });

  test("cancelled and timed out are not passes", () => {
    expect(compare([run("a", "cancelled"), run("b", "timed_out")], []).newFailures).toEqual(["a", "b"]);
  });

  test("a re-run supersedes the run it repeats", () => {
    const first = run("bun test (2)", "failure");
    const rerun = run("bun test (2)", "success");
    expect(compare([first, rerun], []).state).toBe("success");
  });

  test("a running check keeps the verdict pending, unless a new failure already decides it", () => {
    expect(compare([run("a", null, "in_progress"), run("b", "success")], []).state).toBe("pending");
    expect(compare([run("a", null, "in_progress"), run("b", "failure")], []).state).toBe("failure");
  });

  test("no checks at all is never green", () => {
    expect(compare([], []).state).toBe("pending");
  });

  test("waits for a hard gate main runs that has not started on the train", () => {
    const v = compare([run("stage", "success")], [run("Repository gates (hard)", "success"), run("deploy", "success")]);
    expect(v.state).toBe("pending");
    expect(v.pending).toEqual(["Repository gates (hard)"]);
  });
});

describe("main's baseline is read one check at a time", () => {
  test("a check the newest main commit skipped takes its answer from an older commit", () => {
    const newest = [run("deploy", "success")];
    const older = [run("Repository gates (hard)", "failure"), run("deploy", "failure")];
    const base = baselineByName([newest, older]);
    expect(base.find((r) => r.name === "Repository gates (hard)")?.conclusion).toBe("failure");
    expect(base.find((r) => r.name === "deploy")?.conclusion).toBe("success");
    expect(compare([run("Repository gates (hard)", "failure")], base).knownFailures).toEqual(["Repository gates (hard)"]);
  });

  test("a check still running on the newest commit keeps the older finished answer", () => {
    const base = baselineByName([[run("bun test (1)", null, "in_progress")], [run("bun test (1)", "failure")]]);
    expect(base.map((r) => r.conclusion)).toEqual(["failure"]);
  });
});

describe("when a train opens", () => {
  test("nothing open: open a train", () => {
    expect(decide(tree("a"), [])).toEqual({ action: "open", reason: "new pins", close: [] });
  });

  test("a tree an earlier train already tested is skipped, open or closed", () => {
    expect(decide(tree("a"), [pr(7, "closed", tree("a"))]).action).toBe("skip");
    expect(decide(tree("a"), [pr(7, "open", tree("a"), "failure")]).action).toBe("skip");
  });

  test("a train still being checked keeps its pins frozen", () => {
    const d = decide(tree("b"), [pr(7, "open", tree("a"))]);
    expect(d.action).toBe("skip");
    expect(d.reason).toContain("#7");
    expect(decide(tree("b"), [pr(7, "open", tree("a"), "pending")]).action).toBe("skip");
  });

  test("a passed train waiting for a merge is not closed under the person merging it", () => {
    expect(decide(tree("b"), [pr(7, "open", tree("a"), "success")]).action).toBe("skip");
  });

  test("a failed train is replaced and closed", () => {
    expect(decide(tree("b"), [pr(7, "open", tree("a"), "failure"), pr(5, "closed", tree("c"))])).toEqual({ action: "open", reason: "new pins", close: [7] });
  });
});

describe("the workflows", () => {
  const train = readFileSync(join(ROOT, ".github/workflows/repin-train.yml"), "utf-8");
  const verdict = readFileSync(join(ROOT, ".github/workflows/repin-train-verdict.yml"), "utf-8");

  test("the train runs every two hours, one at a time", () => {
    expect(train).toMatch(/cron: '\d+ \*\/2 \* \* \*'/);
    expect(train).toMatch(/group: repin-train\n\s+cancel-in-progress: false/);
  });

  test("the train moves pins only through standing consent, and never merges", () => {
    expect(train).toContain("mount:repin:standing");
    expect(train).not.toMatch(/\/merge\b|gh pr merge/);
  });

  test("the train refreshes bun.lock with its pins, so frozen installs pass", () => {
    const repin = train.indexOf("mount:repin:standing --summary-file");
    const install = train.indexOf("bun install\n", repin);
    expect(install).toBeGreaterThan(repin);
    expect(install).toBeLessThan(train.indexOf("git add -u"));
  });

  test("the train never commits workflow files, which its token may not push", () => {
    const restore = train.indexOf("git checkout -- .github/workflows");
    expect(restore).toBeGreaterThan(train.indexOf("mount:repin:standing --summary-file"));
    expect(restore).toBeLessThan(train.indexOf("git add -u"));
  });

  test("the train judges open trains itself, since token-started CI triggers no workflow_run", () => {
    const judge = train.indexOf("repin-train.ts verdict --sha");
    expect(judge).toBeGreaterThan(-1);
    expect(judge).toBeLessThan(train.lastIndexOf("repin-train.ts decide --tree"));
    expect(train).toContain("statuses: write");
  });

  test("without a bot token, the train starts both workflows the verdict reads", () => {
    expect(train).toContain("gh workflow run code-quality-gates.yml");
    expect(train).toContain("gh workflow run feature-staging.yml");
  });

  test("the verdict judges only train branches", () => {
    expect(verdict).toContain("startsWith(github.event.workflow_run.head_branch, 'repin-train/')");
  });
});
