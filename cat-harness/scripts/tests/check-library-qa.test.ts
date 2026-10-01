/**
 * Library entry QA (issue #1794, bean `8iqc`).
 *
 * Every fixture reproduces a defect measured on `main` on 2026-10-01: the slug
 * standing in for a title, *Abies* for the WHO Editorial Style Manual, a doubled
 * `LeanArchitect`, a truncated `Algorithmic Approaches to`, and a withheld entry
 * whose 121 page blocks all render as "(no content carried)".
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  bibliographicMissing,
  judge,
  readEntryFacts,
  similarity,
  titleImplausible,
  titleMissing,
  usableSourceTitle,
  yearOf,
} from "../check-library-qa.ts";
import type { LibraryEntry } from "../library-graph.ts";

function write(path: string, body: unknown): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, typeof body === "string" ? body : JSON.stringify(body, null, 2));
}

/** An instance root with a declared `catalogue` graph and a `library/`. */
function instance(): string {
  const root = mkdtempSync(join(tmpdir(), "libqa-"));
  write(join(root, "fixture.json"), {
    name: "fixture",
    directories: [
      { id: "library", path: "library/", graphKinds: ["library"] },
      { id: "catalogue", path: "catalogue/", graphKinds: ["catalogue"] },
    ],
  });
  return root;
}

function entry(root: string, slug: string, manifest: Record<string, unknown>, extra: Record<string, unknown> = {}): string {
  const dir = join(root, "library", slug);
  write(join(dir, "manifest.jsonld"), { "@id": `library/${slug}/manifest`, ...manifest });
  for (const [f, body] of Object.entries(extra)) write(join(dir, f), body);
  return dir;
}

const noSources = { sourceFiles: [] };

describe("title-missing", () => {
  test("the slug standing in for a title is a finding", () => {
    expect(titleMissing({ title: "rfc2119-key-words", id: "rfc2119-key-words", docId: "", ...noSources })?.why).toBe(
      "equals the slug",
    );
  });

  test("a source file name is a finding (codata-2022)", () => {
    const f = titleMissing({
      title: "allascii-codata-2022.txt",
      id: "codata-2022",
      docId: "",
      sourceFiles: [{ file: "tabular.jsonld", field: "source.file", value: "allascii-codata-2022.txt" }],
    });
    expect(f?.why).toContain("source file name");
  });

  test("absent is a finding, and a real title is not", () => {
    expect(titleMissing({ title: null, id: "x", docId: "", ...noSources })?.why).toBe("absent");
    expect(titleMissing({ title: "Decision Model and Notation (DMN)", id: "omg-2024-dmn-1-5", docId: "", ...noSources })).toBeNull();
  });
});

