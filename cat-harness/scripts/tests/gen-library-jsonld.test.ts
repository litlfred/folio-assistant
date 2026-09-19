/**
 * The ingest writer turns Stage A/B artefacts into graph nodes.
 *
 * Two properties are load-bearing and easy to get wrong:
 *
 *  - **A section is a manifest, not a text node.** Its `contains` is an
 *    ORDERED list of block ids; the prose lives in a `prose` block that points
 *    at the `sections/<sid>.md` Stage A already wrote. Copying that text into
 *    the block would duplicate 24.7 M characters and move them out of the path
 *    the corpus-grep checklist looks in.
 *  - **Nothing here is folio content.** `candidates.json` says so itself, and
 *    every emitted node carries `provenance: "ingested"` and an attribution to
 *    its source document so a query can separate *what this paper claims* from
 *    *what the folio claims*.
 *
 * Fixtures mirror the real artefact shapes measured on `litlfred/qou`.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { buildDocumentNodes, sectionKey, blockId } from "../../content/pipeline/gen-library-jsonld";

const DIR = mkdtempSync(join(tmpdir(), "gen-library-"));
afterAll(() => {
  try {
    rmSync(DIR, { recursive: true, force: true });
  } catch {}
});

const structure = {
  doc_id: "0110001v3",
  source: { file: "0110001v3.pdf", sha256: "f30f603ac1c5", pages: 12 },
  metadata: { title: "A geometric interpretation of Milnor's triple linking numbers", arxiv: null, doi: null },
  sections: [
    { id: "sec-000-1-introduction", number: "1", title: "Introduction", level: 1, page_start: 1, page_end: 3, n_chars: 4595, n_words: 930 },
    { id: "sec-001-2-the-formula", number: "2", title: "The formula", level: 1, page_start: 3, page_end: 8, n_chars: 9000, n_words: 1800 },
  ],
};

const candidates = {
  document_class: "math",
  validated: true,
  disposition: "proposals only — promote via document-intake Stage 4",
  candidates: [
    { kind: "remark", statement: "It is worth noting a few properties.", section_file: "sections/sec-000-1-introduction.md" },
    { kind: "theorem", statement: "The triple linking number equals the count.", section_file: "sections/sec-001-2-the-formula.md", formalization_candidate: true },
    { kind: "lemma", statement: "", section_file: "sections/sec-001-2-the-formula.md" },
  ],
};

let files: Array<{ path: string; content: string }>;
const byPath = (p: string) => files.find((f) => f.path === p);
const parse = (p: string) => JSON.parse(byPath(p)!.content) as Record<string, unknown>;

beforeAll(() => {
  mkdirSync(join(DIR, "sections"), { recursive: true });
  writeFileSync(join(DIR, "sections", "sec-000-1-introduction.md"), "Intro text.\n");
  writeFileSync(join(DIR, "sections", "sec-001-2-the-formula.md"), "Formula text.\n");
  files = buildDocumentNodes("0110001v3", structure, candidates, () => true);
});

describe("id derivation", () => {
  test("section key is the stable prefix, not the slugged title", () => {
    // The title can be re-derived by a better extractor; the index cannot.
    expect(sectionKey("sec-000-1-introduction")).toBe("sec-000");
    expect(sectionKey("sec-012-appendix-b")).toBe("sec-012");
  });

  test("block ids are per-section ordinals, so one section cannot renumber another", () => {
    // An @id is a public contract the moment anything annotates it.
    expect(blockId("theorem", "sec-001", 3)).toBe("thm-sec-001-03");
    expect(blockId("prose", "sec-001")).toBe("prose-sec-001");
  });

  test("uses the same prefixes an author would", () => {
    expect(blockId("remark", "sec-000", 1)).toBe("rem-sec-000-01");
    expect(blockId("lemma", "sec-000", 1)).toBe("lem-sec-000-01");
  });
});

describe("a section is a manifest", () => {
  test("it carries no text of its own", () => {
    const sec = parse("sections/sec-000.jsonld");
    expect(sec.text).toBeUndefined();
  });

  test("contains is ordered: prose first, then candidates in extraction order", () => {
    expect(parse("sections/sec-001.jsonld").contains).toEqual([
      "library/0110001v3/blocks/prose-sec-001",
      "library/0110001v3/blocks/thm-sec-001-01",
      "library/0110001v3/blocks/lem-sec-001-02",
    ]);
  });

  test("the prose block points at Stage A's file rather than copying it", () => {
    const prose = parse("blocks/prose-sec-000.jsonld");
    expect(prose.text).toBe("../sections/sec-000-1-introduction.md");
    // No `.md` is emitted for a prose block — that would duplicate the corpus.
    expect(byPath("blocks/prose-sec-000.md")).toBeUndefined();
  });

  test("a section with no .md yields no prose block", () => {
    const noMd = buildDocumentNodes("d", structure, candidates, () => false);
    expect(noMd.some((f) => f.path.startsWith("blocks/prose-"))).toBe(false);
  });
});

describe("extracted claims become typed blocks", () => {
  test("kind and type survive", () => {
    const thm = parse("blocks/thm-sec-001-01.jsonld");
    expect(thm.kind).toBe("theorem");
    expect(thm["@type"]).toEqual(["folio:Theorem", "doco:Section"]);
  });

  test("a claim's statement is written as its own text file", () => {
    expect(byPath("blocks/thm-sec-001-01.md")!.content).toContain("triple linking number");
    expect(parse("blocks/thm-sec-001-01.jsonld").text).toBe("thm-sec-001-01.md");
  });

  test("an empty statement yields no text file and no dangling link", () => {
    expect(byPath("blocks/lem-sec-001-02.md")).toBeUndefined();
    expect(parse("blocks/lem-sec-001-02.jsonld").text).toBeUndefined();
  });
});

describe("nothing here is folio content", () => {
  test("every node is marked ingested", () => {
    for (const f of files.filter((x) => x.path.endsWith(".jsonld"))) {
      expect(JSON.parse(f.content).provenance).toBe("ingested");
    }
  });

  test("every node is attributed to its source document", () => {
    for (const f of files.filter((x) => x.path.endsWith(".jsonld") && x.path !== "manifest.jsonld")) {
      expect(JSON.parse(f.content).sourceDocument).toBe("library/0110001v3/manifest");
    }
  });

  test("the extractor's own disposition is carried verbatim, not paraphrased", () => {
    const meta = parse("manifest.jsonld").meta as Record<string, unknown>;
    expect(meta.disposition).toBe(candidates.disposition);
  });

  test("a document with no candidates.json still says it is not folio content", () => {
    const bare = buildDocumentNodes("d", structure, undefined, () => true);
    const meta = JSON.parse(bare.find((f) => f.path === "manifest.jsonld")!.content).meta;
    expect(String(meta.disposition)).toContain("not folio content");
  });
});

describe("the manifest", () => {
  test("carries source identity for the PROV join", () => {
    const meta = parse("manifest.jsonld").meta as Record<string, unknown>;
    expect(meta.source_sha256).toBe("f30f603ac1c5");
    expect(meta.pages).toBe(12);
  });

  test("contains the sections in document order", () => {
    expect(parse("manifest.jsonld").contains).toEqual([
      "library/0110001v3/sections/sec-000",
      "library/0110001v3/sections/sec-001",
    ]);
  });
});

describe("determinism", () => {
  test("two builds are byte-identical — the --check gate depends on it", () => {
    const a = buildDocumentNodes("0110001v3", structure, candidates, () => true);
    const b = buildDocumentNodes("0110001v3", structure, candidates, () => true);
    expect(a.map((f) => f.path + f.content)).toEqual(b.map((f) => f.path + f.content));
  });

  test("no key is emitted with an undefined or empty value", () => {
    for (const f of files.filter((x) => x.path.endsWith(".jsonld"))) {
      for (const [, v] of Object.entries(JSON.parse(f.content))) {
        expect(v).not.toBeUndefined();
        if (Array.isArray(v)) expect(v.length).toBeGreaterThan(0);
      }
    }
  });
});
