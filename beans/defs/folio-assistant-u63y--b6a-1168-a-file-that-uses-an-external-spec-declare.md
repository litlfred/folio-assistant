---
# folio-assistant-u63y
title: 'B6a (#1168): a file that uses an external spec declares it; ExternalSchema.usedBy removed'
status: completed
type: task
priority: normal
created_at: 2026-09-24T18:07:58Z
updated_at: 2026-09-24T18:42:44Z
parent: folio-assistant-tr05
---

## Owner decision 2026-09-24
"B: users declare it" — each dependent declares the spec, not the spec its users (36 hand-written usedBy entries over 16 records).

## Plan
- TS: `@conformsTo <spec-id>` in the module doc comment.
- Skill .md: `conformsTo:` front matter.
- BPMN: the `xmlns` binding already declares the namespace in-file.
- JSON-LD: a namespace IRI in `@context` declares it; plain JSON checked case by case.
- The external-schemas viewer derives the blast radius from the declarations; `usedBy` removed from the records and the schema.

## Done when
No `usedBy` in external-schemas/; each spec's users are listed on the viewer from declarations; a declaration naming an unknown spec id is a finding.