describe("title-implausible", () => {
  const dc = { file: "catalogue/records/x.dc.json", field: "dc.title", value: "WHO editorial style manual" };

  test("Abies: a single short token, and it disagrees with the Dublin Core record", () => {
    const why = titleImplausible({ title: "Abies", sourceTitles: [dc] }).map((f) => f.why);
    expect(why).toEqual(["a single short token", "disagrees with the source's own metadata"]);
  });

  test("a doubled word", () => {
    expect(titleImplausible({ title: "LeanArchitect LeanArchitect", sourceTitles: [] })[0]?.why).toContain("doubled");
  });

  test("a truncated title disagrees with the PDF Info /Title", () => {
    const src = { file: "structure.json", field: "metadata.docinfo.Title", value: "Algorithmic Approaches to Sequential Decision-Making and Social Epistemology" };
    expect(titleImplausible({ title: "Algorithmic Approaches to", sourceTitles: [src] })).toHaveLength(1);
  });

  test("extraction damage alone does not count as disagreement", () => {
    const src = { file: "structure.json", field: "metadata.docinfo.Title", value: "MerLean: An Agentic Framework for Autoformalization in Quantum Computation" };
    expect(titleImplausible({ title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION", sourceTitles: [src] })).toEqual([]);
    expect(similarity("A Skill-Based Agentic Pipeline", "A Skill-Based AI Agentic Pipeline")).toBeGreaterThan(0.9);
  });

  test("an authoring tool's file name in /Title is not a source title", () => {
    expect(usableSourceTitle("Microsoft Word - draft3.docx")).toBe(false);
    expect(usableSourceTitle("JSON-LD 1.1")).toBe(true);
  });
});

describe("reading an entry", () => {
  test("the Dublin Core record outranks the PDF Info /Title (iris-dspace R8)", () => {
    const root = instance();
    write(join(root, "catalogue", "nodes", "item-x.json"), { id: "item/x", libraryId: "x", metadataRef: "catalogue/records/x.dc.json" });
    write(join(root, "catalogue", "records", "x.dc.json"), {
      fields: [
        { element: "title", values: [{ value: "WHO editorial style manual" }] },
        { element: "date", qualifier: "issued", values: [{ value: "1993-12-31" }] },
      ],
    });
    const dir = entry(root, "x", { title: "Abies", meta: { source_file: "x.pdf" } }, {
      "structure.json": { source: { file: "x.pdf" }, metadata: { docinfo: { Title: "Some PDF title" } } },
    });
    const f = readEntryFacts(dir, "x", "fixture");
    expect(f.sourceTitles.map((s) => s.field)).toEqual(["dc.title", "metadata.docinfo.Title"]);
    expect(f.readable.year[0]?.value).toBe("1993");
    expect(f.unreadable).toEqual([]);
  });

  test("a PDF source with no extraction to read is could-not-determine, never a pass", () => {
    const root = instance();
    const dir = entry(root, "y", { title: "A Real Title", meta: { source_file: "y.pdf" } });
    expect(readEntryFacts(dir, "y", "fixture").unreadable.map((u) => u.file)).toEqual(["structure.json"]);
  });

  test("an unparseable structure.json is could-not-determine", () => {
    const root = instance();
    const dir = entry(root, "z", { title: "A Real Title", meta: { source_file: "z.pdf" } }, { "structure.json": "{ not json" });
    expect(readEntryFacts(dir, "z", "fixture").unreadable).toContainEqual({ file: "structure.json", why: "will not parse" });
  });

  test("a non-PDF source with no record is title-source-absent, said aloud", () => {
    const root = instance();
    const dir = entry(root, "readme", { title: "beans", meta: { source_file: "README.md" } }, {
      "structure.json": { source: { file: "README.md" }, metadata: {} },
    });
    const f = readEntryFacts(dir, "readme", "fixture");
    expect(f.unreadable).toEqual([]);
    expect(f.noSourceTitleBecause).toContain("not a PDF");
  });
});

describe("bibliographic-missing", () => {
  const none = { agent: [], year: [] };
  test("both halves are required", () => {
    expect(bibliographicMissing({ declared: none, bibliographicReason: null })).toEqual(["author/publisher", "year"]);
    const pub = { file: "referenced.json", field: "identity.publisher", value: "Object Management Group" };
    expect(bibliographicMissing({ declared: { agent: [pub], year: [] }, bibliographicReason: null })).toEqual(["year"]);
  });
  test("an explicit reason clears it", () => {
    expect(bibliographicMissing({ declared: none, bibliographicReason: "the source names no author" })).toEqual([]);
  });
  test("a year is read out of a date", () => {
    expect(yearOf("2013-12")).toBe("2013");
    expect(yearOf("Tue Apr 10 09:08:19 2001\n")).toBe("2001");
    expect(yearOf("v5.0.0")).toBe("");
  });
});

describe("judge — block-no-content", () => {
  function paged(root: string, slug: string, bodies: string[]): string {
    const dir = entry(root, slug, { title: "A Real Title Here", meta: { source_file: "README.md" } }, {
      "structure.json": { source: { file: "README.md" }, metadata: {} },
    });
    bodies.forEach((body, i) => {
      const n = String(i + 1).padStart(3, "0");
      write(join(dir, "blocks", `prose-page-${n}.jsonld`), {
        "@id": `library/${slug}/blocks/prose-page-${n}`,
        kind: "prose",
        title: `Page ${i + 1}`,
        pageStart: i + 1,
        text: `../sections/page-${n}.md`,
      });
      write(join(dir, "sections", `page-${n}.md`), `---\nsection_id: page-${n}\n---\n${body}\n`);
    });
    return dir;
  }
  const asEntry = (root: string, slug: string, over: Partial<LibraryEntry> = {}): LibraryEntry =>
    ({ id: slug, instance: "fixture", dir: join("library", slug), words: 100, ...over }) as LibraryEntry;

  test("a withheld entry's pages carry no content while it holds words — a finding naming why", () => {
    const root = instance();
    paged(root, "w", ["Words on page one.", "Words on page two."]);
    const j = judge([asEntry(root, "w", { withheld: "copyright refused" })], root);
    const found = j.families["block-no-content"]!.entries as { blocks: number; withheld?: string }[];
    expect(found).toHaveLength(1);
    expect(found[0]!.blocks).toBe(2);
    expect(found[0]!.withheld).toBe("copyright refused");
  });

  test("the same entry, not withheld, carries its text and is clean", () => {
    const root = instance();
    paged(root, "v", ["Words on page one.", "Words on page two."]);
    expect(judge([asEntry(root, "v")], root).families["block-no-content"]!.entries).toEqual([]);
  });

  test("a heading-only section is not counted", () => {
    const root = instance();
    paged(root, "h", ["", "Words on page two."]);
    expect(judge([asEntry(root, "h")], root).families["block-no-content"]!.entries).toEqual([]);
  });

  test("the summary backlog is counted per entry", () => {
    const root = instance();
    paged(root, "b", ["One.", "Two."]);
    const backlog = judge([asEntry(root, "b")], root).families["summary-backlog"]!.entries as { backlog: number }[];
    expect(backlog[0]?.backlog).toBe(2);
  });
});
