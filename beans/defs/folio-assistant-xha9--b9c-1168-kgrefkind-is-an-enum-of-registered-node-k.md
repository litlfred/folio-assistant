---
# folio-assistant-xha9
title: 'B9c (#1168): KgRef.kind is an enum of registered node kinds'
status: todo
type: task
created_at: 2026-09-30T10:54:25Z
updated_at: 2026-09-30T10:54:25Z
parent: folio-assistant-tr05
---

Owner, 2026-09-30: Enum. KgRef.kind is a free string (todo.ts, carried-note.ts), so 'skil' parses. Build the enum from the graph-kind registry.

## Done when
- [ ] KgRefSchema.kind is an enum; every committed KgRef parses
