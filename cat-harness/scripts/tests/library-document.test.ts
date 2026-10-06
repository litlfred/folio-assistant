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
import { extractOf, readEntryDocument } from "../lib/library-document.ts";

function entry(structure: object, extra: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "libdoc-"));
  mkdirSync(join(dir, "sections"));
  writeFileSync(join(dir, "structure.json"), JSON.stringify(structure));
  for (const [p, c] of Object.entries(extra)) writeFileSync(join(dir, p), c);
  return dir;
}

const base = {
  source: { pages: 4 },
  metadata: { title: "A Report" },
  toc_source: "inferred",
  diagnostics: { toc_inferred_method: "font", figure_sequence_gaps: ["table 2"] },
  toc: [
    { level: 1, title: "Introduction", page: 2, number: "1", source: "inferred", confidence: 0.9, evidence: ["style", "number"], page_label: "1" },
    { level: 1, title: "Methods", page: 3, number: "2", source: "inferred", confidence: 0.55, evidence: ["style"], page_label: "2" },
  ],
  sections: [
    { id: "sec-000-1-introduction", number: "1", title: "Introduction", level: 1, page_start: 2, page_end: 2, n_words: 3, label_start: "1", label_end: "1" },
    { id: "sec-001-2-methods", number: "2", title: "Methods", level: 1, page_start: 3, page_end: 4, n_words: 200 },
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
