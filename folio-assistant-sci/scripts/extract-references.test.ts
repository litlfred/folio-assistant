/**
 * extract-references.ts: the reference lists of the library's papers, split
 * into folio-reference/v1 nodes (bean folio-assistant-63q4).
 *
 * The fixtures are copied verbatim from the library's section text, page
 * furniture and line breaks included: what the PDF extractor gave is what the
 * splitter has to handle.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { ReferenceNodeSchema, REFERENCE_SCHEMA_TAG } from "../../folio-assistant-core/schemas/reference.ts";
import { collect } from "../../folio-assistant-core/scripts/bibliography-page.ts";
import {
  detectStyle,
  joinForParsing,
  parseShape,
  plan,
  splitEntries,
  stripFurniture,
  UNSURE,
  vocabulary,
  type ReferenceNode,
} from "./extract-references.ts";

const SCI = resolve(import.meta.dir, "..");
const LIBRARY = join(SCI, "library");
const OUT = join(SCI, "extracted-references");

const lines = (s: string) => s.split("\n");
const split = (s: string, doc: string = s) => splitEntries(stripFurniture(lines(s), lines(doc)));

// ── Fixtures, verbatim from library/*/sections/*.md ────────────────────────

/** arxiv-2003.08005v1, sec-000-references.md: IEEE, `[n]`, one word per line in [9]. */
const IEEE = `[8] M. Condon, “Applying hierarchical contextual parsing with visual
density and geometric features to typeset formula recognition,” Master’s
thesis, Rochester Institute of Technology, Rochester, NY, USA, 2017.
[9] Y.
Deng,
A.
Kanervisto,
J.
Ling,
and
A.
M.
Rush,
“Image-
to-markup generation with coarse-to-ﬁne attention,” arXiv preprint
arXiv:1609.04938, 2016.
[10] J. Zhang, J. Du, and L. Dai, “Track, attend, and parse (tap): An
end-to-end framework for online handwritten mathematical expression
recognition,” IEEE Transactions on Multimedia, vol. 21, no. 1, pp. 221–
233, 2018.`;

/** arxiv-2512.09874v3, sec-000-document.md: Springer LNCS, `n.`, a page break with its running head. */
const LNCS = `13. Labahn, G., Lank, E., MacLean, S., Marzouk, M., Tausky, D.: MathBrush: A
system for doing math on pen-based devices. In: Proceedings of the Eighth IAPR
International Workshop on Document Analysis Systems (DAS). pp. 599–606 (2008)

14
P. Horn and J. Keuper
14. Levenshtein, V.I.: Binary codes capable of correcting deletions, insertions, and
reversals. Soviet Physics Doklady 10(8), 707–710 (1966)
15. Li, H., Dong, Q., Chen, J., Su, H., Zhou, Y., Ai, Q., Ye, Z., Liu, Y.: Llms-as-judges:
A comprehensive survey on llm-based evaluation methods. arXiv preprint (2024)`;
/** The same document, entries 24–26: an access date whose day the line break left on a line of its own. */
const LNCS_ACCESSED = `24. OmniAI Technology, Inc.: Omni OCR Benchmark. Hugging Face Dataset,
https://huggingface.co/datasets/getomni-ai/ocr-benchmark
(2025),
ac-
cessed: 2025-11-17
25. OpenAI:
GPT-5:
Openai’s
next
generation
language
model.
https://openai.com/index/introducing-gpt-5/
(2025),
accessed:
2025-12-
01
26. Ouyang, L., Qu, Y., Zhou, H., Zhu, J., Zhang, R., Lin, Q., Wang, B., Zhao, Z.,
Jiang, M., Zhao, X., Shi, J., Wu, F., Chu, P., Liu, M., Li, Z., Xu, C., Zhang, B., Shi,
B., Tu, Z., He, C.: Omnidocbench: Benchmarking diverse pdf document parsing`;
/** The running head repeats through the document (eight times); that is how it is told from an entry's line. */
const LNCS_DOC = `${LNCS}\n12\nP. Horn and J. Keuper\n16\nP. Horn and J. Keuper`;

