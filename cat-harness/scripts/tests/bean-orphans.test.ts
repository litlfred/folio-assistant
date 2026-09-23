/** Bean `4d22` — `check:bean-orphans`, the decision it makes without the forge. */
import { describe, expect, test } from "bun:test";

import { orphansOn, type BeanAt } from "../check-bean-orphans.ts";

const F = "folio-assistant-abcd--a-bean.md";
const at = (status: string, updatedAt: string): Map<string, BeanAt> => new Map([[F, { status, updatedAt }]]);

describe("a completion main never received", () => {
  test("completed on the branch, open on main, and newer — reported", () => {
    const o = orphansOn(at("todo", "2026-09-22T10:00:00Z"), at("completed", "2026-09-22T11:00:00Z"), "claude/x", true);
    expect(o).toEqual([{ bean: "folio-assistant-abcd", branch: "claude/x", onMain: "todo", likelyOrphan: true }]);
  });

  test("a branch that only carries beans is the LIKELY orphan; one with code is a PR's work", () => {
    const o = orphansOn(at("in-progress", "2026-09-22T10:00:00Z"), at("completed", "2026-09-22T11:00:00Z"), "claude/y", false);
    expect(o[0]!.likelyOrphan).toBe(false);
  });

  test("main reopened it LATER — the branch is behind, not orphaned (`5a3l`)", () => {
    expect(orphansOn(at("in-progress", "2026-09-23T10:00:00Z"), at("completed", "2026-09-21T10:00:00Z"), "claude/z", true))
      .toEqual([]);
  });

  test("already completed on main, or scrapped there — nothing to report", () => {
    expect(orphansOn(at("completed", "2026-09-22T10:00:00Z"), at("completed", "2026-09-22T11:00:00Z"), "b", true)).toEqual([]);
    expect(orphansOn(at("scrapped", "2026-09-22T10:00:00Z"), at("completed", "2026-09-22T11:00:00Z"), "b", true)).toEqual([]);
  });

  test("keyed by FILE — two beans sharing an id suffix are not confused (`t3n8`)", () => {
    const main = new Map<string, BeanAt>([
      ["folio-assistant-t3n8--one.md", { status: "completed", updatedAt: "2026-09-21T00:00:00Z" }],
      ["folio-assistant-t3n8--two.md", { status: "todo", updatedAt: "2026-09-21T00:00:00Z" }],
    ]);
    const branch = new Map<string, BeanAt>([
      ["folio-assistant-t3n8--one.md", { status: "completed", updatedAt: "2026-09-22T00:00:00Z" }],
    ]);
    expect(orphansOn(main, branch, "b", true)).toEqual([]);
  });
});
