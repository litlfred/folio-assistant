---
# folio-assistant-6xaz
title: pdf-structure infers a TOC from a worked EXAMPLE and ships it as the document's own structure
status: in-progress
type: bug
priority: normal
created_at: 2026-09-19T00:12:09Z
updated_at: 2026-09-19T00:18:29Z
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
