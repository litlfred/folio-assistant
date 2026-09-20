---
# folio-assistant-8shg
title: library/milnorlink is at PAGE granularity but the PDF has 35 outline entries
status: completed
type: bug
priority: normal
created_at: 2026-09-20T04:11:26Z
updated_at: 2026-09-20T04:52:35Z
parent: folio-assistant-slw1
---


## What

`library/milnorlink/structure.json` records `toc_source: none`,
`granularity: page`, 20 sections. But the source PDF **has an embedded
outline with 35 entries**, so it should have taken the `pdf-structure` rung
and been read at chapter granularity.

## How it was found

Only visible once a PDF backend existed. With the lean dependency set
installed (bean `68dt`), `bun run scripts/ingest-document.ts
uploads/milnorlink.pdf --dry-run` selects **`pdf-structure`** — 35 outline
entries. The committed entry disagrees with what the document actually
offers.

    milnorlink.pdf          rung: pdf-structure
    9789241548960_eng.pdf   rung: pdf-structure
    WHO_PUB_TPS_93.1.pdf    rung: pdf-ocr+pdf-pages   (the scan, correctly)

That third line is worth keeping: the router identified the 121-page scan
as needing OCR without being told, which is the first end-to-end evidence
that `apui`'s rung selection is right.

## Why it matters, and why it is NOT `6xaz`

`6xaz` is the opposite failure — a TOC INFERRED from a worked example and
shipped as the document's own. This is a document whose real outline was
available and not used, so the entry is at a strictly worse rung than the
source supports: a page tree where a chapter tree was readable. Page
granularity is honest but harder to read and harder to cite, and
`pdf-pages.py`'s own docstring says so — *"Once `6xaz` is fixed, re-ingest
with `pdf-structure.py` and delete the page tree."*

## Unknown, and not guessed

WHY it ended up on the page rung is not established. The `r1lz` note from
2026-09-19T00:13 records all three documents being ingested in a session
that installed `pymupdf` by hand, so the backend was present then. Whether
the outline was missed, whether an earlier `pdf-structure` run failed, or
whether it was a deliberate choice is not recorded anywhere. Do not assume;
check the history before re-ingesting.

## Done when

Either `library/milnorlink/` is re-ingested through `pdf-structure` and the
page tree removed, or `structure.json` records WHY the page rung was chosen
for a document that did not need it — the same `structure_note` discipline
`pdf-pages.py` already applies to documents that genuinely have no outline.

Re-ingesting replaces committed content, so it needs the owner's word
first (`deletion-requires-confirmation`).

## 2026-09-20 — the premise was wrong, and the bug is elsewhere

**This bean was opened against content that was correct.** `library/milnorlink/`
belongs at the page rung. What is broken is the ROUTER, and the note that
explained the rung.

### Measured

`uploads/milnorlink.pdf` carries an embedded outline of **35 entries, and not
one of them is a heading of this document**:

| | |
|---|---|
| bare page labels (`p. 177`, `p. 178`, …) | 19 (54 %) |
| no resolvable destination (page `-1`) | 16 (45 %) |
| neither | **0** |

The two top-level entries are `Article Contents` and `Issue Table of Contents`;
thirteen entries name OTHER articles from the same JSTOR issue, which are not in
this file. The 19 page labels correspond one-to-one with the 20-page article.
It is a journal wrapper, not a structure.

### The real defect

`planForPdf` routed on `p.outline > 0` — a raw COUNT. It would have sent this
document to `pdf-structure`, producing a section tree of page numbers plus
thirteen phantom chapters. Fixed: the probe now reports `outlineUsable`, and an
entry counts only if it resolves and is not merely a page reference.

A **second** defect surfaced while fixing the first. The rule was briefly
spelled twice — once as a TS regex, once as a Python regex **inside a JS
template literal**, where a regex escape is an invalid string escape and JS
drops the backslash. Python received a pattern matching nothing and reported the
35 junk entries as **19 usable chapters**. Nothing failed; the answer was wrong
in the unsafe direction. The probe now emits `(title, page)` and TypeScript
decides, so the rule has one spelling on that path.

### Resolved via the bean's second branch, not the first

Not re-ingested — re-ingesting would have been the wrong action. Instead:

* `structure.json` records `toc_source: "outline-unusable"` (was `"none"`) and a
  note saying what the outline actually is. The page tree is unchanged: 20
  sections in, 20 sections out.
* `pdf-pages.py` now COMPUTES that field via `outline_state()` instead of
  writing `"none"` unconditionally — otherwise re-running the rung would
  silently revert the correction, and a hand-patched fact the pipeline
  overwrites is not a fix.
* `scripts/tests/pdf-pages-outline.test.py` pins the two remaining spellings of
  the rule against the same cases, because a duplicate nobody checks is exactly
  how this started.

### What this leaves

The old note said the PDF "carries no embedded outline" — true to the rung
chosen, false about the document. That false reason is what opened this bean.
Worth remembering: a note that states a conclusion correctly and a reason
falsely costs a later reader a full investigation.
