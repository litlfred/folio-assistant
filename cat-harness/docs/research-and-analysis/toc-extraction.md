---
title: "Table-of-contents extraction — methods compared against held-out PDF outlines"
kind: research
bean: folio-assistant-cp3v
summary: >-
  Which way of inferring a PDF's table of contents works, when the PDF has no outline? Five methods scored on 2026-10-06 against the 13 corpus PDFs that do carry one, with the outline hidden and used as the answer key. Layout (a printed contents page, else heading styles from font metrics) reaches title F1 0.86 against 0.30 for the text-pattern heuristic it replaces. Grobid and Nougat assessed from the literature; neither could be run here.
---

# Table-of-contents extraction
{: .no_toc }

1. TOC
{:toc}

---

> **What this page is.** It records what was measured on **2026-10-06**, on
> this repository's PDFs, for [issue #2302](https://github.com/litlfred/folio-assistant/issues/2302)
> ("Need better TOC extractor"). The rule an agent follows lives in the
> `document-intake` skill; this page keeps the evidence. Read the
> [limits](#what-this-could-not-establish) before the conclusions.

## The question

`pdf-structure.py` reads a PDF's table of contents from its embedded outline
(bookmarks) when there is one. When there is not — 18 of the 31 PDFs in this
repository on 2026-10-06 have no outline or a single entry — it used to infer one with regular expressions over
plain page text (`infer_headings`). Plain text has discarded what makes a
heading visible: larger type, bold, capitals, italics. So that fallback found
only headings that were numbered or carried one of thirteen stock names.

## How it was measured

**The answer key is the outline itself.** 13 PDFs carry an outline of five or
more entries. For each, the outline is set aside, every method runs on the page
content alone, and its output is scored against the outline. No hand labelling,
and the same harness re-runs after every change:
`python3 cat-harness/scripts/toc-benchmark.py`.

The metrics are the ones the uploaded papers use, so results compare:

| metric | meaning | from |
|---|---|---|
| title P / R / F1 | an extracted entry matches an outline entry when normalised titles agree (similarity ≥ 0.85), one to one, in page order | ICDAR Book Structure Extraction; Wu, Mitra & Giles 2013; "Xerox F1" in Bentabet et al. 2019 |
| link F1 | matched **and** on the same physical page | ICDAR "matching links" |
| level F1 | matched **and** at the same depth, up to one constant shift | ICDAR "matching levels", relative form (below) |
| full F1 | matched with page and level both right | ICDAR "complete entries" |
| capped F1 | title F1 after dropping predictions deeper than the outline's deepest level | this page (below) |
| TEDS | 1 − tree-edit-distance / max(tree sizes) over the nested titles | Wang, Gui & He 2023 |

Two adaptations, both forced by what the outlines are like:

- **Levels up to a constant shift.** The DPI-H reference architecture's
  bookmarks start at "1.1" as level 1, leaving out the chapter level; other
  outlines put the document title above everything. Either way it is the same
  hierarchy, and an absolute comparison scores it zero.
- **Capped F1.** `arxiv-2404.04834v4`'s outline stops at level 2, but the paper
  has numbered `5.1.1` subsections. A method that finds them is marked down for
  being right. Capped F1 drops predictions deeper than the outline goes.

Macro averages (each document counts once), PyMuPDF reading the font metrics.
TEDS is not computed for the 534-page iHRIS handbook (pure-Python tree edit
distance is too slow at 2,500 nodes) and is averaged over the other 12.

## The methods

| method | what it does | where |
|---|---|---|
| `regex` | the previous fallback: text patterns over plain page text, with the bean `6xaz` concentration verdict | `pdf-structure.py` `infer_headings` |
| `size` | the construction step of Wang et al. (2023) alone: any line set larger than the body is a heading, larger means shallower | `toc-benchmark.py` `m_size` |
| `font` | lines in a heading **style** — size, bold, capitals, italic — with running heads, captions, contents pages, cover pages and sentence-shaped lines removed; levels from section numbering where present, else style rank, repaired into a tree (Bentabet et al. 2019) | `_pdf_headings.py` `font_headings` |
| `contents` | parse a printed contents page (dotted leaders or a trailing page number), levels from numbering or indentation, then move printed page labels to physical pages by finding the titles in the body (Wu et al. 2013) | `_pdf_headings.py` `contents_headings` |
| `layout` | `contents` when it yields five or more entries, else `font` | `_pdf_headings.py` `layout_headings` |

## Results

| method | title P | title R | title F1 | capped F1 | link F1 | level F1 | full F1 | TEDS |
|---|---|---|---|---|---|---|---|---|
| `regex` | 0.46 | 0.29 | 0.30 | 0.30 | 0.29 | 0.28 | 0.28 | 0.15 |
| `size` | 0.43 | 0.63 | 0.44 | 0.51 | 0.42 | 0.36 | 0.35 | 0.27 |
| `font` | 0.69 | 0.90 | 0.76 | 0.81 | 0.75 | 0.73 | 0.73 | 0.62 |
| `contents` | 0.21 | 0.21 | 0.21 | 0.21 | 0.21 | 0.16 | 0.15 | 0.20 |
| **`layout`** | **0.82** | **0.92** | **0.86** | **0.88** | **0.85** | **0.79** | **0.78** | **0.74** |

Title F1 per document, smallest outline first:

| document | outline entries | regex | size | font | contents | layout |
|---|---|---|---|---|---|---|
| `2403.07553v1.pdf` | 16 | 0.20 | 0.40 | 0.94 | 0.00 | 0.94 |
| `2506.20759v1.pdf` | 17 | 0.53 | 0.00 | 0.71 | 0.00 | 0.71 |
| `2609.07340v1.pdf` | 17 | 0.80 | 0.00 | 0.97 | 0.00 | 0.97 |
| `arxiv-2601.04544v1.pdf` | 19 | 0.17 | 0.93 | 0.86 | 0.00 | 0.86 |
| `arxiv-2404.04834v4.pdf` | 23 | 0.23 | 0.15 | 0.77 | 0.00 | 0.77 |
| `2603.10808v1.pdf` | 27 | 0.18 | 0.86 | 0.93 | 0.00 | 0.93 |
| `2505.07664v1.pdf` | 29 | 0.00 | 0.42 | 0.93 | 0.00 | 0.93 |
| `arxiv-2507.23348v1.pdf` | 33 | 0.13 | 0.63 | 0.80 | 0.00 | 0.80 |
| `arxiv-2402.02172v5.pdf` | 39 | 0.09 | 0.40 | 0.57 | 0.00 | 0.57 |
| `9789240093362-eng.pdf` | 54 | 0.34 | 0.10 | 0.29 | 0.81 | 0.81 |
| `who-dpi-h-reference-architecture-draft-v1.pdf` | 138 | 0.45 | 0.07 | 0.42 | 1.00 | 1.00 |
| `9789241548960_eng.pdf` | 258 | 0.70 | 0.81 | 0.75 | 0.98 | 0.98 |
| `ihris_admin_handbook_sep_17_2010.pdf` | 1357 | 0.01 | 0.97 | 0.88 | 0.00 | 0.88 |

### What the table says

- **The two layout methods are complementary, and the split is by genre.**
  Every WHO publication with a printed contents page is solved by `contents`
  (0.81–1.00), where `font` is poor (0.29–0.75), because their body headings
  share styles with call-outs and boxes. Every paper has no contents page, and
  `font` carries them. `layout` takes the better of the two on every document.
- **Style beats size.** `size` (Wang et al.'s construction step alone) misses
  the IEEE convention completely (0.00 on two papers): section headings there
  are `I. INTRODUCTION` in small capitals and `A. Search strategy` in italics,
  both at body size and weight. Reading capitals and italics, gated on a section
  number, is what recovers them.
- **But `size` wins on two documents**, `arxiv-2601.04544v1` (0.93 vs 0.86) and
  the iHRIS handbook (0.97 vs 0.88). There the extra filters in `font` drop
  real headings. This is the place to look next, not a settled result.
- **Levels lag titles by about 0.07.** Most of the loss is in outlines that are
  themselves inconsistent: DPI-H puts `1.1` sections and `Appendix A` at the
  same level, and `9789240093362-eng` lists `1.2` and `1.3` at level 1 beside
  their own chapter.
- **Where `regex` was right, it was right for the same reason** — numbered
  headings (`2609.07340v1`, 0.80) — and it had no way to see anything else.

### The PDF-library question

PyMuPDF is AGPL-3.0; pdfminer.six is MIT. `_pdf_headings.py` reads font
metrics from either. Run with `--layout-backend pdfminer`:

| backend | method | title P | title R | title F1 | link F1 | level F1 | full F1 | TEDS |
|---|---|---|---|---|---|---|---|---|
| PyMuPDF (AGPL) | `layout` | 0.82 | 0.92 | 0.86 | 0.85 | 0.79 | 0.78 | 0.74 |
| pdfminer.six (MIT) | `layout` | 0.88 | 0.85 | 0.84 | 0.83 | 0.77 | 0.77 | 0.75 |
| PyMuPDF (AGPL) | `font` | 0.69 | 0.90 | 0.76 | 0.75 | 0.73 | 0.73 | 0.62 |
| pdfminer.six (MIT) | `font` | 0.76 | 0.86 | 0.76 | 0.74 | 0.72 | 0.72 | 0.65 |

Within 0.02 on every headline number, so the gain does not depend on taking
the AGPL dependency. pdfminer.six is markedly slower (the 13 documents take
about 1 minute with PyMuPDF; the pdfminer.six run was not timed but took many
times longer). `pdf-structure.py` uses
PyMuPDF when it is installed and pdfminer.six otherwise.

## Methods assessed but not run

| tool | what it is | why not run here | assessment |
|---|---|---|---|
| **Grobid** | Java service; CRF and deep-learning models trained on scientific articles: header, sections, references | needs a Docker daemon or a GitHub release download. This container has no daemon, and the network policy refuses github.com release assets (HTTP 403) | strong on its home ground, scientific articles, which is where `font` is already at 0.57–0.97. It is a server dependency, not a library, and is not trained for WHO-style publications, where the gain is needed |
| **Nougat** (Blecher et al. 2023, arXiv:2308.13418) | vision transformer encoder-decoder: page image to Markdown, headings and maths included | installs from PyPI, but the weights download from huggingface.co, which the network policy refuses (HTTP 403). On CPU it is slow enough that only a few short papers could be scored | the right tool for **scanned** PDFs, where there are no font metrics and `regex` over OCR text is all that is left. It hallucinates and repeats on long documents, so it is no replacement for an outline or a contents page |
| **LayoutLMv3** | multimodal transformer for document layout; needs fine-tuning for heading detection | no labelled data, and a GPU-scale dependency | not justified while a rule-based method reaches 0.86 |
| **Donut / GPT** (Feyisa et al. 2024) | contents-page parsing with an OCR-free image model or a prompted LLM | paper reports ~85–89 % field accuracy on 20 test documents in one domain, and its own figures disagree with its text | the rule-based `contents` method already reaches 0.81–1.00 on this corpus's contents pages, and runs offline |
| **Bentabet et al. 2019 / Wang et al. 2023 models** | char-CNN + BiLSTM-CRF; RoBERTa + GNN over a block tree | need training data and a GPU | their **rule-based parts** are implemented: Bentabet's tree repair (`tree_levels`), and Wang's size-ordered construction (the `size` baseline) |

To score Grobid or Nougat here, an environment needs `huggingface.co` (Nougat)
or a Docker daemon (Grobid). Either can also run elsewhere and write its output
as `(level, title, page)` rows, which `toc-benchmark.py`'s `score()` accepts
unchanged.

## What this could not establish

- **There is no held-out set.** The rules were developed while looking at these
  13 documents, so the numbers are a development score, and some optimism
  is built in. Each rule is written to the general convention it handles (IEEE
  small capitals, a cover page, a printed contents page), never to a document,
  and the 18 PDFs with no outline were read by eye after each change. The honest
  test is the `qou` library (715 `structure.json`, many with outlines), which
  lives in another repository.
- **An outline is not ground truth.** Some omit levels, some are
  inconsistent, and one lists sections out of order. The benchmark sorts by page
  and allows a level shift, but a method that is *more* right than the outline
  is still scored down.
- **Scanned PDFs are not covered.** OCR'd text has no font metrics, so it still
  falls to `regex`. `WHO_PUB_TPS_93.1.pdf` is the corpus example.
- **Thirteen documents in two genres** — arXiv papers and WHO publications —
  plus one software manual. Books, theses and slide decks are untested.

## References

- Z. Wu, P. Mitra, C. L. Giles. *Table of Contents Recognition and Extraction
  for Heterogeneous Book Documents.* ICDAR 2013, 1205–1209.
  `uploads/ICDAR2013-ToC.pdf`.
- N.-I. Bentabet, R. Juge, S. Ferradans. *Table-Of-Contents generation on
  contemporary documents.* arXiv:1911.08836, 2019. `uploads/1911.08836v1.pdf`.
- X. Wang, L. Gui, Y. He. *A Scalable Framework for Table of Contents Extraction
  from Complex ESG Annual Reports.* arXiv:2310.18073, 2023.
  `uploads/2310.18073v1.pdf`.
- D. W. Feyisa et al. *The Future of Document Indexing: GPT and Donut
  Revolutionize Table of Content Processing.* arXiv:2403.07553, 2024.
  `uploads/2403.07553v1.pdf`.
- L. Blecher, G. Cucurull, T. Scialom, R. Stojnic. *Nougat: Neural Optical
  Understanding for Academic Documents.* arXiv:2308.13418, 2023.
