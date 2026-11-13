/**
 * `validateRelaxations` with opt-in sub-graphs: a relaxation is judged against
 * every process on disk, and a process found nowhere is UNDETERMINED (not
 * wrong) only while a declared opt-in group is missing from disk.
 */
import { describe, expect, test } from "bun:test";
import { PolicyError, validateRelaxations, type Relaxation } from "../src/workflow/gate.ts";
import type { ProcessModel } from "../src/workflow/process-model.ts";

const model = (id: string, nodes: Record<string, boolean>): ProcessModel =>
  ({ id, enforcement: "strict", nodes: new Map(Object.entries(nodes).map(([n, relaxable]) => [n, { id: n, name: n, relaxable }])) }) as unknown as ProcessModel;

const relax = (process: string, activity: string): Relaxation => ({ process, activity, reason: "no standing reviewer for this subject", package: "pkg" });

describe("relaxations of processes in opt-in groups", () => {
  const editing = model("Process_Editing", { Task_SmeReview: true, Task_Gate: false });

  test("group on disk: judged, and legal", () => {
    expect(validateRelaxations([relax("Process_Editing", "Task_SmeReview")], [editing])).toEqual([]);
  });

  test("group on disk: a renamed activity still fails", () => {
    expect(() => validateRelaxations([relax("Process_Editing", "Task_Renamed")], [editing], { unseen: [] })).toThrow(PolicyError);
  });

  test("group on disk: a non-relaxable step still fails, even with another group unseen", () => {
    expect(() => validateRelaxations([relax("Process_Editing", "Task_Gate")], [editing], { unseen: ["x.collab"] })).toThrow(PolicyError);
  });

  test("group not mounted: undetermined, returned rather than passed", () => {
    const r = relax("Process_Editing", "Task_SmeReview");
    expect(validateRelaxations([r], [], { unseen: ["x.collab (collab)"] })).toEqual([r]);
  });

  test("every group mounted: a process that exists nowhere fails", () => {
    expect(() => validateRelaxations([relax("Process_Gone", "Task_SmeReview")], [editing], { unseen: [] })).toThrow(/not a process here/);
  });
});
