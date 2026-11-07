import { describe, expect, test } from "bun:test";

import { changedContentFiles } from "../src/workflow/corpus-gate.ts";

describe("changedContentFiles", () => {
  test("a pure move is not an edit", () => {
    expect(changedContentFiles(["R100\tfolio/d/acronyms/t-a.md\tfolio/d/glossary/t-a.md"])).toEqual([]);
  });
  test("a move that also edits keeps its new path", () => {
    expect(changedContentFiles(["R087\tfolio/d/a/t.md\tfolio/d/b/t.md"])).toEqual(["folio/d/b/t.md"]);
  });
  test("modified and added files are kept", () => {
    expect(changedContentFiles(["M\tfolio/d/a/p.md", "A\tfolio/d/a/q.ts", ""])).toEqual(["folio/d/a/p.md", "folio/d/a/q.ts"]);
  });
});
