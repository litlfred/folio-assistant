---
# folio-assistant-apui
title: 'INGEST: one pipeline entry point — uploads/ to library/ through a single documented path'
status: in-progress
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T12:31:11Z
parent: folio-assistant-slw1
---

## What

`uploads/` and `library/` are two stages of ONE pipeline, but there is no single
entry point that takes a file across. Today the move is done by
`scripts/migrate-uploads-to-library.py` plus whatever the ingesting agent
remembers to run.

## Why it matters more than it looks

**The corpus-grep checklist searches `library/` only.** Anything still in
`uploads/` is invisible to every "has the corpus already got this?" check — so
an un-ingested paper does not merely sit unread, it makes a *clean grep* mean
"nobody has done this" when the source is right there. That is exactly how a
held result gets re-derived.

## Done when

One documented command takes a file from `uploads/` to `library/<bib-slug>/`
with structure, derived content, the Dublin Core record and the manifest, and
every other path is a wrapper around it or is deleted.

Diagram: `skills/workflows/document-ingestion.bpmn` (`Process_Ingestion`).

_2026-09-19T12:31:11Z_ — DONE (first cut). One entry point: bun run ingest uploads/FILE.pdf [--dry-run].

It CHOOSES a rung and runs it; it re-implements nothing. The rule is read off the four entries already in library/, not invented:
  toc_source: outline                       -> pdf-structure
  toc_source: none, text_source: text-layer -> pdf-pages
  toc_source: none, text_source: ocr        -> pdf-ocr, then pdf-pages --from-ocr
Verified: all four uploads resolve to the slug their existing library entry already has.

Third state: a PDF that cannot be probed is 'undetermined', exit 2, ingests NOTHING. Never 'no outline' -- a document filed under the wrong rung reads as ingested while its structure is wrong, which is 6xaz's failure mode. This container has no PyMuPDF, so all four currently report undetermined, which is the behaviour working rather than a gap.

The decision rules are a SKILL, per the owner: skills/folio-core/library-ingestion.md, in the HARNESS layer. Not folio-assist-core: uploads and library are both harness-declared graph kinds (folio is core's), so putting ingestion in core would make the harness's own library graph writable only from above it -- a wrong-direction dependency, and after the split a circular one between repos. That is what zlmp exists to drain.

Two things the gates caught in my own work, both the same defect as the bean-store one earlier today: I hardcoded '-o library' four times (check:declared-paths refused it; now read via directoryForGraph from harness.json), and I reimplemented slugify in TypeScript (it got WPR-RDO-2020-003-eng wrong; scripts/_pdf_doc_id.py is the one definition, and bean rlp5 records that three copies already existed and drifted -- mine would have been a fourth).

NOT done: --dry-run cannot be verified end-to-end here without a PDF backend, and no upload was actually re-ingested (all four already have entries). 12 tests cover the decision against fixtures.
