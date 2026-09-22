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
import {
  buildDocumentNodes,
  sectionKey,
  blockId,
  ingestRungOf,
  RUNG_INPUT,
  buildEntryNodes,
} from "../../content/pipeline/gen-library-jsonld";

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

describe("which ingest rung an entry is on — bean `p67i`", () => {
  const has = (...files: string[]) => (f: string) => files.includes(f);

  test("Stage A output puts it on the paged rung", () => {
    expect(ingestRungOf(has("structure.json"))).toBe("paged");
  });

  test("a tabular record puts it on the tabular rung", () => {
    // The whole point of the branch: before it, this entry fell into
    // `skipped` and was reported "not ingested" while being fully ingested.
    expect(ingestRungOf(has("tabular.jsonld"))).toBe("tabular");
  });

  test("the CSVW record puts it there too, for when eief's extractors land", () => {
    expect(ingestRungOf(has("tabular.csvw.jsonld"))).toBe("tabular");
  });

  test("neither input is a DETERMINED `none`, not an unreadable one", () => {
    // `none` says the entry has no ingest input. An entry WITH an input that
    // did not parse is the other state, and the walk reports it separately
    // and exits non-zero — "could not determine" is never a pass.
    expect(ingestRungOf(has("manifest.jsonld"))).toBe("none");
    expect(ingestRungOf(has())).toBe("none");
  });

  test("paged wins when both are present — the table is ordered, not a set", () => {
    expect(ingestRungOf(has("structure.json", "tabular.jsonld"))).toBe("paged");
    expect(RUNG_INPUT[0]?.[0]).toBe("paged");
  });

  test("every rung in the table is reachable from its own input", () => {
    // A rung whose input the walk never checks is a branch that cannot fire —
    // which is what the emitter itself was until this wiring.
    for (const [rung, inputs] of RUNG_INPUT) {
      for (const f of inputs) expect(ingestRungOf(has(f))).toBe(rung);
    }
  });
});

