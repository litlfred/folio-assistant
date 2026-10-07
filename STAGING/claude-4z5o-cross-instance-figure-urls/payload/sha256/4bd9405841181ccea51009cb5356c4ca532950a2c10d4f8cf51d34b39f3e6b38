---
# folio-assistant-t8c4
title: 'bootstrap subgraph nodes carry no sourcePath: decide whether the reader needs it'
status: completed
type: task
priority: normal
created_at: 2026-10-04T07:18:59Z
updated_at: 2026-10-07T05:15:00Z
parent: folio-assistant-whlc
---

Owner, 2026-10-04, on litlfred/bootstrap-tools#7 item 4: 'track in bean'.

bootstrap-tools#7 publishes bootstrap's and bootstrap-tools' named subgraphs with each node's file as an absolute `source` IRI (`dcterms:source`, owner ruled 'ok' on absolute IRIs) and NO repository-relative `sourcePath` literal, which folio-assistant's own subgraph files carry. folio-assistant's process-index reader (`cat-harness/docs/assets/js/process-index.js`, bean ax6r) currently keys rows off what folio-assistant publishes.

## Done when
- [x] folio-assistant's reader reads bootstrap's remote subgraph files using `source` (not `sourcePath`), and `check:process-index` covers all declared diagrams (today 93 of 93; 0 not covered)
- [x] blocked until bootstrap-tools#7 merges — merged (ce5a2ce)

Claimed by claude/nifty-faraday-8ql41p — bootstrap-tools#7 merged (ce5a2ce); bumping the submodule and reading `source`.

## Evidence

Work landed on `main` in PR #1955 (merge commit `e49c086207bbb144efe37b32eedb249973a2953f`, head commits `893f16b91af4`, `1243880fc0d7`).
Verified against `main`:
1. `bun run check:process-index`: passes with "93 of 93 declared diagram(s) are documented Process nodes in the published subgraphs ... 0 not covered; page mount present."
