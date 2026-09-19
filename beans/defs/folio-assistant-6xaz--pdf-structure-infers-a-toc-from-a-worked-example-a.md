---
# folio-assistant-6xaz
title: pdf-structure infers a TOC from a worked EXAMPLE and ships it as the document's own structure
status: todo
type: bug
created_at: 2026-09-19T00:12:09Z
updated_at: 2026-09-19T00:12:09Z
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
