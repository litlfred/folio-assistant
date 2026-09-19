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

import { GATES_WORKFLOW, NoGatesFound, gatesFrom, loadGates } from "../gates.ts";

const ROOT = resolve(import.meta.dir, "../..");

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
