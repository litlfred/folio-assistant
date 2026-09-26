---
# folio-assistant-6xaz
title: pdf-structure infers a TOC from a worked EXAMPLE and ships it as the document's own structure
status: in-progress
type: bug
priority: normal
created_at: 2026-09-19T00:12:09Z
updated_at: 2026-09-20T14:53:07Z
parent: folio-assistant-0lmb
---

Measured 2026-09-19 ingesting `uploads/WPR-RDO-2020-003-eng.pdf` (WHO WPRO 'Publication and Information Products Style Guide', 33pp, no embedded outline).

`scripts/pdf-structure.py` inferred 13 sections and wrote 11 of them named after **a different publication**: 'FACILITY LEVEL: Improving hospital planning and management', '1.1 Accountability', '2.1 Goal – Hospitals as a path to UHC'. Those come from page 22, which is a SAMPLE TABLE the style guide reproduces as a design example ('OVERVIEW OF ACTION AREAS AND DOMAINS'). Every level-2 entry was stamped `page: 22` — the page the table was found on — so the collision is visible in the output and nothing acts on it.

The document's real structure is a style guide: INTRODUCTION (p3), PAGINATION (p23), and so on.

**Why this is worse than no sections.** `content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md` argues that an un-ingested source is worse than an absent one 'because it produces false confidence rather than a gap'. Misnamed sections are that failure one level in: they are greppable, they are in `library/`, and they answer a question wrongly with authority. Ingested with `--no-sections` for now, so it carries `structure.json` and no false tree.

`toc_source: "inferred"` IS recorded, and `diagnostics` reports `toc_entries: 13, sections: 13` — but a consumer reading `sections/` cannot tell an inferred tree from an outline-derived one, and the two are not comparable in trustworthiness. Contrast `uploads/9789241548960_eng.pdf` (WHO handbook for guideline development, 2nd ed), which HAS an embedded outline: `toc=258(out)`, 250 sections, all sound.

## Done when
- An inferred TOC whose entries collapse onto one or two source pages is reported as NOT DETERMINED rather than emitted — the third-state rule this repo applies everywhere else ('could not determine' is never rendered as an answer).
- `sections/` records its own `toc_source`, so a consumer can weight an inferred tree differently from an outline-derived one without re-reading `structure.json`.
- A test over a PDF containing a sample table asserts the sample is not read as structure.

_2026-09-19T00:18:29Z_ — ## Widened — it hit BOTH outline-less documents, in different shapes

Measured 2026-09-19 on the second one too, `uploads/WHO_PUB_TPS_93.1.pdf` (WHO Editorial Style Manual, 121 scanned pages, OCR'd):

`pdf-structure.py --ocr` read the TOC titles correctly — Spelling, Punctuation, Quotations, Non-discriminatory language are the manual's real chapters — but took every entry's PAGE NUMBER from the contents page it was found on (`pages: 2-2`, `pages: 4-4`). So the section boundaries were meaningless: **26 of 42 sections came out under 500 characters** while 37 923 characters landed in one section misnamed `sec-039-18-usetul-reference-books` (OCR typo included) and 20 922 in `sec-040-1-seat-of-government-la-paz`.

So the failure is not only 'a sample table read as structure'. Both shapes are the same root cause: an inferred TOC is emitted with the same authority as an outline-derived one, and `sections/` does not record which it was.

**Interim, not a fix:** `scripts/pdf-pages.py` ingests at PAGE granularity — `section_title: "Page N"`, `pages: N-N`, `granularity: page`, `toc_source: none`. A page is a determined division; an inferred chapter was not. Both documents re-ingested that way, so every rule derived from them can cite a node that really contains it. Delete the page trees and re-ingest with `pdf-structure.py` once this bean is fixed.

Contrast held: `uploads/9789241548960_eng.pdf` HAS an embedded outline and its 250 chapter sections are sound — real titles, real page ranges ('Identifying and managing conflicts of interest', pp 46-47, 1120 chars).


_2026-09-20_ — Claimed by `claude/ecstatic-goldberg-eroyaz`.


## 2026-09-20 — shape one fixed and pinned; shape two measured and NOT fixed

### What landed

`inferred_toc_verdict` in `scripts/pdf-structure.py`. An inferred table of
contents whose entries concentrate on the commonest one or two source pages is
recorded as `toc_source: "undetermined"` with a reason in numbers, and no tree
is emitted. `split_sections` on an empty TOC yields one `sec-000-document`
holding the whole text, so **refusing a tree is not discarding the document** —
it stays greppable under an honestly named node.

Measured on the document this bean was opened over, before and after:

```
BEFORE  toc_source=inferred     toc=13  sections=13
  shipped: ['Front matter', 'Introduction',
            'FACILITY LEVEL: Improving hospital planning and management',
            'Accountability', 'Efficiency', 'Quality']
AFTER   toc_source=undetermined toc=0   sections=1
  ships  : ['Document']
  reason : 13 inferred entries, 92% of them starting on page(s) 22, 24 of 33
           — a list found ON a page, not the document's structure
```

`sections/*.md` now carries `toc_source:` in its front matter. That is the half
serving BOTH shapes: it is `sections/` that gets read, quoted and cited, and a
consumer there could not previously tell an inferred tree from an
outline-derived one.

**The falsifier held, and it was the sharp one.** `9789241548960_eng.pdf` — the
one document with a real embedded outline — came out **byte-identical** field
for field: `toc_source: outline`, 258 TOC entries, 250 sections, only the two
new keys added. If the detector had touched it, the detector was wrong.

### Shape two: measured, and deliberately left open

The widening note above predicted `WHO_PUB_TPS_93.1.pdf` would fail the same
way. **It does not.** Re-measured today with `--ocr`:

| | |
|---|---|
| entry page concentration | page 2 ×6, page 39 ×5, page 3 ×4 — **top two = 27% of 41** |
| verdict | `None` — correctly trusted by this detector |
| the actual damage | 26 of 42 sections under 500 chars; 37,923 in `sec-039-18-usetul-reference-books` |

So its signature is **degenerate section sizes**, not TOC concentration — a
different defect in `split_sections`, which matches an entry's title within
`page ± 2` and so lands a boundary on the contents page itself.

**Why no second detector.** A size-distribution check needs calibrating, and
the corpus offers nothing to calibrate against: one bad inferred document, and
**zero known-good inferred ones** — the only well-behaved document here
(`9789241548960-eng`, median 779 chars, 30% under 500) is outline-derived and
would never be subject to the check. A threshold set from one failure and no
contrast is a number nobody can re-derive, which is the defect class this
session has spent the day removing. It would also have been a *wrong pass*
dressed as diligence.

### Verification

15 checks in `scripts/tests/pdf-toc-verdict.test.py`, ten mutations each caught
by a named one. Two fixture PDFs are built by hand — the repository declares no
PDF *writer*, and a fixture needing an undeclared dependency is one CI cannot
build. The second exists because of a **surviving mutation**: "an outline is
second-guessed too" passed against the handbook, whose outline is spread over
179 pages, so the arm proved nothing until a PDF with a *concentrated* outline
was built to pin the property rather than the document.

### Still open

- Shape two, above — `split_sections` boundaries on an inferred TOC.
- Re-ingesting the two documents with `pdf-structure.py` (they carry
  interim page-granularity trees from `pdf-pages.py`). The bean says to do that
  once this is fixed; shape two is not, so they stay as they are.
