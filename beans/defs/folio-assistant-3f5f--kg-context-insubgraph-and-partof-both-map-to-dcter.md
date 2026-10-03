---
# folio-assistant-3f5f
title: 'KG CONTEXT: inSubgraph and partOf both map to dcterms:isPartOf — subgraph membership and structural containment collapse into one property'
status: todo
type: task
created_at: 2026-10-03T09:46:16Z
updated_at: 2026-10-03T09:46:16Z
parent: folio-assistant-whlc
---

Found by the c1m4 generator (gen-subgraph-jsonld.ts, 2026-10-03). In kg-export's context both `inSubgraph` (a node belongs to a named subgraph — a VIEW) and `partOf` (structural containment, e.g. an activity part of a process) map to `dcterms:isPartOf`. JSON-LD compaction therefore merges them into one property in the subgraph files, and a consumer cannot tell 'this skill is in subgraph skills/sdlc' from 'this activity is part of process X'. Two facts, one term — the data-modelling §3 defect. Pre-existing; not introduced by c1m4.

## Done when
- [ ] inSubgraph gets its own IRI (own namespace term, or a standard one that means view-membership — decide and record why)
- [ ] kg-export and gen-subgraph-jsonld emit it distinctly; a test asserts compaction keeps two properties
- [ ] consumers that read isPartOf for membership are found and updated
