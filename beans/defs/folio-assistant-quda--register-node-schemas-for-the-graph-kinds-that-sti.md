---
# folio-assistant-quda
title: Register node schemas for the graph kinds that still declare none
status: completed
type: task
priority: normal
created_at: 2026-09-23T06:25:14Z
updated_at: 2026-09-23T06:48:50Z
parent: folio-assistant-zzmr
---

Found by the UML overview (bean bvhf): these kinds register neither validator nor schema, so every sub-graph of theirs is drawn 'could not determine': cat-harness, skills, methodology, docs, schemas, uml, code, glossary, models, beans, bean-defs, todos, uploads, library, catalogue, fhir-artifact-index, themes, todo-feedback, session-state, interaction, issue-marks, fsh-guts, external-schema (Zod exists in folio-assistant-core but the path is instance-relative). Register one where a Zod schema exists; say why not where none does.

## Summary of Changes

- Node schemas registered for docs, external-schema, glossary, models, uploads, library, catalogue, fhir-artifact-index, schemas, skills, beans, workflow-state, todos, todo-feedback, fsh-guts, themes (validator or per-`$schema` family), and uml (schema: its generator). `qa` gained its eighth family, `folio-detangle-sidecar/v1`, which the completeness check found.
- `NodeSchemaRef` gains `{ external }` — e.g. the 488 DAK files under fhir-artifact-index ARE JSON Schema 2020-12 documents.
- References may name their harness: `folio-assistant-core:schemas/catalogue.ts#CatalogueSchema`, resolved via the declared instance name (`rootOf`); `../` stays refused.
- `stripAnnotations`: top-level `_` keys dropped before parsing, as every loader already does.
- `check:kind-validators` sweeps every instance, not only this one. First full run: every node of all 21 runnable families parses (1,156 nodes).
- UML overview: 10 of 86 sub-graph rows remain "could not determine" — `code`, `methodology`, `folio` — with the reasons in directory-conventions §"Node schemas, one per `$schema` family". bean-defs and the `cat-harness` umbrella are recorded there too.
