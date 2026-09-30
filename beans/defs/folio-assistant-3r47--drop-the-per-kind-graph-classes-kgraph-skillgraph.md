---
# folio-assistant-3r47
title: 'Drop the per-kind graph classes (KGraph, SkillGraph, VoiceGraph, …): a directory is a Subgraph holding GraphKind individuals'
status: todo
type: task
created_at: 2026-09-30T10:04:38Z
updated_at: 2026-09-30T10:04:38Z
parent: folio-assistant-xsqm
---

## The ruling, owner 2026-09-30

Asked *"KGraph needs better name? CatHarness? … what is bootstrap's? consistent? why not just CatHarness? why need graph?"*, then chose **"Drop per-kind classes"** over renaming.

## Why (measured 2026-09-30)

- bootstrap has no class per kind: a kind is a word (`skills`, `processes`) and one `bootstrap:GraphKind` individual, `bootstrap:graphKind/<kind>`; a declared directory is a `bootstrap:Subgraph` whose `graphKinds` list names the kinds.
- cat-harness ADDS a class per kind (43 `type: termIri("…Graph")` entries in `schemas/graph-kind-registry.ts`) and stamps it on each directory as `@type` (`cat-harness.ts` declaration projection, ~line 5102), while `kg-export` also emits `holdsGraph` → the individual. Two ways to say one fact.
- `KGraph` (the class of the `cat-harness` kind) now reads as a second name for bootstrap's Knowledge Graph and means something narrower.

## Done when

- [ ] A directory node is typed `bootstrap:Subgraph` and says what it holds only through `holdsGraph` → `<definer ns>graphKind/<kind>`.
- [ ] The registry identifies a kind by its individual IRI, not a class; the `kg`/`cat-harness` alias still resolves to one kind.
- [ ] No `*Graph` class is minted for a kind (RoleGraph/PreviewGraph/FshGutsGraph etc. that type a DOCUMENT, not a directory, are reviewed separately and kept only if they are not a kind).
- [ ] `ns-export`, the declaration projection, the UML/overview generators and their tests read the individual.
- [ ] Docs prose that says "KGraph" for the concept (`content/docs/kgraph/`, `harness/`) is reviewed against bootstrap's term Knowledge Graph.

## Not now

Owner: keep the primary focus on the bootstrap / bootstrap-tools separation. Needed for that only: bootstrap's `bs:` vocabulary is its own terms, and the harness's classes are minted in the harness's namespace (done in #1538); the classes themselves go here.
