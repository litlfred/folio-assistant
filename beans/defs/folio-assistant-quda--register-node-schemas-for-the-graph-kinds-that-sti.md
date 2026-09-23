---
# folio-assistant-quda
title: Register node schemas for the graph kinds that still declare none
status: todo
type: task
created_at: 2026-09-23T06:25:14Z
updated_at: 2026-09-23T06:25:14Z
parent: folio-assistant-zzmr
---

Found by the UML overview (bean bvhf): these kinds register neither validator nor schema, so every sub-graph of theirs is drawn 'could not determine': cat-harness, skills, methodology, docs, schemas, uml, code, glossary, models, beans, bean-defs, todos, uploads, library, catalogue, fhir-artifact-index, themes, todo-feedback, session-state, interaction, issue-marks, fsh-guts, external-schema (Zod exists in folio-assistant-core but the path is instance-relative). Register one where a Zod schema exists; say why not where none does.
