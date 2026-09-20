/**
 * A mention is not coverage, and an unreadable workflow is not an uncovered one.
 *
 * @module scripts/tests/workflow-coverage
 *
 * Bean `7yvd`. The two distinctions this check exists to make are the two a
 * simpler implementation gets wrong:
 *
 *   1. Five diagrams here MENTION a `.github/workflows/*.yml` while
 *      documenting an agent process that merely touches one —
 *      `upstream-pin-watch.bpmn` names `ci-health.yml` and documents neither.
 *      Matching on filename, or on any occurrence, would count all five as
 *      coverage and report a documented repository that is not.
 *   2. A workflow whose YAML will not parse has UNKNOWN triggers. Reporting
 *      that as "dispatch-only, uncovered" shrinks the gate in silence — the
 *      `plj1` shape, a check reporting clean over what it could not see.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { autoTriggered, declaredWorkflows, surveyWorkflows } from "../check-workflow-coverage.js";

describe("a diagram DECLARES its subject", () => {
  test("the declaration is read", () => {
    const xml =
      `<bpmn:process><bpmn:extensionElements>` +
      `<folio:implements workflow=".github/workflows/docs-site.yml"/>` +
      `</bpmn:extensionElements></bpmn:process>`;
    expect(declaredWorkflows(xml)).toEqual([".github/workflows/docs-site.yml"]);
  });

  test("a MENTION in prose is not a declaration", () => {
    const xml =
      `<bpmn:documentation>Runs after ci-health.yml and reads ` +
      `.github/workflows/docs-site.yml for context</bpmn:documentation>`;
    expect(declaredWorkflows(xml)).toEqual([]);
  });

  test("several declarations on one diagram are all read", () => {
    const xml =
      `<folio:implements workflow=".github/workflows/a.yml"/>` +
      `<folio:implements workflow=".github/workflows/b.yml"/>`;
    expect(declaredWorkflows(xml)).toEqual([".github/workflows/a.yml", ".github/workflows/b.yml"]);
  });
});

describe("autoTriggered — does it fire without somebody asking?", () => {
  test.each([
    ["on:\n  push:\n    branches: [main]\njobs: {}\n", true],
    ["on:\n  schedule:\n    - cron: '0 3 * * *'\njobs: {}\n", true],
    ["on:\n  pull_request_target:\n    types: [closed]\njobs: {}\n", true],
    ["on:\n  workflow_dispatch:\njobs: {}\n", false],
    ["on:\n  workflow_call:\njobs: {}\n", false],
    ["on:\n  workflow_dispatch:\n  workflow_call:\njobs: {}\n", false],
  ])("case %#", (yaml, expected) => {
    expect(autoTriggered(yaml as string)).toBe(expected as boolean);
  });

  test("a mixed workflow is AUTO — one automatic trigger is enough", () => {
    expect(autoTriggered("on:\n  workflow_dispatch:\n  push:\njobs: {}\n")).toBe(true);
  });

  test("unparseable YAML gives a REASON, never `false`", () => {
    // `false` would read as "dispatch-only", which is a claim about a file
    // nobody could parse.
    const r = autoTriggered("on:\n  push:\n   bad\n    indent: [\njobs:\n");
    expect(typeof r).toBe("object");
  });

  test("a workflow with no `on:` is a reason, not a quiet false", () => {
    const r = autoTriggered("jobs:\n  a:\n    runs-on: x\n");
    if (typeof r === "boolean") throw new Error("expected a reason");
    expect(r.reason).toContain("no `on:`");
  });
});

describe("the survey's three states", () => {
  /** A scratch repo with a workflows directory and a `skills/workflows/` graph. */
  function repoWith(workflows: Record<string, string>, diagrams: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), "wfcov-"));
    mkdirSync(join(root, ".github", "workflows"), { recursive: true });
    for (const [n, b] of Object.entries(workflows)) writeFileSync(join(root, ".github/workflows", n), b);
    mkdirSync(join(root, "skills", "workflows"), { recursive: true });
    for (const [n, b] of Object.entries(diagrams)) writeFileSync(join(root, "skills/workflows", n), b);
    return root;
  }
  const declares = (w: string): string =>
    `<?xml version="1.0"?><bpmn:definitions><bpmn:process id="p"><bpmn:extensionElements>` +
    `<folio:implements workflow="${w}"/></bpmn:extensionElements></bpmn:process></bpmn:definitions>`;

  test("COVERED — a declaration names it", () => {
    const root = repoWith(
      { "a.yml": "on:\n  push:\njobs: {}\n" },
      { "a.bpmn": declares(".github/workflows/a.yml") },
    );
    const { rows } = surveyWorkflows(root);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.coverage).toBe("covered");
    expect(rows[0]!.auto).toBe(true);
  });

  test("UNCOVERED is a DETERMINED absence — the file read fine, nothing declares it", () => {
    const root = repoWith({ "a.yml": "on:\n  push:\njobs: {}\n" }, {});
    const { rows } = surveyWorkflows(root);
    expect(rows[0]!.coverage).toBe("uncovered");
    expect(rows[0]!.reason).toBeUndefined();
  });

  test("UNKNOWN — unreadable is never rendered as covered, even WITH a declaration", () => {
    // The declaration says a diagram exists, not that it still matches a file
    // nobody could parse.
    const root = repoWith(
      { "a.yml": "on:\n  push:\n   bad\n    indent: [\n" },
      { "a.bpmn": declares(".github/workflows/a.yml") },
    );
    const { rows } = surveyWorkflows(root);
    expect(rows[0]!.coverage).toBe("unknown");
    expect(rows[0]!.reason).toBeDefined();
  });

  test("a mention-only diagram leaves the workflow UNCOVERED", () => {
    const root = repoWith(
      { "a.yml": "on:\n  push:\njobs: {}\n" },
      {
        "other.bpmn":
          `<bpmn:definitions><bpmn:process id="p"><bpmn:documentation>` +
          `see .github/workflows/a.yml</bpmn:documentation></bpmn:process></bpmn:definitions>`,
      },
    );
    const { rows } = surveyWorkflows(root);
    expect(rows[0]!.coverage).toBe("uncovered");
  });

  test("DANGLING — a declaration naming a workflow that is not there is reported", () => {
    const root = repoWith(
      { "a.yml": "on:\n  push:\njobs: {}\n" },
      { "a.bpmn": declares(".github/workflows/gone.yml") },
    );
    const { rows, dangling } = surveyWorkflows(root);
    expect(dangling).toEqual([
      { diagram: "skills/workflows/a.bpmn", workflow: ".github/workflows/gone.yml" },
    ]);
    // And it does NOT accidentally count as coverage for the real workflow.
    expect(rows[0]!.coverage).toBe("uncovered");
  });

  test("no workflows directory is an empty survey, not a crash", () => {
    const root = mkdtempSync(join(tmpdir(), "wfcov-empty-"));
    const { rows, dangling } = surveyWorkflows(root);
    expect(rows).toEqual([]);
    expect(dangling).toEqual([]);
  });
});

describe("this repository, right now", () => {
  test("every workflow is readable — a count over unreadable files is not a count", () => {
    const { rows } = surveyWorkflows();
    expect(rows.filter((r) => r.coverage === "unknown")).toEqual([]);
  });

  test("no declaration dangles", () => {
    expect(surveyWorkflows().dangling).toEqual([]);
  });

  test("there are workflows to survey — a green run over zero files is not coverage", () => {
    expect(surveyWorkflows().rows.length).toBeGreaterThan(0);
  });
});