describe("a whole library entry, through the real branch — bean `p67i`", () => {
  // Against a temp directory rather than `library/`, because a dataset in
  // THIS repository would be content in the platform. That is exactly why the
  // tabular branch had no CI coverage until it was extracted from the walk.
  const entry = (files: Record<string, unknown>) => {
    const dir = mkdtempSync(join(tmpdir(), "entry-"));
    for (const [name, body] of Object.entries(files)) {
      writeFileSync(join(dir, name), typeof body === "string" ? body : JSON.stringify(body));
    }
    return dir;
  };
  const record = (format: string, sheets: { name: string; headers: string[] }[]) => ({
    $schema: "folio-tabular-records/v1",
    "@id": "library/d/tabular",
    source: { file: `d.${format}` },
    format,
    sheets: sheets.map((s) => ({ ...s, rows: 2, columns: s.headers.length, shape_source: "counted" })),
    n_sheets: sheets.length,
    header_vocabulary: [...new Set(sheets.flatMap((s) => s.headers))].sort(),
    narrative: { text: null, state: "not-authored" },
  });

  test("a CSV entry yields manifest + ONE table, and no sheet", () => {
    const dir = entry({ "tabular.jsonld": record("csv", [{ name: "d", headers: ["iso3", "cases"] }]) });
    const out = buildEntryNodes("d", dir);
    expect(out.state).toBe("built");
    if (out.state !== "built") return;
    expect(out.rung).toBe("tabular");
    expect(out.files.map((f) => f.path).sort()).toEqual(["blocks/table-001.jsonld", "manifest.jsonld"]);
    const manifest = JSON.parse(out.files.find((f) => f.path === "manifest.jsonld")!.content);
    expect(manifest.contains).toEqual(["library/d/blocks/table-001"]);
    expect(manifest.meta.tabular_depth).toBe("table");
    expect(manifest.meta.tabular_record).toBe("folio-tabular-records/v1");
    expect(manifest.title).toBe("d.csv");
    rmSync(dir, { recursive: true, force: true });
  });

  test("a two-sheet workbook yields a sheet node per sheet", () => {
    const dir = entry({
      "tabular.jsonld": record("xlsx", [
        { name: "Coverage", headers: ["iso3", "mcv1_pct"] },
        { name: "Notes", headers: ["iso3", "note"] },
      ]),
    });
    const out = buildEntryNodes("d", dir);
    expect(out.state).toBe("built");
    if (out.state !== "built") return;
    expect(out.files.map((f) => f.path).sort()).toEqual([
      "blocks/table-001.jsonld",
      "blocks/table-002.jsonld",
      "manifest.jsonld",
      "sheets/sheet-001.jsonld",
      "sheets/sheet-002.jsonld",
    ]);
    const manifest = JSON.parse(out.files.find((f) => f.path === "manifest.jsonld")!.content);
    expect(manifest.contains).toEqual(["library/d/sheets/sheet-001", "library/d/sheets/sheet-002"]);
    expect(manifest.meta.tabular_depth).toBe("sheet");
    rmSync(dir, { recursive: true, force: true });
  });

  test("a record that is THERE and unreadable is `unreadable`, never `no-input`", () => {
    // The failure this separation exists to prevent: reported as "not
    // ingested", it names the wrong cause and sends a reader to the wrong fix.
    const dir = entry({ "tabular.jsonld": "{ not json" });
    expect(buildEntryNodes("d", dir).state).toBe("unreadable");
    rmSync(dir, { recursive: true, force: true });
  });

  test("a record of an unrecognised schema is unreadable too, not an empty document", () => {
    const dir = entry({ "tabular.jsonld": { $schema: "something-else/v9", sheets: [] } });
    expect(buildEntryNodes("d", dir).state).toBe("unreadable");
    rmSync(dir, { recursive: true, force: true });
  });

  test("an entry with no ingest input at all is `no-input`, which PASSES", () => {
    const dir = entry({ "README.md": "nothing here" });
    expect(buildEntryNodes("d", dir).state).toBe("no-input");
    rmSync(dir, { recursive: true, force: true });
  });

  test("an unreadable structure.json is `unreadable` on the PAGED rung too", () => {
    // The third state is not a tabular-only concern: a paged entry whose
    // Stage A output is there and does not parse has the same two wrong
    // answers available to it.
    const dir = entry({ "structure.json": "{ not json" });
    expect(buildEntryNodes("d", dir).state).toBe("unreadable");
    rmSync(dir, { recursive: true, force: true });
  });

  test("a record naming no file falls back to the ENTRY ID, not to nothing", () => {
    // `tabularShapeOf` refuses to invent a title because it cannot know the
    // entry id. The caller can, and does — a manifest with no title at all
    // would be the emitter's ignorance showing up as a missing fact.
    const r = record("csv", [{ name: "d", headers: ["iso3"] }]) as Record<string, unknown>;
    delete r.source;
    const dir = entry({ "tabular.jsonld": r });
    const out = buildEntryNodes("an-entry-id", dir);
    expect(out.state).toBe("built");
    if (out.state !== "built") return;
    const manifest = JSON.parse(out.files.find((f) => f.path === "manifest.jsonld")!.content);
    expect(manifest.title).toBe("an-entry-id");
    rmSync(dir, { recursive: true, force: true });
  });

  test("a paged entry still goes down the paged rung, untouched", () => {
    const dir = entry({
      "structure.json": { doc_id: "d", title: "A paper", pages: [], sections: [] },
    });
    const out = buildEntryNodes("d", dir);
    expect(out.state).toBe("built");
    if (out.state !== "built") return;
    expect(out.rung).toBe("paged");
    expect(out.files.some((f) => f.path.startsWith("sheets/"))).toBe(false);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("a figure on a section boundary — bean `imen`", () => {
  // Section page ranges OVERLAP: a section's `page_end` is the start page of
  // the next one, inclusive. The fixture above already has that shape —
  // `sec-000` is pages 1–3 and `sec-001` is pages 3–8, so page 3 is in both.
  //
  // Before the fix, the generator emitted one node PER containing section, all
  // to the same `blocks/figure-<id>.jsonld` path with a different `derivedFrom`
  // each. Last write won, so `--check` reported the losers stale forever:
  // re-running reproduced exactly the same race. Measured on the WHO PHC
  // digital transformation handbook, where page 71 falls inside FOUR sections.
  //
  // It took an embedded outline AND placed raster figures to surface, and no
  // library entry had both until 2026-09-22.
  const images = {
    doc_id: "0110001v3",
    images: [
      // Page 3 — the boundary. In BOTH sections.
      { id: "img-p003-1", file: "images/img-p003-1.png", role: "figure", basis: { method: "geometry", coverage: 0.4, imagesOnPage: 1, page: 3 } },
      // Page 5 — interior to `sec-001` only, the uncontested control.
      { id: "img-p005-1", file: "images/img-p005-1.png", role: "figure", basis: { method: "geometry", coverage: 0.4, imagesOnPage: 1, page: 5 } },
    ],
  };
  let out: Array<{ path: string; content: string }>;
  beforeAll(() => {
    out = buildDocumentNodes("0110001v3", structure, candidates, () => true, images as never);
  });

  test("is written ONCE, not once per containing section", () => {
    const paths = out.map((f) => f.path).filter((p) => p === "blocks/figure-img-p003-1.jsonld");
    expect(paths).toHaveLength(1);
  });

  test("belongs to the FIRST containing section, which is reading order", () => {
    // The owner's ruling, 2026-09-22 (issue #877): first rather than last, so a
    // figure introduced at the end of a section stays with the section that
    // introduced it. Last is what the race happened to land on, not a reason.
    const n = JSON.parse(out.find((f) => f.path === "blocks/figure-img-p003-1.jsonld")!.content) as Record<string, unknown>;
    expect(n.derivedFrom).toBe(`library/0110001v3/sections/${sectionKey("sec-000-1-introduction")}`);
  });

  test("an uncontested figure is unaffected", () => {
    const n = JSON.parse(out.find((f) => f.path === "blocks/figure-img-p005-1.jsonld")!.content) as Record<string, unknown>;
    expect(n.derivedFrom).toBe(`library/0110001v3/sections/${sectionKey("sec-001-2-the-formula")}`);
  });

  test("ONE section lists it — ownership is single, not split", () => {
    // A consequence of the owner's ruling, and worth stating because it goes a
    // step past the question as asked. `contains` is a section's manifest of
    // its blocks, so listing a boundary figure in BOTH sections while deriving
    // it from one would be internally inconsistent: a consumer walking
    // `contains` across sections would meet the same block id twice and have
    // no way to tell a shared figure from a double count.
    //
    // So the first containing section owns it in both places. The later
    // section does not list it. The alternative considered and rejected was
    // listing it everywhere and deriving from one, which asserts two owners.
    const contains = (sid: string) =>
      (JSON.parse(out.find((f) => f.path === `sections/${sectionKey(sid)}.jsonld`)!.content) as { contains?: string[] })
        .contains ?? [];
    expect(contains("sec-000-1-introduction")).toContain("library/0110001v3/blocks/figure-img-p003-1");
    expect(contains("sec-001-2-the-formula")).not.toContain("library/0110001v3/blocks/figure-img-p003-1");
    expect(contains("sec-001-2-the-formula")).toContain("library/0110001v3/blocks/figure-img-p005-1");
  });
});
