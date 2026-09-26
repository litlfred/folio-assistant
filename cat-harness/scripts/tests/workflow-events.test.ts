/**
 * Which workflows are OWED for an event — and the three states that must not
 * collapse into two.
 *
 * @module scripts/tests/workflow-events
 *
 * Bean `9x9r`. The property under test is not "it parses YAML". It is that
 * **`required`, `conditional` and `not-declared` stay three answers**, because
 * the defect being fixed is exactly a collapse: `check-head-has-run` folded
 * every workflow and every event into one boolean (`runs.length > 0`) and so
 * reported a ✓ on a head whose gates had not run.
 *
 * Every tree here is SYNTHETIC. A prior session's tests in this directory
 * walked the real corpus five times and pushed a sibling past its 5s timeout;
 * and a test reading `.github/workflows/` would pass or fail on whichever
 * workflows happen to exist today, which tests the repository rather than the
 * code. One test does read the real tree, and it asserts only a property that
 * must hold for ANY tree — see its own comment.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { GITHUB_WORKFLOW_DIR, scanTriggers, triggerFor } from "../../src/core/workflow-events.js";
import { coverageFor, missingRequiredAdvice, type RunRow } from "../check-head-has-run.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

/** A throwaway repo root carrying exactly the workflow files named. */
function treeWith(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "wf-events-"));
  mkdirSync(join(root, GITHUB_WORKFLOW_DIR), { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, GITHUB_WORKFLOW_DIR, name), body);
  }
  return root;
}

const run = (name: string, event: string): RunRow => ({
  name,
  event,
  status: "completed",
  conclusion: "success",
  html_url: "https://example.invalid/run",
});

describe("triggerFor — the three states", () => {
  test("an unfiltered event is REQUIRED", () => {
    const t = triggerFor("w.yml", "name: Gates\non:\n  pull_request:\n", "pull_request");
    expect(t.requirement).toBe("required");
    expect(t.name).toBe("Gates");
    expect(t.filters).toEqual([]);
  });

  test("a path-filtered event is CONDITIONAL, and says which filter made it so", () => {
    const t = triggerFor("w.yml", "name: Drift\non:\n  pull_request:\n    paths: ['src/**']\n", "pull_request");
    expect(t.requirement).toBe("conditional");
    expect(t.filters).toEqual(["paths"]);
  });

  test("CONDITIONAL is not a synonym for `paths` — every narrowing key counts", () => {
    const t = triggerFor(
      "w.yml",
      "name: Stage\non:\n  pull_request:\n    types: [opened]\n    paths: ['docs/**']\n    branches: [main]\n",
      "pull_request",
    );
    expect(t.requirement).toBe("conditional");
    expect(t.filters).toEqual(["branches", "paths", "types"]);
  });

  test("an event the workflow does not declare is NOT-DECLARED, not a missing required", () => {
    const t = triggerFor("w.yml", "name: Nightly\non:\n  schedule:\n    - cron: '0 0 * * *'\n", "pull_request");
    expect(t.requirement).toBe("not-declared");
  });

  test("the list and scalar forms of `on:` carry no filters, so they are REQUIRED", () => {
    expect(triggerFor("a.yml", "name: A\non: [pull_request, push]\n", "pull_request").requirement).toBe("required");
    expect(triggerFor("b.yml", "name: B\non: pull_request\n", "pull_request").requirement).toBe("required");
  });

  test("a workflow with no `name:` falls back to its path, as GitHub does", () => {
    // Matching runs by name is the whole mechanism, so the fallback has to be
    // the same string the API would report. A blank name is not a valid key.
    expect(triggerFor(".github/workflows/x.yml", "on:\n  pull_request:\n", "pull_request").name).toBe(
      ".github/workflows/x.yml",
    );
  });

  test("a YAML 1.1 parser's `on: -> true` key would not blind the scan", () => {
    // `yaml` keeps `on` as a string (1.2 core schema); `Bun.YAML`/PyYAML do
    // not. Reading zero events because of a parser choice would render every
    // workflow `not-declared` — a silent all-clear, which is the one outcome
    // this module must never produce by accident.
    const t = triggerFor("w.yml", "name: Gates\ntrue:\n  pull_request:\n", "pull_request");
    expect(t.requirement).toBe("required");
  });
});

