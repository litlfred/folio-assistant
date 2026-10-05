---
# folio-assistant-gzkt
title: 'VOCAB DRIFT D4: library licence is an opaque @json literal, glossary licence is dcterms:license — one mapping row for both'
status: completed
type: task
priority: normal
created_at: 2026-10-03T08:07:15Z
updated_at: 2026-10-03T09:01:01Z
parent: folio-assistant-zzmr
---

Issue #1910 D4. Owner ruling 2026-10-03 (this session, selected option 'Yes, move it'): a library item's licence moves out of the opaque `@json` meta into `dcterms:license`, driven by the same vocab-mappings row the glossary uses. Unblocked: #1899 merged 2026-10-02T23:35Z.

## Done when
- [x] a library item's JSON-LD carries dcterms:license (IRI or literal as the glossary does), read from the vocab-mappings table
- [x] the @json meta no longer carries the licence
- [x] regenerated outputs committed; gates green
- [x] round summary on #1910 (comment 5967454581)

## Summary of Changes

- New table `cat-harness/vocab-mappings/licence-naming.json`: `license` → `dcterms:license` (transform `code`), and `licenceRecord` → `folio-assistant-core:licenceRecord`. Both emitters apply it.
- `gen-library-jsonld.ts` `licenceProperties`: a library manifest (paged, tabular and referenced rungs) carries `license` only for a `stated` record with an `id`, plus the authored record verbatim as top-level `licenceRecord` (`@json`). `unknown` names no licence. Absent writes nothing. `meta.licence` is gone. `l1-blocks.ts` does the same when it rewrites a staged manifest.
- `folio-assistant-core/schemas/glossary.ts` `licenceTerms`: the glossary's `dcterms:license` now comes from the same row.
- `CONTENT_CONTEXT` binds `license` and `licenceRecord`. A test checks both bindings against the table. `ns/content/v1.jsonld` is regenerated.
- `check-source-licence.ts` and `l1-blocks.ts` read the record through `manifestLicence` (`schemas/source-licence.ts`).
- Regenerated: 21 library manifests, the source-licence and library-qa sidecars, and the `skill:register` artefacts.
- Proposal doc: the D4 row is marked ruled and done.
