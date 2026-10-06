---
# folio-assistant-1g4s
title: 'OPTION A: subgraphs inherit automatically as named members; dependents retired'
status: completed
type: task
priority: normal
created_at: 2026-09-30T22:39:25Z
updated_at: 2026-10-01T06:58:18Z
parent: folio-assistant-iirv
---

Owner 2026-09-30: 'if f-a-core ... has a docs/ ... and depends on cat-harness where docs/ is declared ... the viewer should detect f-a-core/docs ... a named (sub-)subgraph of docs' and 'make dependents: reproduce automatic behaviour so don't need it'.

## Summary of Changes
- resolveDirectories: every instance-scoped entry gains one MEMBER per chain instance whose <root>/<path> exists (ResolvedDirectory.member); declarer's member first.
- ContentDirectory.dependents removed (legacy key parses and is dropped); DependentMaterialisationSchema retired.
- Creation of an inherited directory is read from the graph KIND: GraphKindDef.perInstance (uploads, library, docs, qa, beans, todos, voices, folio, glossary, translation-sources, external-schema).
- Nested instance-subgraph entries marked "subgraph": true (skills.json voices etc.).
- directory-conventions + schema-management skills, subgraph-viewers + board-requirements docs updated.

## Follow-up
~50 per-instance entries are now redundant with an inherited declaration (same path+kinds): core-*, qa x12, library x5, etc. They carry per-member descriptions, so removing them is folded into the sub-subgraph split (task: split big subgraphs), not done here.
