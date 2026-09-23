---
# folio-assistant-19cc
title: UML generators as Tool nodes, with a uml-overview skill
status: in-progress
type: task
created_at: 2026-09-23T09:57:43Z
updated_at: 2026-09-23T09:57:43Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: 'make sure tools/skills are updated'. gen-uml-overview.ts and gen-object-model-uml.ts shipped in #991 as scripts only: no Tool node exercises them and no skill says when to run them or how to read the output.

## Todo
- [x] skill uml-overview in skills/folio-core, in the package manifest
- [x] Tool nodes uml-overview and uml-object-model satisfying it
- [ ] gates green, PR
