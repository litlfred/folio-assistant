/**
 * The gate runner derives its list, and refuses to report an empty one.
 *
 * Bean `folio-assistant-n60j`. The property under test is not "it runs
 * things" — it is that **the list is not authored here**, and that a reader
 * that finds nothing says so instead of exiting clean.
 *
 * @module scripts/tests/gates.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  GATES_WORKFLOW,
  NoCheckScriptsFound,
  NoGatesFound,
  SCRIPT_EXEMPTIONS,
  STEP_EXEMPTIONS,
  checkScriptNames,
  commandRunsScript,
  commandsCiRuns,
  gatesFrom,
  loadGates,
  otherWorkflowSteps,
  scriptExemptionFor,
  unclassifiedSteps,
  unrunScripts,
} from "../gates.ts";
import { repoRootFor } from "../../schemas/cat-harness.js";

// THE REPOSITORY root — `GATES_WORKFLOW` is `.github/workflows/…`. See the
// same constant in `gates.ts`.
const ROOT = repoRootFor(resolve(import.meta.dir, "../.."));
/** The REPOSITORY root — where `.github/workflows/` lives. */
const REPO = ROOT;

describe("the gates come from the workflow, not from a list", () => {
  test("the real workflow yields a substantial set", () => {
    const gates = loadGates(ROOT);
    // Not a pinned number: pinning it would make this the hand-maintained
    // list the module exists to avoid, and every added gate a failing test.
    // The floor asserts the reader WORKS; the ceiling would assert the
    // workflow never grows.
    expect(gates.length).toBeGreaterThan(10);
  });

  test("it finds more than a person hand-lists — the defect that prompted it", () => {
    // Measured 2026-09-19: the agent writing this had been running 17 gates
    // by hand and reporting them as the sweep. If the derived set ever drops
    // to around that, the extraction has quietly stopped reading most of the
    // workflow and the hand-list would be back, unnoticed.
    expect(loadGates(ROOT).length).toBeGreaterThan(20);
  });

  test("`--all` is a superset of the fast set, and strictly larger", () => {
    const fast = loadGates(ROOT).map((g) => g.command);
    const all = loadGates(ROOT, { all: true }).map((g) => g.command);
    for (const c of fast) expect(all).toContain(c);
    // The browser job exists and contributes; if this fails, either the e2e
    // job went away or the fast/slow split has stopped meaning anything.
    expect(all.length).toBeGreaterThan(fast.length);
  });

  test("the browser-only gate is in `--all` and NOT in the fast set", () => {
    // `render:bpmn:check` renders through Chromium. It once passed "locally"
    // only because a browser had been staged earlier in the session, which
    // is the precise green-here-red-there gap these gates close.
    const fast = loadGates(ROOT).map((g) => g.command);
    const all = loadGates(ROOT, { all: true }).map((g) => g.command);
    expect(all.some((c) => c.includes("render:bpmn:check"))).toBe(true);
    expect(fast.some((c) => c.includes("render:bpmn:check"))).toBe(false);
  });

  test("every extracted command is a bun invocation, in workflow order", () => {
    const gates = loadGates(ROOT, { all: true });
    for (const g of gates) expect(g.command).toMatch(/^(bun|bunx) /);
    // Order matters: `bun test` before the slower graph audits is what makes
    // the runner usable, and it is the workflow's order rather than a sort.
    const cmds = gates.map((g) => g.command);
    expect(cmds.indexOf("bun test")).toBeLessThan(cmds.indexOf("bun run kg:audit:check"));
  });

  test("each gate carries the step name the Actions UI shows", () => {
    // So a local failure and a CI failure are findable by the same string.
    const g = loadGates(ROOT).find((x) => x.command === "bun run ns:check");
    expect(g?.step).toBe("namespace vocabulary is complete");
    expect(g?.job).toBe("typescript");
  });
});

