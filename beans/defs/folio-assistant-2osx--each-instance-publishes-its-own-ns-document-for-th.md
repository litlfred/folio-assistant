---
# folio-assistant-2osx
title: Each instance publishes its own ns document for the block-kind classes it mints
status: todo
type: task
priority: normal
created_at: 2026-10-06T16:41:00Z
updated_at: 2026-10-06T17:23:55Z
parent: folio-assistant-7x5n
---

Follow-up to the vocabulary move (bean 0r7u, owner rulings 2026-10-06): block-kind classes are minted in the declaring instance's namespace (folio-assistant-core:Prose, folio-assistant-sci:Theorem, smart-base:Persona), but no instance publishes a document defining them, so the class IRIs do not dereference. The core ones never did (pre-existing gap); sci and smart-base are new namespaces with no ns document at all.

## Todo
- [ ] Each instance's ns document is generated from its own block-kind nodes (label = heading, definition = rationale or a new gloss field), not from cat-harness's vocabulary.ts.
- [ ] docs-site.yml's ns loop is driven by the instance declarations rather than the hard-coded harness/core pair, so sci and smart-base publish.
- [ ] The ns-vocabulary Tool's maintains list (cat-harness/tools/index.ts) stops naming folio-assistant-core/ns.jsonld: each instance's Tool node declares its own.
- [ ] ns:check (or a sibling) fails on a folioType whose owner publishes no definition.

## Done when
Dereferencing any block-kind class IRI returns a document defining it, published by the instance that owns the kind.