/** arxiv-2406.01940v2, sec-016-conclusion.md: natbib author-year, no markers, a page break mid-entry. */
const AUTHOR_YEAR = `Josh Achiam, Steven Adler, Sandhini Agarwal, Lama Ahmad, Ilge Akkaya, Florencia Leoni Aleman,
Diogo Almeida, Janko Altenschmidt, Sam Altman, Shyamal Anadkat, et al. Gpt-4 technical report.
arXiv preprint arXiv:2303.08774, 2023.
Anthropic. Introducing the next generation of claude, 2024. URL https://www.anthropic.
com/news/claude-3-family.
Zhangir Azerbayev, Hailey Schoelkopf, Keiran Paster, Marco Dos Santos, Stephen McAleer, Albert Q.
Jiang, Jia Deng, Stella Biderman, and Sean Welleck. Llemma: An open language model for
mathematics. CoRR, abs/2310.10631, 2023b. doi: 10.48550/ARXIV.2310.10631. URL https:
//doi.org/10.48550/arXiv.2310.10631.
Jiaqi Chen, Tong Li, Jinghui Qin, Pan Lu, Liang Lin, Chongyu Chen, and Xiaodan Liang. Unigeo:
Unifying geometry logical reasoning via reformulating mathematical expression. In Yoav Goldberg,
Zornitsa Kozareva, and Yue Zhang (eds.), Proceedings of the 2022 Conference on Empirical
Methods in Natural Language Processing, EMNLP 2022, Abu Dhabi, United Arab Emirates,
11
Work in progress
December 7-11, 2022, pp. 3313–3323. Association for Computational Linguistics, 2022. doi:
10.18653/V1/2022.EMNLP-MAIN.218. URL https://doi.org/10.18653/v1/2022.
emnlp-main.218.
A`;
const AUTHOR_YEAR_DOC = `${AUTHOR_YEAR}\n12\nWork in progress\n13\nWork in progress`;

/** arxiv-2602.16554v1, sec-011-conclusion.md: an editor's `(ed.).` and a title that opens like a name list. */
const EDITED = `Christian Szegedy (ed.).
A Promising Path Towards Autoformalization and General Artificial
Intelligence, 2020.
Guillem Tarrach, Albert Q. Jiang, Daniel Raggi, Wenda Li, and Mateja Jamnik. More Details,
Please: Improving Autoformalization with More Detailed Proofs. June 2024. URL https:
//openreview.net/forum?id=AkJvzpYMvK.`;

/** arxiv-2604.00554v1, sec-029-references.md: ACM, footnotes and a running head between [12] and [13]. */
const ACM = `[12] Lei Huang, Weijiang Yu, Weitao Ma, Weihong Zhong, Zhangyin Feng, Haotian
Wang, Qianglong Chen, Weihua Peng, Xiaocheng Feng, Bing Qin, et al. 2023. A
survey on hallucination in large language models: Principles, taxonomy, chal-
lenges, and open questions. ACM Transactions on Information Systems (2023).
1https://github.com/zbMATHOpen/retroD/tree/master/documents_splitting/Thesis_Pluzhnikov_Ivan
2DOI: 10.5281/zenodo.14253145
Pluzhnikov et al.
[13] Shahab Kamali and Frank Wm. Tompa. 2010. A new mathematics retrieval
system. In Proc. ACM CIKM. 1413–1416. doi:10.1145/1871437.1871635`;
const ACM_DOC = `${ACM}\nPluzhnikov et al.\nPluzhnikov et al.`;

/** arxiv-2601.22554v1, sec-012-limitations.md: URLs cut mid-word by the line break. */
const CUT_URL = `[13] Alex Kontorovich and Terence Tao. Prime Number Theorem and More, 2024. URL https://github.c
om/AlexKontorovich/PrimeNumberTheoremAnd.`;

// ── Splitting ────────────────────────────────────────────────────────────────

