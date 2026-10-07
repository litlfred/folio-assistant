---
# folio-assistant-t8c4
title: 'bootstrap subgraph nodes carry no sourcePath: decide whether the reader needs it'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T07:18:59Z
updated_at: 2026-10-04T08:36:10Z
parent: folio-assistant-whlc
---

Owner, 2026-10-04, on litlfred/bootstrap-tools#7 item 4: 'track in bean'.

bootstrap-tools#7 publishes bootstrap's and bootstrap-tools' named subgraphs with each node's file as an absolute `source` IRI (`dcterms:source`, owner ruled 'ok' on absolute IRIs) and NO repository-relative `sourcePath` literal, which folio-assistant's own subgraph files carry. folio-assistant's process-index reader (`cat-harness/docs/assets/js/process-index.js`, bean ax6r) currently keys rows off what folio-assistant publishes.

## Done when
- folio-assistant's reader reads bootstrap's remote subgraph files using `source` (not `sourcePath`), and `check:process-index` covers all declared diagrams (today 81 of 87; the 6 are bootstrap's)
- OR a decision is recorded that `sourcePath` is added upstream instead, with the reason
- blocked until bootstrap-tools#7 merges

Claimed by claude/nifty-faraday-8ql41p — bootstrap-tools#7 merged (ce5a2ce); bumping the submodule and reading `source`.
