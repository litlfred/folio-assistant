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

import { BOOTSTRAP_PROCESSES_NS, CAT_HARNESS_PROCESSES_NS } from "../../schemas/namespaces.ts";

import {
  autoTriggered,
  compareJobs,
  declaredJobs,
  declaredWorkflows,
  surveyWorkflows,
  workflowJobs,
} from "../check-workflow-coverage.js";

/** The binding every real diagram carries; readers recognise our elements by it (bean 12s9). */
const BINDS = `xmlns:bootstrap.processes="${BOOTSTRAP_PROCESSES_NS}" xmlns:cat-harness.processes="${CAT_HARNESS_PROCESSES_NS}"`;

describe("a diagram DECLARES its subject", () => {
  test("a declaration in a document that never binds our namespace is not ours", () => {
    // Bean 12s9: elements are recognised by namespace, not by the text `folio:`.
    expect(declaredWorkflows(`<cat-harness.processes:implements workflow=".github/workflows/x.yml"/>`)).toEqual([]);
  });

  test("the declaration is read", () => {
    const xml =
      `<bpmn:process ${BINDS}><bpmn:extensionElements>` +
      `<cat-harness.processes:implements workflow=".github/workflows/docs-site.yml"/>` +
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
      `<bpmn:process ${BINDS}>` +
      `<cat-harness.processes:implements workflow=".github/workflows/a.yml"/>` +
      `<cat-harness.processes:implements workflow=".github/workflows/b.yml"/>` +
      `</bpmn:process>`;
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
  /**
   * A scratch repo with a workflows directory and a `processes/` graph.
   *
   * Every call below passes the root TWICE — as the repository root and as the
   * instance root — because in this checkout they differ: `.github/workflows/`
   * is at the repository root and the diagrams are under `cat-harness/`. A
   * first version of both the tool and these tests conflated them, and the
   * tests could not catch it, because a scratch repo puts both at one path.
   * Passing both explicitly is what makes the distinction visible here.
   */
  function repoWith(workflows: Record<string, string>, diagrams: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), "wfcov-"));
    mkdirSync(join(root, ".github", "workflows"), { recursive: true });
    for (const [n, b] of Object.entries(workflows)) writeFileSync(join(root, ".github/workflows", n), b);
    mkdirSync(join(root, "processes"), { recursive: true });
    for (const [n, b] of Object.entries(diagrams)) writeFileSync(join(root, "processes", n), b);
    return root;
  }
  const declares = (w: string): string =>
    `<?xml version="1.0"?><bpmn:definitions ${BINDS}><bpmn:process id="p"><bpmn:extensionElements>` +
    `<cat-harness.processes:implements workflow="${w}"/></bpmn:extensionElements></bpmn:process></bpmn:definitions>`;

  test("COVERED — a declaration names it", () => {
    const root = repoWith(
      { "a.yml": "on:\n  push:\njobs: {}\n" },
      { "a.bpmn": declares(".github/workflows/a.yml") },
    );
    const { rows } = surveyWorkflows(root, root);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.coverage).toBe("covered");
    expect(rows[0]!.auto).toBe(true);
  });

  test("UNCOVERED is a DETERMINED absence — the file read fine, nothing declares it", () => {
    const root = repoWith({ "a.yml": "on:\n  push:\njobs: {}\n" }, {});
    const { rows } = surveyWorkflows(root, root);
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
    const { rows } = surveyWorkflows(root, root);
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
    const { rows } = surveyWorkflows(root, root);
    expect(rows[0]!.coverage).toBe("uncovered");
  });

  test("DANGLING — a declaration naming a workflow that is not there is reported", () => {
    const root = repoWith(
      { "a.yml": "on:\n  push:\njobs: {}\n" },
      { "a.bpmn": declares(".github/workflows/gone.yml") },
    );
    const { rows, dangling } = surveyWorkflows(root, root);
    expect(dangling).toEqual([
      { diagram: "processes/a.bpmn", workflow: ".github/workflows/gone.yml" },
    ]);
    // And it does NOT accidentally count as coverage for the real workflow.
    expect(rows[0]!.coverage).toBe("uncovered");
  });

  test("no workflows directory is an empty survey, not a crash", () => {
    const root = mkdtempSync(join(tmpdir(), "wfcov-empty-"));
    const { rows, dangling } = surveyWorkflows(root, root);
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

  test("the diagrams are FOUND — the two roots differ here, and conflating them found none", () => {
    // THE REGRESSION TEST for the defect above, and it has to live here
    // because it is unreproducible in a scratch repo. `.github/workflows/` is
    // at the repository root; the diagrams are in the graph `cat-harness/`
    // declares. Passing the repository root for both found ZERO diagrams and
    // reported 0/38 with declarations sitting on disk — a clean-looking run
    // over a directory it never opened.
    //
    // Asserting "> 0" rather than a count: a number here would be a claim
    // about how many diagrams somebody has drawn, which changes, and
    // `check:workflow-coverage` is where that number belongs.
    const covered = surveyWorkflows().rows.filter((r) => r.coverage === "covered");
    expect(covered.length).toBeGreaterThan(0);
  });

  test("there are workflows to survey — a green run over zero files is not coverage", () => {
    expect(surveyWorkflows().rows.length).toBeGreaterThan(0);
  });
});

