---
# folio-assistant-3f5f
title: 'KG CONTEXT: inSubgraph and partOf both map to dcterms:isPartOf — subgraph membership and structural containment collapse into one property'
status: completed
type: task
priority: normal
created_at: 2026-10-03T09:46:16Z
updated_at: 2026-10-03T11:01:51Z
parent: folio-assistant-whlc
---

Found by the c1m4 generator (gen-subgraph-jsonld.ts, 2026-10-03). In kg-export's context both `inSubgraph` (a node belongs to a named subgraph — a VIEW) and `partOf` (structural containment, e.g. an activity part of a process) map to `dcterms:isPartOf`. JSON-LD compaction therefore merges them into one property in the subgraph files, and a consumer cannot tell 'this skill is in subgraph skills/sdlc' from 'this activity is part of process X'. Two facts, one term — the data-modelling §3 defect. Pre-existing; not introduced by c1m4.

## Done when
- [x] inSubgraph gets its own IRI — the harness namespace term (`…/ns#inSubgraph`): `replacedBy: dcterms:isPartOf` removed in `schemas/vocabulary.ts`. No standard predicate means view-membership of a node (VoID's `inDataset` is for documents), and the counterparts `hasMember`/`hasSubgraph` were already own terms
- [x] kg-export and gen-subgraph-jsonld emit it distinctly; `gen-subgraph-jsonld.test.ts` asserts the two IRIs differ and that processes nodes keep both after compaction (1593 do)
- [x] consumers that read isPartOf for membership are found and updated — none: every consumer reads the compact `inSubgraph` key (kg-viewer, the e2e), and no script expands to `dcterms:isPartOf` for membership

## Summary of Changes
`inSubgraph` is now its own term, so subgraph membership and structural `partOf` are two predicates in every published graph. One-line vocabulary change plus a regression test; regenerated the vocabulary-derived artefacts.
