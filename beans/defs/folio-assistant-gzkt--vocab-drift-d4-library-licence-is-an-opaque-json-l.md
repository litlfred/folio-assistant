---
# folio-assistant-gzkt
title: 'VOCAB DRIFT D4: library licence is an opaque @json literal, glossary licence is dcterms:license — one mapping row for both'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T08:07:15Z
updated_at: 2026-10-03T08:11:59Z
parent: folio-assistant-zzmr
---

Issue #1910 D4. Owner ruling 2026-10-03 (this session, selected option 'Yes, move it'): a library item's licence moves out of the opaque `@json` meta into `dcterms:license`, driven by the same vocab-mappings row the glossary uses. Unblocked: #1899 merged 2026-10-02T23:35Z.

## Done when
- [ ] a library item's JSON-LD carries dcterms:license (IRI or literal as the glossary does), read from the vocab-mappings table
- [ ] the @json meta no longer carries the licence
- [ ] regenerated outputs committed; gates green
- [ ] round summary on #1910
