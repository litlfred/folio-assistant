import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

import { NotebookStructureSchema, pagesOf, structureOf } from "./document-structure.ts";

const REPO = resolve(import.meta.dir, "..", "..");

const notebook = (over: Record<string, unknown> = {}) => ({
  _schema: "notebook-structure/v1",
  doc_id: "nb",
  source: { file: "nb.ipynb", sha256: "a".repeat(64), bytes: 10, mtime: null, mimetype_sniffed: "application/x-ipynb+json", mimetype_source: "content", nbformat: "4.5", language: "python", cells: 4 },
  metadata: { title: "A notebook" },
  toc_source: "headings",
  sections: [
    { id: "s1", number: null, title: "Intro", level: 1, cell_start: 0, cell_end: 1, code_cells: 1, n_chars: 20, n_words: 4 },
    { id: "s2", number: null, title: "Use", level: 2, cell_start: 2, cell_end: 3, code_cells: 0, n_chars: 10, n_words: 2 },
  ],
  ...over,
});

describe("structureOf reads every committed structure, each as its own variant", () => {
  // The whole premise of A+B: pdf-structure/v1 stays as it is. If any
  // committed file stops reading through the accessor, the premise is false.
  const files = spawnSync("git", ["ls-files", "*structure.json"], { cwd: REPO, encoding: "utf-8" })
    .stdout.split("\n")
    .filter((f) => f.endsWith("/structure.json"));

  test("there are committed files to read — the guard every assertion below needs", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  test("each reads as a declared variant, with that variant's locator", () => {
    // The whole premise of A+B: pdf-structure/v1 files read UNCHANGED as the
    // pdf variant (pages), and a notebook reads as the notebook variant
    // (cells). A file that reads as neither, or with the other's locator, is
    // the misreading this base exists to prevent.
    const bad: string[] = [];
    const want = { pdf: "pages", notebook: "cells" } as const;
    for (const f of files) {
      const s = structureOf(JSON.parse(readFileSync(join(REPO, f), "utf-8")));
      if ("reason" in s) bad.push(`${f}: ${s.reason}`);
      else if (s.sections.some((x) => x.locator.kind !== want[s.variant])) bad.push(`${f}: ${s.variant} with a foreign locator`);
    }
    expect(bad).toEqual([]);
  });

  test("both variants are present in the corpus, so neither half is vacuous", () => {
    const variants = new Set(
      files.map((f) => {
        const s = structureOf(JSON.parse(readFileSync(join(REPO, f), "utf-8")));
        return "reason" in s ? "unreadable" : s.variant;
      }),
    );
    expect([...variants].sort()).toEqual(["notebook", "pdf"]);
  });
});

describe("the notebook variant", () => {
  test("reads with cell locators, and pagesOf gives nothing rather than a cell index", () => {
    const s = structureOf(notebook());
    if ("reason" in s) throw new Error(s.reason);
    expect(s.variant).toBe("notebook");
    expect(s.sections[0]!.locator).toEqual({ kind: "cells", start: 0, end: 1 });
    expect(pagesOf(s.sections[0]!)).toBeUndefined();
  });

  test("a notebook with no headings must say so", () => {
    expect(NotebookStructureSchema.safeParse(notebook({ toc_source: "none" })).success).toBe(false);
    expect(NotebookStructureSchema.safeParse(notebook({ toc_source: "none", structure_note: "no markdown heading; one section" })).success).toBe(true);
  });

  test("a section cannot end before it starts", () => {
    const bad = notebook();
    (bad.sections as Array<Record<string, unknown>>)[0]!.cell_end = -1;
    expect("reason" in structureOf(bad)).toBe(true);
  });
});

describe("anything else is a reason, never an empty section list", () => {
  test("an unknown tag is named", () => {
    const r = structureOf({ _schema: "html-structure/v1", sections: [] });
    expect("reason" in r && r.reason).toContain("html-structure/v1");
  });
  test("no tag at all", () => {
    expect("reason" in structureOf({ sections: [] })).toBe(true);
  });
});