describe("scanTriggers", () => {
  test("drops not-declared, keeps required and conditional apart", () => {
    const root = treeWith({
      "gates.yml": "name: Gates\non:\n  pull_request:\n",
      "drift.yml": "name: Drift\non:\n  pull_request:\n    paths: ['a/**']\n",
      "nightly.yml": "name: Nightly\non:\n  schedule:\n    - cron: '0 0 * * *'\n",
    });
    const scan = scanTriggers(root, "pull_request");
    expect(scan.unreadable).toEqual([]);
    expect(scan.triggers.map((t) => [t.name, t.requirement])).toEqual([
      ["Drift", "conditional"],
      ["Gates", "required"],
    ]);
  });

  test("an absent workflow directory is UNREADABLE, never an empty required set", () => {
    // The falsifier for the whole module. An empty `required` list is
    // vacuously satisfied, so "could not look" must not reach the caller
    // wearing the same shape as "nothing was owed".
    const scan = scanTriggers(join(tmpdir(), "definitely-not-a-repo-9x9r"), "pull_request");
    expect(scan.triggers).toEqual([]);
    expect(scan.unreadable).toHaveLength(1);
  });

  test("one unparseable file does not discard the others, and is reported", () => {
    const root = treeWith({
      "gates.yml": "name: Gates\non:\n  pull_request:\n",
      "broken.yml": "name: [unclosed\n  on: : :\n",
    });
    const scan = scanTriggers(root, "pull_request");
    expect(scan.triggers.map((t) => t.name)).toEqual(["Gates"]);
    expect(scan.unreadable.map((u) => u.file)).toEqual([join(GITHUB_WORKFLOW_DIR, "broken.yml")]);
  });
});

describe("coverageFor — the bug this bean is about", () => {
  const scan = () =>
    scanTriggers(
      treeWith({
        "gates.yml": "name: Gates\non:\n  pull_request:\n",
        "drift.yml": "name: Drift\non:\n  pull_request:\n    paths: ['a/**']\n  push:\n",
      }),
      "pull_request",
    );

  test("a PUSH run of a workflow is not its PULL_REQUEST run", () => {
    // 9x9r in one assertion. The old check saw one run and said ✓; here the
    // same input leaves the required workflow unsatisfied.
    const cov = coverageFor([run("Drift", "push")], scan(), "pull_request");
    expect(cov.required).toEqual([
      { name: "Gates", file: join(GITHUB_WORKFLOW_DIR, "gates.yml"), ran: false },
    ]);
    expect(cov.conditional[0]?.ran).toBe(false);
  });

  test("a DISPATCH run of the required workflow does not satisfy it either", () => {
    // Measured live on PR #1222's head `28f929a`, 2026-09-24: its only run was
    // `Code-quality gates` via `workflow_dispatch`, and the old check printed
    // ✓. A dispatch resolves `refs/heads/<branch>`, not the merge ref, so it
    // is a signal about a different tree (beans `yv4z`, `sddf`).
    const cov = coverageFor([run("Gates", "workflow_dispatch")], scan(), "pull_request");
    expect(cov.required[0]?.ran).toBe(false);
  });

  test("the matching run satisfies it", () => {
    const cov = coverageFor([run("Gates", "pull_request")], scan(), "pull_request");
    expect(cov.required[0]?.ran).toBe(true);
  });

  test("a run of an unrelated workflow satisfies nothing", () => {
    const cov = coverageFor([run("Something Else", "pull_request")], scan(), "pull_request");
    expect(cov.required.every((w) => w.ran)).toBe(false);
  });

  test("unreadable files are carried through to the caller, not swallowed", () => {
    const cov = coverageFor([], scanTriggers(join(tmpdir(), "nope-9x9r"), "pull_request"), "pull_request");
    expect(cov.unreadable).toHaveLength(1);
  });
});

describe("missingRequiredAdvice", () => {
  test("on a conflicted PR it says merge the base in, and NEVER dispatch", () => {
    // The `sddf` regression guard: this is the branch whose old advice was
    // actively harmful, and it exists as a pure function so a test can reach it.
    const s = missingRequiredAdvice(["Gates"], "conflicted");
    expect(s).toContain("MERGE THE BASE BRANCH IN");
    expect(s).toContain("Do NOT dispatch");
  });

  test("on a mergeable PR dispatching is offered, because the refs agree", () => {
    expect(missingRequiredAdvice(["Gates"], "mergeable")).toContain("safe HERE");
  });

  test("on an unknown merge state it refuses to recommend a dispatch", () => {
    const s = missingRequiredAdvice(["Gates"], "unknown");
    expect(s).toContain("by hand");
    expect(s).not.toContain("safe HERE");
  });

  test("it names the workflows, so the reader need not go looking", () => {
    expect(missingRequiredAdvice(["Gates", "Other"], "mergeable")).toContain("Gates, Other");
  });
});

describe("this repository's own workflows", () => {
  test("at least one workflow is REQUIRED on pull_request", () => {
    // The only assertion made against the real tree, and deliberately a
    // property rather than a count: if every `pull_request` workflow were
    // filtered, `required` would be empty and the check would pass
    // vacuously on every commit. Naming a number here would instead fail the
    // day somebody legitimately adds or renames a workflow — a count in a
    // test is the same defect as a count in prose.
    const scan = scanTriggers(repoRootFor(resolve(import.meta.dir, "..", "..")), "pull_request");
    expect(scan.unreadable).toEqual([]);
    expect(scan.triggers.filter((t) => t.requirement === "required").length).toBeGreaterThan(0);
  });
});
