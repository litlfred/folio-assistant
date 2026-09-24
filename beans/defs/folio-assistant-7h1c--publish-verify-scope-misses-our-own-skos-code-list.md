---
# folio-assistant-7h1c
title: publish-verify scope misses our own SKOS code-lists document
status: todo
type: bug
priority: normal
created_at: 2026-09-24T05:40:40Z
updated_at: 2026-09-24T05:40:40Z
parent: folio-assistant-1xhc
---

Found 2026-09-24 while working `wg7r`. `publish-verify`'s `isOurs` counts a JSON-LD document as ours only when its `@context` names our content context or binds one of our namespaces. `<stub>-code-lists.jsonld` (glossary-export) binds only `skos`, `dcterms`, `owl` and `rdf`, so the verifier counts it **out of scope (not ours)**, even though its `@id` sits under our published base and we author every code in it. The same holds for any SKOS-only document we publish.

It expands clean today: checked by hand with `expandFindings`, 0 warnings, 12 schemes and 28 GRADE concepts. So nothing is broken; the gap is that nothing would notice if it broke.

## Done when
- [ ] A document whose `@id` is under our canonical base (`FOLIO_BASE` / the declaration's `canonicalUrl`) is in scope, whatever its `@context` binds.
- [ ] A test pins the code-lists document as checked, not as out of scope.
