---
# folio-assistant-3gef
title: 'smart-base: ingest the seven WHO publications to library/'
status: completed
type: task
priority: high
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-09-22T09:33:37Z
parent: folio-assistant-2yyh
---

Issue #877. `bun run ingest uploads/FILE.pdf --library smart-base`, one per document, letting `ingest-document.ts` pick the rung from the probe rather than from the ingesting agent's head.

**An inferred chapter tree is refused rather than guessed** — bean `6xaz` records two documents where inference was confidently wrong and the output did not show it. Absence of an outline selects PAGE granularity; it never selects "infer one". A PDF the prober cannot read is `undetermined` and is NOT ingested.

`Home _ folio-assistant.pdf` is a print of this project's own home page — flagged as a probable stray, not ingested, pending the owner's word.

## Done when
- [ ] seven `library/<bib-slug>/` entries, each with `structure.json` and `sections/`
- [ ] the rung chosen for each is recorded, with its evidence
