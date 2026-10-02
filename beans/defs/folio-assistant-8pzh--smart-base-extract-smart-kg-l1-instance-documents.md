---
# folio-assistant-8pzh
title: 'smart-base: extract smart-kg L1 instance documents (publication, section, recommendation) from ingested guideline PDFs'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T06:16:07Z
updated_at: 2026-10-02T12:02:31Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-02 (#1767), option 2 of the smart-kg fold-in: feed smart-kg. smart-kg's README says 'Not built yet: no PDF extractor, so publication and recommendation nodes must currently be authored by hand.' folio-assistant's ingest pipeline already produces sections, outline and page text for each library entry. Build a smart-base tool that turns one ingested guideline (e.g. who-iris/library/9789241548960-eng, or a smart-base L1 publication) into a smart-kg L1 graph document, validated with smart-kg's tools/validate.mjs at the pinned commit (bean pebe).

Rules carried from smart-kg docs/SCOPE.md and STORAGE.md: no instance data is committed to smart-kg; a recommendation's verbatim text, GRADE strength and certainty are READ from the source, never inferred; a citation stays unresolved unless a person resolves it.

## Done when
- [ ] where the A-Box documents live is decided with the owner (published with the source, per smart-kg STORAGE.md, versus a committed sidecar here)
- [ ] the extractor on one real guideline, with T2 validation green and coverage reported
- [ ] T3 fidelity left to a person, never auto-passed

Owner 2026-10-02: 'keep going' after the storage question went unanswered, so the stated default applies: output beside each library entry in smart-base. Branch claude/awesome-fermi-ua31th-8pzh, stacked on #1830 (the pin).
