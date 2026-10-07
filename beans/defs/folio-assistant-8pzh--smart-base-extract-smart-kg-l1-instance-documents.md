---
# folio-assistant-8pzh
title: 'smart-base: extract smart-kg L1 instance documents (publication, section, recommendation) from ingested guideline PDFs'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T06:16:07Z
updated_at: 2026-10-06T08:27:17Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-02 (#1767), option 2 of the smart-kg fold-in: feed smart-kg. smart-kg's README says 'Not built yet: no PDF extractor, so publication and recommendation nodes must currently be authored by hand.' folio-assistant's ingest pipeline already produces sections, outline and page text for each library entry. Build a smart-base tool that turns one ingested guideline (e.g. who-iris/library/9789241548960-eng, or a smart-base L1 publication) into a smart-kg L1 graph document, validated with smart-kg's tools/validate.mjs at the pinned commit (bean pebe).

Rules carried from smart-kg docs/SCOPE.md and STORAGE.md: no instance data is committed to smart-kg; a recommendation's verbatim text, GRADE strength and certainty are READ from the source, never inferred; a citation stays unresolved unless a person resolves it.

## Done when
- [ ] where the A-Box documents live is decided with the owner (published with the source, per smart-kg STORAGE.md, versus a committed sidecar here)
- [x] the extractor on one real guideline, with T2 validation green and coverage reported
- [ ] T3 fidelity left to a person, never auto-passed

Owner 2026-10-02: 'keep going' after the storage question went unanswered, so the stated default applies: output beside each library entry in smart-base. Branch claude/awesome-fermi-ua31th-8pzh, stacked on #1830 (the pin).

## Status check 2026-10-06 (evidence, re-derived on a fresh checkout)

- Item 2 ticked, measured: `extract-smart-kg-l1.ts --entry smart-base/library/9789240093362-eng --validate <smart-kg @ 66a9b13>` → smart-kg `tools/validate.mjs`: *[l1]: 3 nodes, 2 edges … conforms to the ontology*. `smart-base:smart-kg-l1:check` green. Coverage: 1 labelled recommendation in 48 sections; GRADE strength 0, certainty 0; 2 unlabelled "WHO recommends" mentions counted and not emitted. The output is small because the source is a handbook with one printed recommendation label, not because the extractor dropped anything.
- Item 1 still open: the location was taken by the stated default after the question went unanswered, not decided by the owner.
- Item 3 still open: nothing records that T3 fidelity is pending a person. The output carries no T3 field, and the extractor has no T3 mention.
- 1 of 12 `smart-base/library/` entries extracted (12 directories with a `manifest.jsonld`; an earlier report said 14, which was wrong).
