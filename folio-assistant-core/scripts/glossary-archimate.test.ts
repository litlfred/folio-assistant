import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { archimateDepictions, newestFirst } from "./glossary-archimate.ts";

describe("glossary-archimate", () => {
  test("models sort newest first, a release before its drafts", () => {
    expect(["0.2.0-draft.3", "0.2.0", "0.3.0-draft.1", "0.2.0-draft.10"].sort(newestFirst)).toEqual([
      "0.3.0-draft.1",
      "0.2.0",
      "0.2.0-draft.10",
      "0.2.0-draft.3",
    ]);
  });

  test("a repository with no ArchiMate model depicts nothing", async () => {
    const repo = mkdtempSync(join(tmpdir(), "glossary-archimate-"));
    expect((await archimateDepictions(repo, [{ anchor: "a", iri: "i", scheme: "s", id: "t", label: "Trade Item" }])).size).toBe(0);
  });
});
