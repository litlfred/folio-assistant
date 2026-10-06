---
# folio-assistant-3r47
title: 'Drop the per-kind graph classes (KGraph, SkillGraph, VoiceGraph, …): a directory is a Subgraph holding GraphKind individuals'
status: completed
type: task
priority: normal
created_at: 2026-09-30T10:04:38Z
updated_at: 2026-09-30T20:04:55Z
parent: folio-assistant-xsqm
---

## The ruling, owner 2026-09-30

Asked *"KGraph needs better name? CatHarness? … what is bootstrap's? consistent? why not just CatHarness? why need graph?"*, then chose **"Drop per-kind classes"** over renaming.

## Why (measured 2026-09-30)

- bootstrap has no class per kind: a kind is a word (`skills`, `processes`) and one `bootstrap:GraphKind` individual, `bootstrap:graphKind/<kind>`; a declared directory is a `bootstrap:Subgraph` whose `graphKinds` list names the kinds.
- cat-harness ADDS a class per kind (43 `type: termIri("…Graph")` entries in `schemas/graph-kind-registry.ts`) and stamps it on each directory as `@type` (`cat-harness.ts` declaration projection, ~line 5102), while `kg-export` also emits `holdsGraph` → the individual. Two ways to say one fact.
- `KGraph` (the class of the `cat-harness` kind) now reads as a second name for bootstrap's Knowledge Graph and means something narrower.

## Done when

- [x] A directory node is typed `bootstrap:Subgraph` and says what it holds only through `holdsGraph` → `<definer ns>graphKind/<kind>`.
- [x] The registry identifies a kind by its individual IRI, not a class; the `kg`/`cat-harness` alias still resolves to one kind.
- [x] No `*Graph` class is minted for a kind (RoleGraph/PreviewGraph/FshGutsGraph etc. that type a DOCUMENT, not a directory, are reviewed separately and kept only if they are not a kind).
- [x] `ns-export`, the declaration projection, the UML/overview generators and their tests read the individual.
- [x] Docs prose that says "KGraph" for the concept (`content/docs/kgraph/`, `harness/`) is reviewed against bootstrap's term Knowledge Graph.

## Not now

Owner: keep the primary focus on the bootstrap / bootstrap-tools separation. Needed for that only: bootstrap's `bs:` vocabulary is its own terms, and the harness's classes are minted in the harness's namespace (done in #1538); the classes themselves go here.

_2026-09-30T19:12:25Z_ — Claimed by next/3r47 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Progress, 2026-09-30

- `GraphKindDef.type` (the class IRI) is gone; a kind states `layer?: "core"`
  and is named by `graphKindIri(name)` = `<layer ns>graphKind/<name>`. The
  layer snapshot before the change (10 core, 5 bootstrap, 33 harness) is what
  the explicit `layer` reproduces.
- The declaration's JSON-LD projection types a directory `Subgraph` with
  `holdsGraph` → the individuals (the same `dcterms:type` IRI kg-export
  writes); the read-back reads `holdsGraph` (`registry.forIri`).
- ns-export publishes each harness/core kind as a `bootstrap:GraphKind`
  individual in its layer's document, so every `…graphKind/<name>` kg-export
  mints dereferences; `GRAPH_KIND_TYPE_LAYERS` is gone; kg-export's
  `typeIri` (the class) is dropped.
- Document classes kept: `RoleGraph`, `PreviewGraph`, and `FshGutsGraph`
  (now defined on its own — it was defined only through the fsh-guts kind's
  class). `GlossaryGraph` and `UnknownGraph` keep their published definitions
  but are no longer minted.

## Owner ruling, 2026-09-30 — the KGraph chapter

The `KGraph` docs chapter (`content/docs/kgraph/`, published at `/kgraph.html`,
linked from 5 translated index pages) defines KGraph as "everything this
harness knows about itself is one graph" — bootstrap's term Knowledge Graph
under a coined name. Owner chose **rename, keep a redirect**: the chapter
becomes "Knowledge Graph" at `/concepts/knowledge-graph.html`, and the translated link
texts are drafted and left unverified. Then, 2026-09-30: "dont maintain [the
redirect] ... excise" — `/kgraph.html` is removed, not redirected.

## Summary of Changes

- #1678: the 48 per-kind classes are gone; a kind is its `GraphKind`
  individual (`graphKindIri`), with an explicit `layer`; directories are
  `Subgraph` + `holdsGraph`; ns-export publishes the individuals.
- This change: the "KGraph" docs chapter is "The Knowledge Graph" at
  `/concepts/knowledge-graph.html` (bootstrap's term), with no redirect (owner:
  "excise"); links in the harness chapter and the 5 translated landing
  pages updated (translations drafted, left unverified); stale code comments
  corrected, owner quotes left verbatim.
