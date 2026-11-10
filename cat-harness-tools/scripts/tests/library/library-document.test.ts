/**
 * The document view of an ingested library entry — issue #2302, bean `turh`.
 *
 * What it holds: the view is read from the ingestion schema (structure.json),
 * a section's summary is matched by its FILE (never by position), an extract
 * is labelled as one and cut at a word, a withheld entry publishes no
 * extract, a field an older ingestion lacks is absent rather than empty, and
 * an entry with no structure.json is null.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractOf, plainHeading, plainMarkdown, readEntryDocument } from "../../lib/library-document.ts";

function entry(structure: object, extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "libdoc-"));
  mkdirSync(join(dir, "sections"));
  writeFileSync(join(dir, "structure.json"), JSON.stringify(structure));
  for (const [p, c] of Object.entries(extra)) writeFileSync(join(dir, p), c);
  return dir;
}

const base = {
  _schema: "pdf-structure/v1",
  doc_id: "r",
  source: { file: "r.pdf", sha256: "0".repeat(64), bytes: 1, mtime: null, mimetype_sniffed: "application/pdf", mimetype_source: "magic-bytes", pages: 4 },
  metadata: { title: "A Report", docinfo: {} },
  toc_source: "inferred",
  diagnostics: {
    pages_without_text: 0, likely_scanned: false, toc_entries: 2, sections: 2, chars_total: 10,
    toc_inferred_method: "font", figure_sequence_gaps: ["table 2"],
  },
  toc: [
    { level: 1, title: "Introduction", page: 2, number: "1", source: "inferred", confidence: 0.9, evidence: ["style", "number"], page_label: "1" },
    { level: 1, title: "Methods", page: 3, number: "2", source: "inferred", confidence: 0.55, evidence: ["style"], page_label: "2" },
  ],
  sections: [
    { id: "sec-000-1-introduction", number: "1", title: "Introduction", level: 1, page_start: 2, page_end: 2, n_chars: 15, n_words: 3, label_start: "1", label_end: "1" },
    { id: "sec-001-2-methods", number: "2", title: "Methods", level: 1, page_start: 3, page_end: 4, n_chars: 1000, n_words: 200 },
  ],
  pages: [{ physical: 1, label: null, source: null, confidence: 0, evidence: [] }, { physical: 2, label: "1", source: "printed", confidence: 0.85, evidence: ["printed", "pdf-labels"] }],
  figures: [{ kind: "table", number: "1", title: "Scores", page: 3, confidence: 0.8, evidence: ["referenced"], page_label: "2" }],
};

describe("readEntryDocument", () => {
  test("reads the schema; TOC entries link to their sections; summary by file, else extract", () => {
    const long = "word ".repeat(200);
    const dir = entry(base, {
      "sections/sec-000-1-introduction.md": "---\nsection_id: x\n---\nShort intro text.",
      "sections/sec-001-2-methods.md": `---\nsection_id: y\n---\n${long}`,
      "summaries.json": JSON.stringify({ summaries: [{ source: "sections/sec-001-2-methods.md", narrative: { text: "What the methods are.", status: "draft" } }] }),
    });
    const d = readEntryDocument(dir, "r")!;
    expect(d.toc.map((e) => e.section)).toEqual(["sec-000-1-introduction", "sec-001-2-methods"]);
    expect(d.toc[1].confidence).toBe(0.55);
    expect(d.sections[0].summary).toBeNull();
    expect(d.sections[0].extract).toBe("Short intro text.");
    expect(d.sections[0].extractCut).toBe(false);
    expect(d.sections[1].summary?.text).toBe("What the methods are.");
    expect(d.pageLabels?.[1].label).toBe("1");
    expect(d.figures?.[0].pageLabel).toBe("2");
    expect(d.checks.figureSequenceGaps).toEqual(["table 2"]);
  });

  test("the summary badge reads the narrative list's state, so a confirmed summary is not shown as draft", () => {
    const by = { kind: "agent", id: "claude-code", model: "test-model" };
    const dir = entry(base, {
      "sections/sec-000-1-introduction.md": "Intro.",
      "sections/sec-001-2-methods.md": "Methods.",
      "summaries.json": JSON.stringify({ summaries: [
        { source: "sections/sec-000-1-introduction.md", narrative: [{ text: "Draft text.", lang: "en", state: "draft", drafted_by: by }] },
        { source: "sections/sec-001-2-methods.md", narrative: [{ text: "Confirmed text.", lang: "en", state: "confirmed", drafted_by: by, confirmed_by: { kind: "human", id: "owner" } }] },
      ] }),
    });
    const d = readEntryDocument(dir, "r")!;
    expect(d.sections[0].summary?.status).toBe("draft");
    expect(d.sections[1].summary?.status).toBe("confirmed");
  });

  test("a withheld entry publishes no extract, and keeps structure and summaries", () => {
    const dir = entry(base, { "sections/sec-000-1-introduction.md": "Secret text." });
    const d = readEntryDocument(dir, "r", { withheld: true })!;
    expect(d.sections[0].extract).toBeNull();
    expect(d.withheld).toBe(true);
    expect(d.toc.length).toBe(2);
  });

  test("a field an older ingestion lacks is absent, not empty; no structure.json is null", () => {
    const { pages: _pages, figures: _figures, ...old } = base;
    const d = readEntryDocument(entry(old), "r")!;
    expect("pageLabels" in d).toBe(false);
    expect("figures" in d).toBe(false);
    expect(readEntryDocument(mkdtempSync(join(tmpdir(), "libdoc-")), "r")).toBeNull();
  });

  test("an extract is cut at a word and says so", () => {
    const r = extractOf("alpha beta gamma delta", 12);
    expect(r).toEqual({ extract: "alpha beta", cut: true });
  });
});

describe("keywords in the document view", () => {
  test("document and section keywords from keywords.json, heading evidence kept; absent file leaves the field absent", () => {
    const kws = {
      $schema: "folio-keywords/v1",
      document: [{ term: "systematic review", score: 2, evidence: ["heading"] }, { term: "grade", score: 1, evidence: [] }],
      sections: { "sec-001-2-methods": [{ term: "methods", score: 1, evidence: ["heading"] }] },
    };
    const d = readEntryDocument(entry(base, { "keywords.json": JSON.stringify(kws) }), "r", { withheld: true })!;
    expect(d.keywords).toEqual([{ term: "systematic review", heading: true }, { term: "grade", heading: false }]);
    expect(d.sections[1].keywords).toEqual([{ term: "methods", heading: true }]);
    expect(d.sections[0].keywords).toEqual([]);
    expect(readEntryDocument(entry(base), "r")!.keywords).toBeUndefined();
  });
});

describe("a text source is shown by its own headings, not as a PDF (litlfred/dth-hrh)", () => {
  // A minimal text-structure/v1 entry, in the shape text-structure.ts writes.
  const sec = (id: string, level: number, line: number) => ({
    id, number: null, title: id, level, file: "outline.md", line_start: line, line_end: line + 1, unit: "heading", n_chars: 10, n_words: 2,
  });
  const text = {
    _schema: "text-structure/v1",
    doc_id: "outline",
    source: {
      file: "outline.md", sha256: "0".repeat(64), digest: "file", bytes: 20, mtime: null,
      mimetype_sniffed: "text/plain", mimetype_source: "content",
      files: [{ path: "outline.md", sha256: "0".repeat(64), bytes: 20, lines: 4, format: "markdown" }],
      upstream: null,
    },
    metadata: { title: "An outline" },
    toc_source: "headings",
    sections: [sec("s001-a", 1, 1), sec("s002-b", 2, 3)],
    structure_note: "test",
  };

  test("the view says it is a text source and keeps its sections", () => {
    const v = readEntryDocument(entry(text), "outline");
    expect(v).not.toBeNull();
    expect(v!.variant).toBe("text");
    expect(v!.sections.map((s) => s.id)).toEqual(["s001-a", "s002-b"]);
  });

  test("a PDF entry still says pdf", () => {
    const v = readEntryDocument(entry(base), "r");
    expect(v?.variant).toBe("pdf");
  });
});

describe("plainHeading — a text heading as a reader sees it (litlfred/dth-hrh)", () => {
  test("strips emphasis and escapes, keeps the words", () => {
    expect(plainHeading("**Chapter 1\\. Why Digital Health Workforce Registries Matter**")).toBe("Chapter 1. Why Digital Health Workforce Registries Matter");
    expect(plainHeading("**1.1 Global challenges**")).toBe("1.1 Global challenges");
    expect(plainHeading("__Part 0\\. Introduction__")).toBe("Part 0. Introduction");
    expect(plainHeading("The *FHIR* `Practitioner` resource")).toBe("The FHIR Practitioner resource");
  });
  test("an escaped star stays a star; words with underscores are untouched", () => {
    expect(plainHeading("Rating \\*\\*\\* stars")).toBe("Rating *** stars");
    expect(plainHeading("HWF_Registry_DTH_Outline.md")).toBe("HWF_Registry_DTH_Outline.md");
    expect(plainHeading("Plain heading")).toBe("Plain heading");
  });
});

describe("a Markdown section's extract (litlfred/dth-hrh, twg-outline)", () => {
  const text = (unit: "heading" | "file") => ({
    _schema: "text-structure/v1", doc_id: "t", metadata: { title: "T" }, toc_source: "headings", structure_note: "verbatim",
    source: { file: "t.md", sha256: "0".repeat(64), digest: "file", bytes: 1, mtime: null, mimetype_sniffed: "text/plain", mimetype_source: "content", upstream: null,
      files: [{ path: "t.md", sha256: "0".repeat(64), bytes: 1, lines: 9, format: "markdown" }] },
    sections: [{ id: "s001-part-4", number: null, title: "**Part 4\\. Examples**", level: 1, file: "t.md", line_start: 1, line_end: 9, unit, n_chars: 1, n_words: 1 }],
  });
  const md = "---\nsection_id: s001-part-4\n---\n# **Part 4\\. Examples**\n\n**Purpose:** worked [use cases](u.md).\n\n* Maturity *levels*  \n* Step 2\\. done\n";

  test("drops its own heading and reads as plain text", () => {
    const dir = entry(text("heading"));
    writeFileSync(join(dir, "sections", "s001-part-4.md"), md);
    const s = readEntryDocument(dir, "t")!.sections[0]!;
    expect(s.title).toBe("Part 4. Examples");
    expect(s.extract).toBe("Purpose: worked use cases. Maturity levels Step 2. done");
  });

  test("a whole verbatim file is left as it is", () => {
    const dir = entry(text("file"));
    writeFileSync(join(dir, "sections", "s001-part-4.md"), md);
    expect(readEntryDocument(dir, "t")!.sections[0]!.extract).toStartWith("# **Part 4\\. Examples**");
  });
});

describe("a Markdown table in an extract (litlfred/dth-hrh, 'Handbook at a glance')", () => {
  test("drops the delimiter row and reads each row as its cells", () => {
    const md = "## At a glance\n\n| Part | Chapter | Sections |\n| :---- | :---- | :---- |\n| Part 0 | 1. Why **registries** | A; B |\n| | 2. Scope | `a\\|b` |\n";
    // As sectionText reads it: whitespace collapsed and trimmed.
    expect(plainMarkdown(md).replace(/\s+/g, " ").trim()).toBe("Part; Chapter; Sections Part 0; 1. Why registries; A; B 2. Scope; a|b");
  });
});
