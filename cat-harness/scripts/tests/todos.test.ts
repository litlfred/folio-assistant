/**
 * The todo graph is declared, present, and READ.
 *
 * All three, because the failure mode is the middle one going missing.
 * `schemas/todo.ts`, `schemas/todo-graph.ts` and the `todos` / `todo-items`
 * graph typologies existed before any todo did, and `harness.json` did not
 * declare `todos/`. A schema ahead of its graph is harmless. A **declared
 * directory nothing reads** is the bean `dh4f` defect — a consumer scans
 * nothing and reports a clean run over it.
 *
 * The tests here that read the aggregate repository's own root (the
 * root-declared `todos/` and `beans/` graphs, and the processes every instance
 * stacks) live in `test/todos-repo-root.test.ts`
 * (bean `ho66`): standing alone, cat-harness has no such root to read.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "../todos.js";
import { siteDirFor } from "../../schemas/cat-harness.ts";

describe("the published process hierarchy", () => {
  const index = () =>
    JSON.parse(
      readFileSync(join(ROOT, siteDirFor(ROOT), "assets/todos/index.json"), "utf8"),
    ) as { processes: Record<string, string[]>; items: Array<{ tags: { processes: string[] } }> };

  test("real call edges are present — a silent regex failure would flatten the board", () => {
    // `processHierarchy()` reads `<bpmn:process id>` and `calledElement` with a
    // REGEX rather than through `loadProcessModel`, which is async and pulls in
    // bpmn-moddle for a generator that otherwise touches no XML. The risk of a
    // regex over XML is that it silently matches NOTHING: the hierarchy comes
    // out flat, the board stacks nothing, and every test above still passes
    // because a flat board is a valid board. These are the edges the diagrams
    // actually declare.
    const h = index().processes;
    expect(h["Process_Lifecycle"]).toContain("Process_Publication");
    expect(h["Process_Publication"]).toContain("Process_Editing");
    expect(h["Process_Review"]).toContain("Process_CodeReview");
    expect(Object.values(h).filter((v) => v.length > 0).length).toBeGreaterThan(5);
  });

  test("every process a todo names exists in the hierarchy", () => {
    // A todo tagged with a process no diagram declares would stack at depth 0
    // beside the untagged ones and look correct — a dangling tag that renders
    // as a valid one.
    const { processes, items } = index();
    for (const t of items) {
      for (const p of t.tags.processes) {
        expect({ process: p, declared: p in processes }).toEqual({ process: p, declared: true });
      }
    }
  });
});
