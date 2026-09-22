/**
 * The epic-under-epic rule, falsified — because for months it could not fire.
 *
 * Bean `itka`. `ROOT_TYPES` was applied to the whole loop, so no epic ever
 * entered it and `b.type === "epic" && p.type === "epic"` was dead code. The
 * summary line asserted the rule anyway. Measured the day it was found: **0
 * epics** among the 179 open beans the loop ran over.
 *
 * A rule that cannot fire, reported as verified, is strictly worse than no
 * rule — it is the `xom7` shape turned on a checker. So these tests pin
 * REACHABILITY first and the rule's content second: the interesting failure
 * was never "the rule is wrong", it was "the rule is not there".
 */

import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { checkBeanParents } from "../check-bean-parents.ts";

interface Spec {
  id: string;
  type: string;
  status?: string;
  parent?: string;
}

/** A bean store on disk, because the reader reads files. */
function store(...beans: Spec[]): string {
  const root = mkdtempSync(join(tmpdir(), "beanparents-"));
  mkdirSync(join(root, "beans", "defs"), { recursive: true });
  // `graphKinds`, and a path relative to THIS file's directory — the shape
  // `beans/beans.json` actually uses. Guessing it wrong made the first run of
  // these tests fail on the fixture rather than on the rule.
  writeFileSync(
    join(root, "beans", "beans.json"),
    JSON.stringify({ name: "test", directories: [{ id: "defs", path: "defs", graphKinds: ["bean-defs"] }] }),
  );
  for (const b of beans) {
    const fm = [
      "---",
      `# ${b.id}`,
      `title: '${b.id} title'`,
      `status: ${b.status ?? "todo"}`,
      `type: ${b.type}`,
      ...(b.parent ? [`parent: ${b.parent}`] : []),
      "---",
      "",
      "body",
      "",
    ].join("\n");
    writeFileSync(join(root, "beans", "defs", `${b.id}.md`), fm);
  }
  return root;
}

const ok = (r: { problems: string[] }) => r.problems.length === 0;

describe("the epic-under-epic rule is REACHABLE — the property that was missing", () => {
  test("an epic parented to an epic is a problem", () => {
    const r = checkBeanParents(store({ id: "m1", type: "milestone" }, { id: "e1", type: "epic", parent: "m1" }, { id: "e2", type: "epic", parent: "e1" }));
    expect(ok(r)).toBe(false);
    expect(r.problems.join("\n")).toContain("e2");
    expect(r.problems.join("\n")).toContain("not another epic");
  });

  test("...and the OLD filter would have missed it — the regression this pins", () => {
    // Reproduces the defect's mechanism rather than trusting the fix: under
    // the old rule the loop excluded every root type, so an epic child was
    // never examined at all.
    const ROOT_TYPES = new Set(["milestone", "epic"]);
    const beansInOldLoop = [{ type: "epic" }, { type: "task" }].filter((b) => !ROOT_TYPES.has(b.type));
    expect(beansInOldLoop.some((b) => b.type === "epic")).toBe(false);
  });

  test("an epic under a MILESTONE is fine — the rule is not 'epics may not have parents'", () => {
    expect(ok(checkBeanParents(store({ id: "m1", type: "milestone" }, { id: "e1", type: "epic", parent: "m1" })))).toBe(true);
  });

  test("an epic with NO parent is still fine — roots are excused from THAT rule only", () => {
    expect(ok(checkBeanParents(store({ id: "e1", type: "epic" })))).toBe(true);
  });

  test("a milestone with no parent is fine", () => {
    expect(ok(checkBeanParents(store({ id: "m1", type: "milestone" })))).toBe(true);
  });
});

describe("the rules about a DECLARED parent now reach roots too", () => {
  test("an epic whose parent does not exist is caught", () => {
    const r = checkBeanParents(store({ id: "e1", type: "epic", parent: "ghost" }));
    expect(ok(r)).toBe(false);
    expect(r.problems.join("\n")).toContain("names no bean");
  });

  test("an epic parented to a TASK is caught", () => {
    const r = checkBeanParents(store({ id: "m1", type: "milestone" }, { id: "t1", type: "task", parent: "m1" }, { id: "e1", type: "epic", parent: "t1" }));
    expect(ok(r)).toBe(false);
    expect(r.problems.join("\n")).toContain("not an epic or a milestone");
  });
});

describe("the ordinary rules still hold", () => {
  test("a task with no parent is a problem", () => {
    expect(ok(checkBeanParents(store({ id: "t1", type: "task" })))).toBe(false);
  });

  test("a task under an epic is fine", () => {
    expect(ok(checkBeanParents(store({ id: "e1", type: "epic" }, { id: "t1", type: "task", parent: "e1" })))).toBe(true);
  });

  test("a CLOSED bean with no parent is not a problem", () => {
    expect(ok(checkBeanParents(store({ id: "t1", type: "task", status: "completed" })))).toBe(true);
  });

  test("no store is not a failure — it is a third state", () => {
    const r = checkBeanParents(mkdtempSync(join(tmpdir(), "nostore-")));
    expect(r.store).toBeNull();
    expect(r.problems).toEqual([]);
  });
});

describe("the baseline may only shrink", () => {
  test("a fresh store has no baseline, so a nesting FAILS rather than being excused", () => {
    // The baseline is read relative to the ROOT under test, so a scratch store
    // has none — which is the behaviour a new repository should get.
    const r = checkBeanParents(store({ id: "e1", type: "epic" }, { id: "e2", type: "epic", parent: "e1" }));
    expect(r.problems.length).toBe(1);
    expect(r.outstanding).toEqual([]);
    expect(r.stale).toEqual([]);
  });
});