describe("splitting a reference list into entries", () => {
  test("[n] lists split on the next number, and a one-word-per-line entry stays one entry", () => {
    const es = split(IEEE);
    expect(detectStyle(lines(IEEE))).toBe("bracket");
    expect(es.map((e) => e.n)).toEqual([8, 9, 10]);
    expect(es[1].lines.join(" ")).toContain("Y. Deng, A. Kanervisto, J. Ling, and A. M. Rush,");
  });

  test("n. lists split on the next number in sequence; an out-of-sequence number starts nothing", () => {
    expect(split(LNCS, LNCS_DOC).map((e) => e.n)).toEqual([13, 14, 15]);
    expect(split(LNCS_ACCESSED).map((e) => e.n)).toEqual([24, 25, 26]);
    // A minimal case, not library text: `7.` inside entry 2 is not the 3 that comes next.
    expect(splitEntries(["1. A, B.: One. (2001)", "2. C, D.: Two, see", "7. more. (2002)", "3. E, F.: Three. (2003)"]).map((e) => e.n)).toEqual([1, 2, 3]);
  });

  test("page numbers and running heads are dropped; a number that finishes the line before is kept", () => {
    const es = split(LNCS, LNCS_DOC);
    expect(es.map((e) => e.lines.join(" ")).join("\n")).not.toContain("P. Horn and J. Keuper");
    expect(es[0].lines.join(" ")).toEndWith("(DAS). pp. 599–606 (2008)");
    expect(split(LNCS_ACCESSED)[1].lines.join(" ")).toEndWith("accessed: 2025-12- 01");
  });

  test("author-year paragraphs split where a line opens an author list after a closed sentence", () => {
    const es = split(AUTHOR_YEAR, AUTHOR_YEAR_DOC);
    expect(detectStyle(lines(AUTHOR_YEAR))).toBe("author-year");
    expect(es.map((e) => e.lines[0].slice(0, 20))).toEqual([
      "Josh Achiam, Steven ",
      "Anthropic. Introduci",
      "Zhangir Azerbayev, H",
      "Jiaqi Chen, Tong Li,",
    ]);
    // `Albert Q.` ends a line with an initial: the next line continues the author list.
    expect(es[2].lines.join(" ")).toContain("Albert Q. Jiang, Jia Deng");
    // The page break inside the last entry, and the appendix letter after the list, are gone.
    const last = es[3].lines.join(" ");
    expect(last).not.toContain("Work in progress");
    expect(last).toEndWith("emnlp-main.218.");
  });

  test("an editor's `(ed.).` does not end the entry, and a title line is not a name list", () => {
    const es = split(EDITED);
    expect(es).toHaveLength(2);
    expect(es[0].lines.join(" ")).toBe("Christian Szegedy (ed.). A Promising Path Towards Autoformalization and General Artificial Intelligence, 2020.");
  });

  test("footnotes and a running head between two entries belong to neither", () => {
    const es = split(ACM, ACM_DOC);
    expect(es.map((e) => e.n)).toEqual([12, 13]);
    expect(es[0].lines.join(" ")).toEndWith("ACM Transactions on Information Systems (2023).");
  });
});

// ── Parsing ──────────────────────────────────────────────────────────────────

describe("parsing only what the entry makes unambiguous", () => {
  const vocab = vocabulary([...lines(AUTHOR_YEAR), ...lines(ACM), "mathematical expressions", "learning to-markup"]);

  test("a URL broken after its own punctuation is rejoined", () => {
    const es = split(AUTHOR_YEAR, AUTHOR_YEAR_DOC);
    expect(joinForParsing(es[1].lines, vocab)).toContain("URL https://www.anthropic.com/news/claude-3-family.");
    expect(joinForParsing(es[2].lines, vocab)).toContain("https://doi.org/10.48550/arXiv.2310.10631.");
  });

  test("a URL cut mid-word is not rejoined: the result would be a guess", () => {
    const text = joinForParsing(split(CUT_URL)[0].lines, vocab);
    expect(text).toContain(UNSURE);
    expect(text).not.toContain("https://github.c");
  });

  test("a hyphen at a line break is rejoined only on the paper's own evidence", () => {
    // `chal-` / `lenges`: neither `challenges` nor `chal-lenges` is in this vocabulary.
    expect(joinForParsing(["taxonomy, chal-", "lenges, and"], vocab)).toContain(UNSURE);
    expect(joinForParsing(["mathe-", "matical expressions"], vocab)).toBe("mathematical expressions");
  });

  test("an IEEE entry: the quoted title, the name list before it", () => {
    const p = parseShape("J. Zhang, J. Du, and L. Dai, “Track, attend, and parse (tap): An end-to-end framework,” IEEE Transactions on Multimedia, 2018.", "bracket");
    expect(p.title).toBe("Track, attend, and parse (tap): An end-to-end framework");
    expect(p.author).toEqual([
      { family: "Zhang", given: "J." },
      { family: "Du", given: "J." },
      { family: "Dai", given: "L." },
    ]);
  });

  test("an ACM entry: the year after the authors; a non-initial abbreviation leaves the authors out", () => {
    const p = parseShape("Shahab Kamali and Frank Wm. Tompa. 2010. A new mathematics retrieval system. In Proc. ACM CIKM. 1413–1416.", "bracket", true);
    expect(p.year).toBe(2010);
    expect(p.title).toBe("A new mathematics retrieval system");
    expect(p.author).toBeUndefined();
  });

  test("one name that is not initials-first stays whole, as `literal`", () => {
    expect(parseShape("Anthropic. Introducing the next generation of claude, 2024. URL https://x.org/.", "author-year")).toEqual({
      author: [{ literal: "Anthropic" }],
      title: "Introducing the next generation of claude",
    });
  });

  test("an OCR'd diacritic (`Doll´ar`) leaves the author list out rather than spelling a name wrong", () => {
    const p = parseShape("T.-Y. Lin, P. Goyal, and P. Doll´ar, “Focal loss for dense object detection,” in Proc. ICCV, 2017.", "bracket");
    expect(p.author).toBeUndefined();
    expect(p.title).toBe("Focal loss for dense object detection");
  });
});