describe("an empty extraction is a broken reader, never a clean sweep", () => {
  test("a workflow with no bun steps extracts nothing — the pure half", () => {
    // `gatesFrom` reports what it found and does not judge it. The judging
    // is `loadGates`'s job, below. Splitting them matters: a pure reader
    // that threw could not be used to ASK whether a workflow has gates.
    expect(
      gatesFrom(`
jobs:
  typescript:
    steps:
      - run: echo nothing here
`),
    ).toEqual([]);
  });

  test("a step whose run block is absent is skipped, not crashed on", () => {
    // `uses:` steps (checkout, setup-bun) have no `run`. They are the
    // majority of a real job's steps.
    expect(
      gatesFrom(`
jobs:
  typescript:
    steps:
      - uses: actions/checkout@v4
      - run: bun run lint
`),
    ).toEqual([{ job: "typescript", step: "(unnamed step)", command: "bun run lint" }]);
  });

  test("loadGates THROWS on a workflow it cannot read gates from", () => {
    // The vacuity guard, exercised end to end against a real file rather
    // than by re-implementing the check in the test. A runner that executes
    // an empty list exits 0 and reads as a pass — the shape already paid for
    // three times here: a grep over zero Lean files reporting OK, a ruff
    // scan of missing paths reporting a baseline it never computed, and
    // readme:sync:check passing over a README with no markers.
    const dir = mkdtempSync(join(tmpdir(), "gates-"));
    try {
      mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
      writeFileSync(
        join(dir, GATES_WORKFLOW),
        "jobs:\n  typescript:\n    steps:\n      - run: echo hi\n",
      );
      expect(() => loadGates(dir)).toThrow(NoGatesFound);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("the refusal says it is not green", () => {
    // A reader who sees this must not read it as "no gates needed".
    const msg = new NoGatesFound("w.yml").message;
    expect(msg).toContain("not a clean sweep");
    expect(msg).toContain("do not treat this as green");
  });
});

describe("the workflow this reads is the one CI runs", () => {
  test("the declared path exists and is a real workflow", () => {
    // If somebody renames the workflow, this fails here rather than the
    // runner silently gating on a file that no longer drives CI.
    const text = readFileSync(join(ROOT, GATES_WORKFLOW), "utf-8");
    expect(text).toContain("name: Code-quality gates");
    expect(text).toMatch(/^\s*pull_request:/m);
  });
});

describe("a strict reader and a loose one agree", () => {
  test("no `bun` line in the workflow is silently dropped", () => {
    // ONE STRICT READER, ONE LOOSE ONE, AND AN ASSERTION THAT THEY AGREE.
    //
    // Carried over from `ci-gates.test.ts`, retired 2026-09-20 in favour of
    // this module. That one read the YAML with a regex whose path branch had
    // the directory written in, so the move (bean `wggr`) made it stop seeing
    // three gates — silently, because a gate a reader cannot see is not a
    // gate it reports as missing. This cross-check is what caught it.
    //
    // The parser here cannot narrow the same way; it walks every job, step
    // and line. The drop it CAN suffer is a gate the workflow invokes in a
    // shape the `^(bun|bunx) ` filter does not match — indented under a
    // conditional, chained after a `cd`, wrapped in a shell function. That is
    // a real possibility and nothing else here would notice it.
    //
    // Deliberately over `--all`: the fast set is a SUBSET by design, so
    // comparing the loose scan against it would fail on every browser job
    // step and say nothing about dropping.
    //
    // Comment lines are stripped first, and that is not a convenience — this
    // workflow documents its own past defects in prose, and one comment
    // quotes a folded line that once ran two commands as one (bean `d2kp`).
    // Counting those would report gates nobody runs, which is a different
    // lie from the one this guards but a lie all the same.
    const yaml = readFileSync(join(ROOT, GATES_WORKFLOW), "utf-8")
      .split("\n")
      .filter((l) => !/^\s*#/.test(l))
      .join("\n");
    // BOTH SHAPES. A step's command is either its own line inside a folded
    // `run: |` block, or it follows `run:` on one line — and a first draft of
    // this matched only the former, finding 18 where the workflow runs 37.
    // It passed, because a loose scan that sees half the file cannot disagree
    // with the strict one about the half it never looked at. The floor below
    // is what turned that into a failure instead of a green cross-check.
    const loose = [...yaml.matchAll(/^\s*(?:run:\s*)?(bunx? .+?)\s*$/gm)].map((m) => m[1]!);
    const found = new Set(loadGates(ROOT, { all: true }).map((g) => g.command));
    expect(loose.filter((c) => !found.has(c))).toEqual([]);
    // And the guard is not vacuous — a loose scan that matched nothing would
    // pass the filter above while proving nothing at all.
    expect(loose.length).toBeGreaterThan(30);
  });
});

describe("every workflow step is accounted for", () => {
  test("the foreign-step reader finds steps — an empty read is not a clean one", () => {
    // `unclassifiedSteps` filters this list, so a reader that returns nothing
    // reports nothing unclassified: a clean run over a directory it could not
    // read. The property is asserted here rather than inferred from silence.
    expect(otherWorkflowSteps(REPO).length).toBeGreaterThan(20);
  });

  test("no step CI runs is unclassified", () => {
    // THE RATCHET, and the reason the table exists. A new workflow step lands
    // in the gate set or in STEP_EXEMPTIONS with a reason, and never in the
    // gap between them — which is where `gen-site-jsonld --check` sat while
    // `bun run gates --all` passed 46 gates on a tree CI then rejected.
    const missing = unclassifiedSteps(REPO).map((u) => `${u.file}: ${u.step.command}`);
    expect(missing).toEqual([]);
  });

  test("every exemption states a reason", () => {
    // Same rule `folio:no-skill` and `workflow-policy.json` follow: an
    // exemption whose justification is "" is one somebody added to get to
    // green, and nobody can review it afterwards.
    const reasonless = STEP_EXEMPTIONS.filter((e) => !e.reason.trim()).map((e) => e.match);
    expect(reasonless).toEqual([]);
  });

  test("every exemption still matches something CI runs", () => {
    // The other direction, and the one that rots silently: a workflow step is
    // deleted or reworded, its exemption stays, and the table slowly becomes
    // a list of claims about a CI that no longer exists. Each entry must earn
    // its place on every run.
    const commands = otherWorkflowSteps(REPO).map((u) => u.step.command);
    const stale = STEP_EXEMPTIONS.filter((e) => !commands.some((c) => c.includes(e.match)));
    expect(stale.map((e) => e.match)).toEqual([]);
  });
});

describe("every check script is accounted for — the direction nothing asked", () => {
  test("the script scan finds scripts — an empty read is not full coverage", () => {
    // `unrunScripts` FILTERS this list, so a scan returning nothing reports
    // nothing unrun: total coverage over a `package.json` it could not read.
    // The scan throws instead, and this asserts the floor rather than
    // inferring it from silence.
    expect(checkScriptNames(REPO).length).toBeGreaterThan(20);
  });

  test("an empty scan THROWS rather than reporting full coverage", () => {
    const root = mkdtempSync(join(tmpdir(), "gates-noscripts-"));
    try {
      writeFileSync(join(root, "package.json"), JSON.stringify({ scripts: { build: "x" } }));
      expect(() => checkScriptNames(root)).toThrow(NoCheckScriptsFound);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("no check script is unrun", () => {
    // THE RATCHET for this direction. `unclassifiedSteps` asks "CI runs this
    // — does the local set?", and its domain is steps found IN WORKFLOWS, so
    // it is structurally unable to see a check that appears in no workflow at
    // all. Nine did. `translate-kg-viewer:check` was RED on main while CI was
    // green, because nothing ran it — bean `ot9a`.
    expect(unrunScripts(REPO)).toEqual([]);
  });

  test("the commands read from CI are non-empty — the same vacuity trap", () => {
    // `unrunScripts` reports everything as unrun if this returns nothing, so
    // a broken reader here fails loudly rather than flooding. Asserted so the
    // clean result above cannot come from an unreadable workflow directory.
    expect(commandsCiRuns(REPO).length).toBeGreaterThan(20);
  });

  test("a script name must end at a TOKEN BOUNDARY, not merely match", () => {
    // `check:partition` is the gate; `check:partition:edges` is a report. A
    // substring match would read the wired gate as covering the unwired
    // report — the two scripts in this repository that differ exactly in
    // that way — and the report would count as gated.
    expect(commandRunsScript("bun run check:partition", "check:partition")).toBe(true);
    expect(commandRunsScript("bun run check:partition:edges", "check:partition")).toBe(false);
    expect(commandRunsScript("bun run check:partition", "check:partition:edges")).toBe(false);
    // A trailing flag is still a run of that script.
    expect(commandRunsScript("bun run check:l1-complete -- --check", "check:l1-complete")).toBe(true);
    // And a name inside a longer word is not a run of it.
    expect(commandRunsScript("bun run xcheck:partition", "check:partition")).toBe(false);
  });

  test("every script exemption states a reason", () => {
    // Same rule as STEP_EXEMPTIONS above: an exemption with an empty
    // justification is one somebody added to get to green.
    const reasonless = SCRIPT_EXEMPTIONS.filter((e) => !e.reason.trim()).map((e) => e.script);
    expect(reasonless).toEqual([]);
  });

  test("every script exemption still names a script that EXISTS", () => {
    // The direction that rots silently, and the one this bean was made of. A
    // script is renamed or dropped, its exemption stays, and the table
    // becomes a set of claims about a repository that has moved on. The six
    // reasons these replaced lived in a YAML comment, where exactly that had
    // happened: `translate-*:check` was excluded as needing "a translation
    // toolchain not installed on this runner", and both run clean on a bare
    // checkout.
    const names = new Set(checkScriptNames(REPO));
    const stale = SCRIPT_EXEMPTIONS.filter((e) => !names.has(e.script)).map((e) => e.script);
    expect(stale).toEqual([]);
  });

  test("an exemption matches by exact name, never by prefix", () => {
    // `check:partition:edges` is exempt and `check:partition` is not. A
    // prefix or substring lookup would exempt the gate along with the report.
    expect(scriptExemptionFor("check:partition:edges")).toBeDefined();
    expect(scriptExemptionFor("check:partition")).toBeUndefined();
  });

  test("an unwired script IS reported — the check can fail", () => {
    // The clean result above is only evidence if this reports a real gap.
    // Built as a fixture rather than by mutating the repo: a gate that has
    // never been shown failing is a gate nobody has tested.
    const root = mkdtempSync(join(tmpdir(), "gates-unrun-"));
    try {
      mkdirSync(join(root, ".github", "workflows"), { recursive: true });
      writeFileSync(
        join(root, "package.json"),
        JSON.stringify({ scripts: { "check:wired": "x", "check:orphan": "y" } }),
      );
      writeFileSync(
        join(root, GATES_WORKFLOW),
        "jobs:\n  typescript:\n    steps:\n      - run: bun run check:wired\n",
      );
      expect(unrunScripts(root)).toEqual(["check:orphan"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
