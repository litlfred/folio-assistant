---
# folio-assistant-apui
title: 'INGEST: one pipeline entry point — uploads/ to library/ through a single documented path'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T12:12:22Z
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

_2026-09-19T12:12:22Z_ — Re-measured 2026-09-19 before starting. The bean's description of TODAY is stale in three ways, and the third changes the size of the job.

1. It names scripts/migrate-uploads-to-library.py as the current path. That file DOES NOT EXIST.

2. It says the move is done by that script 'plus whatever the ingesting agent remembers to run'. Measured: NOTHING in the repo writes library/ at all. A grep for writeFile/mkdir/copy/move targeting library/ across scripts/, content/ and src/ returns zero. The files that mention library/ are readers — harness-dirs, repo-partition, scan-repo-content, check-declared-paths — plus two PDF helpers. git log on library/milnorlink/structure.json shows it was created by an ordinary content commit ('The Milnor voice is derived from Milnor...'), i.e. hand-authored.

3. Its motivating harm is not currently live. All four files in uploads/ already have matching library/ slugs (9789241548960_eng.pdf -> 9789241548960-eng, WHO_PUB_TPS_93.1.pdf -> who-pub-tps-931, WPR-RDO-2020-003-eng.pdf -> wpr-rdo-2020-003-eng, milnorlink.pdf -> milnorlink). So there is no un-ingested source making a clean corpus-grep lie right now. The RISK the bean describes is real; the instance is not.

So this is not 'consolidate several scattered paths into one entry point'. It is 'write the pipeline, which does not exist' — with PDF extraction, sectioning, derived content, a Dublin Core record and a manifest all to be designed, and it is the spine nine sibling beans in the INGEST epic hang off. Left unclaimed rather than started, because that is a materially bigger and more design-heavy job than the bean advertises and the owner should price it before I build it.