// ── The committed output ─────────────────────────────────────────────────────

const committed = (): { file: string; node: ReferenceNode }[] =>
  readdirSync(OUT)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ file: f, node: JSON.parse(readFileSync(join(OUT, f), "utf-8")) as ReferenceNode }));

/** Lower-case, ligatures as letters, no whitespace, no line-break hyphens: what a field is checked against. */
const flat = (s: string) =>
  s
    .replace(/[ﬀ-ﬆ]/g, (c) => c.normalize("NFKC"))
    .toLowerCase()
    .replace(/-\s+/g, "")
    .replace(/-/g, "")
    .replace(/\s+/g, "");

describe("the committed extracted-references/", () => {
  test("is what the library gives (the check:extracted-references gate)", () => {
    const p = plan(LIBRARY);
    const onDisk = new Map(committed().map(({ file }) => [file, readFileSync(join(OUT, file), "utf-8")]));
    expect([...onDisk.keys()].sort()).toEqual([...p.files.keys()].sort());
    for (const [f, body] of p.files) expect(onDisk.get(f), f).toBe(body);
    expect(p.documents.length).toBeGreaterThanOrEqual(7);
  });

  test("every node passes core's ReferenceNodeSchema, with extracted provenance and a section it came from", () => {
    for (const { file, node } of committed()) {
      const r = ReferenceNodeSchema.safeParse(node);
      expect(r.success, `${file}: ${r.success ? "" : JSON.stringify(r.error.issues)}`).toBe(true);
      expect(node.$schema).toBe(REFERENCE_SCHEMA_TAG);
      expect(node.provenance).toBe("extracted");
      expect(node.derivedFrom).toMatch(/^folio-assistant-sci\/library\/[^/]+\/sections\/[^/]+\.md$/);
      expect(existsSync(join(SCI, node.derivedFrom.replace(/^folio-assistant-sci\//, "")))).toBe(true);
      expect(["article-journal", "document"]).toContain(node.type);
      expect(node.note.length).toBeGreaterThan(0);
    }
  });

  test("ids are valid citation keys, unique, `<doc-id>.r<n>`, and name their file", () => {
    const seen = new Set<string>();
    for (const { file, node } of committed()) {
      expect(node.id).toMatch(/^[A-Za-z0-9][A-Za-z0-9._:+-]*$/);
      expect(file).toBe(`${node.id}.json`);
      const doc = node.derivedFrom.split("/")[2];
      expect(node.id).toMatch(new RegExp(`^${doc.replace(/[.]/g, "\\.")}\\.r[1-9]\\d*$`));
      expect(seen.has(node.id)).toBe(false);
      seen.add(node.id);
    }
  });

  test("no field is invented: every parsed value is in the entry's own text", () => {
    const allowed = new Set(["$schema", "id", "type", "title", "author", "issued", "DOI", "URL", "note", "provenance", "derivedFrom"]);
    for (const { file, node } of committed()) {
      for (const k of Object.keys(node)) expect(allowed.has(k), `${file}: unexpected field ${k}`).toBe(true);
      const note = flat(node.note);
      if (node.title) expect(note, `${file}: title`).toContain(flat(node.title));
      for (const a of node.author ?? []) {
        for (const part of [a.family, a.given, a.literal]) if (part) expect(note, `${file}: author ${part}`).toContain(flat(part));
      }
      if (node.issued) {
        const [[year]] = node.issued["date-parts"];
        expect(node.note, `${file}: year`).toContain(String(year));
      }
      if (node.DOI) expect(note, `${file}: DOI`).toContain(flat(node.DOI));
      if (node.URL) {
        const arxiv = /^https:\/\/arxiv\.org\/abs\/(\d{4}\.\d{4,5})$/.exec(node.URL);
        expect(note, `${file}: URL`).toContain(flat(arxiv ? arxiv[1] : node.URL.replace(/^https?:\/\//, "")));
      }
    }
  });

  test("the bibliography viewer's collect() reads every entry, and finds none of them invalid", () => {
    const c = collect();
    const ours = c.entries.filter((e) => e.subgraph === "sci-extracted-references");
    expect(ours.length).toBe(committed().length);
    expect(ours.every((e) => e.instance === "folio-assistant-sci" && e.ref.provenance === "extracted")).toBe(true);
    expect(c.invalid.filter((i) => i.includes("extracted-references"))).toEqual([]);
    expect(c.subgraphs.some((s) => s.id === "sci-extracted-references" && s.kind === "references")).toBe(true);
  });
});
