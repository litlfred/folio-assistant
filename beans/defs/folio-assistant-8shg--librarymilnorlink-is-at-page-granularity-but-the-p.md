---
# folio-assistant-8shg
title: library/milnorlink is at PAGE granularity but the PDF has 35 outline entries
status: todo
type: bug
created_at: 2026-09-20T04:11:26Z
updated_at: 2026-09-20T04:11:26Z
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
