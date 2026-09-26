/**
 * ACTIVE vs STATIC — the question an arriving agent asks first.
 *
 * The test that matters most is the one that fails for the FIRST definition
 * tried: "declares any `state` graph" made the repository root ACTIVE on an
 * ingestion queue. That is pinned below so the narrowing cannot be undone by
 * somebody who reads `recordsWork` as a synonym for `holds: "state"`.
 */
import { describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { defaultGraphKinds, isActiveKg, undecidedWorkKinds, workPlanGraphsIn } from "../../schemas/cat-harness";
import { formatReport } from "../check-graph-kind-work";
import {  } from "../../schemas/cat-harness.js";
import { writeDeclaration } from "../../test/support/instance-fixture.js";

function repoWith(instances: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), "activekg-"));
  writeDeclaration(root, JSON.stringify({ name: "root" }));
  for (const [name, decl] of Object.entries(instances)) {
    mkdirSync(join(root, name), { recursive: true });
    writeDeclaration(join(root, name), JSON.stringify(decl));
  }
  return root;
}

describe("recordsWork is narrower than holds: state", () => {
  it("an ingestion queue is live state and is NOT work", () => {
    // The measured failure of the first definition: `uploads` made the
    // repository root and who-iris ACTIVE, sending an agent to look for
    // something to prioritise in a directory of unprocessed files.
    expect(defaultGraphKinds.get("uploads")?.holds).toBe("state");
    expect(defaultGraphKinds.get("uploads")?.recordsWork).toBe(false);
  });

  it("beans and todos both record work, and are still different things", () => {
    // `AGENTS.md` forbids a second work plan: beans is the AGENT's, todos are
    // a PERSON's outstanding work. Both answer this question true, which is
    // why it asks "records work" rather than "is the work plan".
    expect(defaultGraphKinds.get("beans")?.recordsWork).toBe(true);
    expect(defaultGraphKinds.get("todos")?.recordsWork).toBe(true);
  });

  it("a BPMN instance mid-flight records work", () => {
    expect(defaultGraphKinds.get("workflow-state")?.recordsWork).toBe(true);
  });

  it("every state kind has decided — no kind ships undecided", () => {
    expect(undecidedWorkKinds()).toEqual([]);
  });

  it("content and context kinds are not asked", () => {
    // Requiring the field of them would force three layers to answer a
    // question that does not apply, which is how a meaningless default
    // arrives.
    expect(defaultGraphKinds.get("cat-harness")?.recordsWork).toBeUndefined();
    expect(defaultGraphKinds.get("memory")?.recordsWork).toBeUndefined();
  });
});

describe("the verdict is asked of the REPOSITORY, not one instance", () => {
  it("a work-plan graph anywhere in the checkout makes it active", () => {
    const root = repoWith({
      layer: { name: "layer", directories: [{ id: "b", path: "beans/", dependents: "skip", graphKinds: ["beans"] }] },
    });
    expect(isActiveKg(root)).toBe(true);
    expect(workPlanGraphsIn(root).plan).toEqual([{ instance: "layer", kinds: ["beans"] }]);
    rmSync(root, { recursive: true, force: true });
  });

  it("an instance with only non-work state is static", () => {
    const root = repoWith({
      layer: { name: "layer", directories: [{ id: "u", path: "uploads/", dependents: "skip", graphKinds: ["uploads"] }] },
    });
    expect(isActiveKg(root)).toBe(false);
    rmSync(root, { recursive: true, force: true });
  });

  it("this repository is ACTIVE, on cat-harness's beans and todos", () => {
    const repo = resolve(import.meta.dir, "..", "..", "..");
    expect(isActiveKg(repo)).toBe(true);
    const { plan } = workPlanGraphsIn(repo);
    expect(plan.map((p) => p.instance)).toContain("cat-harness");
    // The ROOT instance declares no work-plan graph of its own — cat-harness
    // declares beans at `scope: "repository"`. Asking per instance would call
    // the one place a reader actually stands static.
    expect(plan.map((p) => p.instance)).not.toContain("folio-assistant");
  });
});

describe("the gate reports what it examined", () => {
  it("prints the count even when nothing is wrong", () => {
    expect(formatReport([], 11)).toContain("11 kind(s) hold");
  });

  it("no state kinds at all is NOT a pass", () => {
    expect(formatReport([], 0)).toContain("NOTHING WAS EXAMINED");
  });

  it("an undecided kind is named with the question it has to answer", () => {
    expect(formatReport(["mystery"], 5)).toContain("partway through");
  });
});

describe("could not determine is a THIRD state, never STATIC", () => {
  it("an unreadable declaration yields undefined, not false", () => {
    // The first draft caught the parse error and skipped, which rendered
    // STATIC — telling an arriving agent there is no work here when nobody
    // had been able to look.
    const root = mkdtempSync(join(tmpdir(), "activekg-bad-"));
    writeDeclaration(root, JSON.stringify({ name: "root" }));
    mkdirSync(join(root, "broken"), { recursive: true });
    writeDeclaration(join(root, "broken"), "{ not json", "broken");
    expect(isActiveKg(root)).toBeUndefined();
    expect(workPlanGraphsIn(root).unreadable).toHaveLength(1);
    rmSync(root, { recursive: true, force: true });
  });

  it("a real work plan outranks an unreadable sibling", () => {
    // Work that IS found is found, whatever else failed to parse.
    const root = mkdtempSync(join(tmpdir(), "activekg-mix-"));
    writeDeclaration(root, JSON.stringify({ name: "root" }));
    mkdirSync(join(root, "ok"), { recursive: true });
    writeDeclaration(join(root, "ok"), JSON.stringify({ name: "ok", directories: [{ id: "b", path: "beans/", dependents: "skip", graphKinds: ["beans"] }] }));
    mkdirSync(join(root, "broken"), { recursive: true });
    writeDeclaration(join(root, "broken"), "{ not json", "broken");
    expect(isActiveKg(root)).toBe(true);
    rmSync(root, { recursive: true, force: true });
  });
});
