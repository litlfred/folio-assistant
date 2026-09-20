---
# folio-assistant-1oqu
title: 'TOOL 11/13: evidence-retrieval Task_L1Sources — bibliography, evidence & glossary (11 files, 3 entry points)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:35:26Z
updated_at: 2026-09-20T04:35:26Z
parent: folio-assistant-d308
---

Group 11 of 13 in `d308`. **11 files, 3 entry points.**

`citations`, `export-bibtex`, `migrate-bib-verifier`, `gen-bib-papers-list`,
`upload-bib-papers`, `find-arxiv-mirrors`, `simplify-links`, `source-ledger-index`,
`source-ledger-merge`, `build-glossary`, `glossary-candidates`,
`apply-glossary-curation`.

**BPMN:** `evidence-retrieval · Task_L1Sources` (refs `document-intake`),
`Task_VerifyAuthority`, `Task_RecordUnverified`, `Task_RecordGap`.

**Target repo (#223):** `folio-assist-core`.

**The constraint that makes this group delicate:** `Task_VerifyAuthority` checks a
citation against an external registry, and `Task_RecordUnverified` exists because
that check can FAIL. A Tool here must be able to return "could not determine"
distinctly from "verified" — the third-state rule. A node that collapsed them
would launder an unverified citation into an authoritative one, which is the same
failure shape as `confirmed_by` on a narrative.

## Done when
- [ ] a Tool node over the evidence path
- [ ] `satisfies` includes `document-intake`
- [ ] its outputs can express could-not-determine distinctly from verified
- [ ] `tool-coverage` reflects it
