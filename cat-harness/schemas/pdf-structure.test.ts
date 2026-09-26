/**
 * pdf-structure/v1 (issue #1112): every committed `structure.json` conforms, and
 * the drifts the schema exists to catch are rejected.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Glob } from "bun";

import { PdfStructureSchema } from "./pdf-structure.ts";

const REPO = resolve(import.meta.dir, "../..");
const COMMITTED = [...new Glob("*/library/*/structure.json").scanSync({ cwd: REPO, onlyFiles: true })]
  .filter((p) => !p.includes("node_modules") && !p.includes("ingest-staging"))
  .sort();

/** The smallest artefact pdf-structure.py can write: one section, no TOC. */
function minimal(): Record<string, unknown> {
  return {
    _schema: "pdf-structure/v1",
    doc_id: "doc",
    source: {
      file: "doc.pdf",
      sha256: "0".repeat(64),
      bytes: 10,
      mtime: "2026-09-23T00:00:00Z",
      mimetype_sniffed: "application/pdf",
      mimetype_source: "magic-bytes",
    },
    toc_source: "none",
    sections: [{ id: "s1", number: null, title: "One", level: 1, page_start: 1, page_end: 2, n_chars: 5, n_words: 1 }],
  };
}

describe("pdf-structure/v1", () => {
  test("there are committed structure.json files to check", () => {
    // Vacuity guard: a glob that matched nothing would make the next test pass.
    expect(COMMITTED.length).toBeGreaterThan(0);
  });

  test("every committed structure.json conforms", () => {
    const bad = COMMITTED.flatMap((rel) => {
      const r = PdfStructureSchema.safeParse(JSON.parse(readFileSync(resolve(REPO, rel), "utf-8")));
      return r.success ? [] : [`${rel}: ${r.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`];
    });
    expect(bad).toEqual([]);
  });

  test("the minimal artefact conforms", () => {
    expect(PdfStructureSchema.safeParse(minimal()).success).toBe(true);
  });

  test("a second spelling of a section field is rejected (the section_id crash)", () => {
    const d = minimal();
    const [s] = d.sections as Record<string, unknown>[];
    d.sections = [{ ...s, section_id: s.id }];
    expect(PdfStructureSchema.safeParse(d).success).toBe(false);
  });

  test("an unknown top-level key is rejected", () => {
    expect(PdfStructureSchema.safeParse({ ...minimal(), sections_text: "withheld" }).success).toBe(false);
  });

  test("a section ending before it starts is rejected", () => {
    const d = minimal();
    const [s] = d.sections as Record<string, unknown>[];
    d.sections = [{ ...s, page_start: 3, page_end: 2 }];
    expect(PdfStructureSchema.safeParse(d).success).toBe(false);
  });

  test("an unknown toc_source is rejected; the four states and outline-unusable are accepted", () => {
    expect(PdfStructureSchema.safeParse({ ...minimal(), toc_source: "guessed" }).success).toBe(false);
    for (const t of ["outline", "inferred", "undetermined", "none", "outline-unusable"])
      expect(PdfStructureSchema.safeParse({ ...minimal(), toc_source: t }).success).toBe(true);
  });

  test("the text origin has one field and one vocabulary (issue #1121)", () => {
    const d = minimal();
    for (const v of ["embedded", "ocr"])
      expect(PdfStructureSchema.safeParse({ ...d, source: { ...(d.source as object), text_source: v } }).success).toBe(true);
    // The retired spellings: pdf-pages.py's old value, and its old top-level field.
    expect(PdfStructureSchema.safeParse({ ...d, source: { ...(d.source as object), text_source: "text-layer" } }).success).toBe(false);
    expect(PdfStructureSchema.safeParse({ ...d, text_source: "ocr" }).success).toBe(false);
  });

  test("an unrecognised mimetype is null with its reason, never guessed", () => {
    const d = minimal();
    const src = { ...(d.source as object), mimetype_sniffed: null, mimetype_source: "unrecognised" };
    expect(PdfStructureSchema.safeParse({ ...d, source: src }).success).toBe(true);
  });
});