describe("drift — the diagram still matches the workflow it documents", () => {
  /**
   * The half the bean cared about most. `feature-staging.bpmn` had three
   * start events for the workflow's three jobs and NOTHING saying which node
   * was which, so adding a fourth job left every check green — and the bean's
   * own words are that a diagram which drifts is worse than none, because it
   * is consulted.
   */
  const node = (id: string, job?: string): string =>
    job === undefined
      ? `<bpmn:startEvent id="${id}" name="x"><bpmn:outgoing>f</bpmn:outgoing></bpmn:startEvent>`
      : `<bpmn:startEvent id="${id}" name="x"><bpmn:extensionElements>` +
        `<cat-harness.processes:job name="${job}"/></bpmn:extensionElements></bpmn:startEvent>`;

  /** Inside a document that binds our namespace, as every real diagram does (bean 12s9). */
  const doc = (body: string): string => `<bpmn:definitions ${BINDS}>${body}</bpmn:definitions>`;

  describe("reading the declaration", () => {
    test("a job is attributed to the element that CONTAINS it", () => {
      expect(declaredJobs(doc(node("Start_A", "stage")))).toEqual([{ node: "Start_A", job: "stage" }]);
    });

    test("a SELF-CLOSING node declares nothing, and does not steal the next job", () => {
      // The near-miss a proximity match makes: walking back to the nearest
      // preceding `id="…"` attributes a job to whatever was typed above it,
      // which reads correct in every example somebody tries.
      const xml = doc(`<bpmn:endEvent id="End_X" name="x"/>` + node("Start_A", "stage"));
      expect(declaredJobs(xml)).toEqual([{ node: "Start_A", job: "stage" }]);
    });

    test("several nodes each declaring a job are all read", () => {
      const xml = doc(node("S1", "a") + node("S2", "b"));
      expect(declaredJobs(xml).map((j) => j.job)).toEqual(["a", "b"]);
    });

    test("a node with extension elements but no `folio:job` declares nothing", () => {
      const xml = doc(`<bpmn:task id="T" name="x"><bpmn:extensionElements>` +
        `<bootstrap.processes:skill ref="s"/></bpmn:extensionElements></bpmn:task>`);
      expect(declaredJobs(xml)).toEqual([]);
    });
  });

  describe("reading the workflow's real jobs", () => {
    test("the job names come back in order", () => {
      expect(workflowJobs("on:\n  push:\njobs:\n  stage:\n    runs-on: x\n  cleanup:\n    runs-on: x\n"))
        .toEqual(["stage", "cleanup"]);
    });

    test("UNPARSEABLE yaml is a REASON, not an empty list", () => {
      // An empty list would make every declared job look like an `extra`,
      // turning a parse failure into a wall of false findings pointing at a
      // diagram that is fine.
      const r = workflowJobs("jobs:\n  - [unbalanced\n");
      expect(typeof r === "object" && "reason" in r).toBe(true);
    });

    test("no `jobs:` key at all is a reason too", () => {
      const r = workflowJobs("on:\n  push:\n");
      expect(r).toEqual({ reason: "declares no `jobs:`" });
    });

    test("`jobs:` that is a LIST is a reason — it is not a mapping of names", () => {
      const r = workflowJobs("jobs:\n  - a\n  - b\n");
      expect(r).toEqual({ reason: "`jobs:` is not a mapping" });
    });
  });

  describe("comparing them, in BOTH directions", () => {
    test("matching sets drift in neither direction", () => {
      expect(compareJobs(["a", "b"], ["b", "a"])).toEqual({
        declared: true, missing: [], extra: [], duplicated: [],
      });
    });

    test("a job with NO node is missing — the workflow gained one", () => {
      expect(compareJobs(["a", "b"], ["a"]).missing).toEqual(["b"]);
    });

    test("a node naming a job the workflow does NOT have is extra — it lost one", () => {
      expect(compareJobs(["a"], ["a", "gone"]).extra).toEqual(["gone"]);
    });

    test("two nodes claiming ONE job is reported rather than silently deduped", () => {
      // Deduping would let a diagram claim complete coverage of two jobs with
      // one of them named twice and the other not at all — and `missing`
      // alone would still catch that, but the duplicate is the actual mistake
      // and naming it is what tells somebody where to look.
      expect(compareJobs(["a", "b"], ["a", "a", "b"]).duplicated).toEqual(["a"]);
    });

    test("NOTHING declared is `declared: false`, not fully drifted", () => {
      // "Nobody has said yet" and "said, and wrong" are different answers,
      // and only the second is a finding.
      const d = compareJobs(["a", "b"], []);
      expect([d.declared, d.missing]).toEqual([false, ["a", "b"]]);
    });
  });

  describe("over the whole survey", () => {
    function repo(workflow: string, diagram: string): string {
      const root = mkdtempSync(join(tmpdir(), "wfdrift-"));
      mkdirSync(join(root, ".github", "workflows"), { recursive: true });
      writeFileSync(join(root, ".github/workflows/a.yml"), workflow);
      mkdirSync(join(root, "processes"), { recursive: true });
      writeFileSync(join(root, "processes/a.bpmn"), diagram);
      return root;
    }
    const diagram = (body: string): string =>
      `<?xml version="1.0"?><bpmn:definitions ${BINDS}><bpmn:process id="p"><bpmn:extensionElements>` +
      `<cat-harness.processes:implements workflow=".github/workflows/a.yml"/></bpmn:extensionElements>` +
      `${body}</bpmn:process></bpmn:definitions>`;
    const twoJobs = "on:\n  push:\njobs:\n  stage:\n    runs-on: x\n  cleanup:\n    runs-on: x\n";

    test("a covered workflow whose jobs all have nodes reports no drift", () => {
      const root = repo(twoJobs, diagram(node("S1", "stage") + node("S2", "cleanup")));
      const j = surveyWorkflows(root, root).rows[0]!.jobs!;
      expect([j.declared, j.missing, j.extra]).toEqual([true, [], []]);
    });

    test("a job added to the workflow shows up as missing", () => {
      const root = repo(twoJobs, diagram(node("S1", "stage")));
      expect(surveyWorkflows(root, root).rows[0]!.jobs!.missing).toEqual(["cleanup"]);
    });

    test("an UNCOVERED workflow has no drift result — there is nothing to compare", () => {
      const root = repo(twoJobs, "");
      writeFileSync(join(root, "processes/a.bpmn"), "<bpmn:definitions/>");
      expect(surveyWorkflows(root, root).rows[0]!.jobs).toBeUndefined();
    });

    test("a covered workflow whose `jobs:` cannot be read goes UNKNOWN, not drift-free", () => {
      // The pass-shaped blindness this whole file is against: reporting a
      // covered workflow as having nothing to say about its jobs.
      const root = repo("on:\n  push:\njobs:\n  - a\n", diagram(node("S1", "stage")));
      const row = surveyWorkflows(root, root).rows[0]!;
      expect(row.coverage).toBe("unknown");
      expect(row.jobs).toBeUndefined();
    });
  });

  describe("this repository, right now", () => {
    test("no documented workflow has drifted", () => {
      const drifted = surveyWorkflows().rows.filter(
        (r) => r.jobs?.declared && r.jobs.missing.length + r.jobs.extra.length + r.jobs.duplicated.length > 0,
      );
      expect(drifted.map((r) => r.path)).toEqual([]);
    });

    test("every documented workflow DECLARES its jobs — coverage without it is unchecked", () => {
      // A diagram that names no job is one the drift check cannot see. That
      // is honest in the report, but it must not become the norm: a covered
      // workflow with no declaration is coverage nobody is verifying.
      const undeclared = surveyWorkflows().rows.filter((r) => r.jobs && !r.jobs.declared);
      expect(undeclared.map((r) => r.path)).toEqual([]);
    });
  });
});
