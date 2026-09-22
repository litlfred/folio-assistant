---
# folio-assistant-sl9u
title: skos:prefLabel and dcterms:title carry the identical string on the glossary scheme node, with nothing saying which is authoritative
status: todo
type: task
created_at: 2026-09-22T11:48:29Z
updated_at: 2026-09-22T11:48:29Z
parent: folio-assistant-1swy
---

Measured 2026-09-22 on output shipped the same morning, in PR #841:

```
_kg/cat-harness-glossary.jsonld
   skos:prefLabel : 'cat-harness swimlane glossary'
   dcterms:title  : 'cat-harness swimlane glossary'
   SAME?          : True

_kg/bootstrap-glossary.jsonld   — same, both fields
```

Two predicates, one fact, and nothing declaring which is the source. They agree today and will diverge the first time somebody edits one.

## Why the node carries both at all, and why that part is legitimate

The glossary document is genuinely two things: a **file** (which has a `dcterms:title`) and a **`skos:ConceptScheme`** (which has a `skos:prefLabel`). This is the one node in the corpus where the DC/SKOS overlap is not a modelling error.

[`vocabulary-authority`](../../cat-harness/skills/folio-core/vocabulary-authority.md) states the rule that resolves it: **DC describes a RESOURCE, SKOS describes a CONCEPT, one object one naming predicate** — and where a node is both, the authoritative one is decided by what the node IS *primarily*. Here that is the concept scheme, so `skos:prefLabel` is the source and `dcterms:title` is a derived copy for resource-metadata consumers.

## What has NOT been decided, and is the reason this is a bean rather than a fix

Whether the derived copy should exist at all. Two defensible answers:

1. **Keep it, derive it.** A DC-only consumer reading the document as a resource finds a title. The copy is emitted from `prefLabel` in one place, so it cannot drift.
2. **Drop `dcterms:title` from the scheme node.** One predicate, no copy, no drift surface. Costs the DC-only consumer, who may not exist.

Not picking one from the implementation side: emitting is what created the ambiguity, and emitting differently would settle it by accident.

## Done when

- [ ] Decide: derived copy, or single predicate
- [ ] If derived — it is emitted FROM `prefLabel`, never assigned separately, and a test asserts they cannot diverge
- [ ] `glossary-export.test.ts` covers whichever is chosen, so the next edit cannot silently reintroduce two independent assignments
