---
# folio-assistant-f76l
title: 'TODO INDEX: define folio-todo-index/v1 as published, and emit target{page,node,label}'
status: todo
type: task
priority: high
created_at: 2026-09-20T21:46:04Z
updated_at: 2026-09-20T21:46:04Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R3 + the Phase 4 §0 finding. Unit 2 of 10.

**`folio-todo-index/v1` has no schema.** The string appears twice in the whole
repository: a literal in `gen-docs-pages.ts` and four e2e fixtures. No Zod type, no
published JSON Schema, no module — a consumer reading `"$schema":
"folio-todo-index/v1"` and going looking finds nothing. And the version has not
moved while the shape has: `viewHref`/`editHref` and `theme`/`themeArt` were both
added this session, still `v1`, and nothing could have told anybody.

**R3**: each item emits `target: {page, node, label}`, not only the composite
`targetLabel`. The composite forces every consumer to know the `sec:` prefix, the
`-` separator, AND that node ids themselves contain `-` — so the split is not even
unambiguous. That is the consumer-burden rule broken in a published artefact.

**Correction carried from the data model**: the generator does NOT have both halves
lying around. `readTodoFiles` gives only `targetLabel`, so this needs a reverse
index `label -> (page, node)` built from the page walk the same script already does.
Cheap, but a derived join rather than two fields.

Owner's decision, taken by stated default: **option C** — define `v1` as what is
actually published, including `theme`/`themeArt`, then add `target` under it.

## Done when

- [ ] a Zod module describes the index as published today
- [ ] `target: {page, node, label}` emitted; `targetLabel` KEPT so nothing breaks
- [ ] asserted over the EMITTED JSON, not over the function that built it
- [ ] the key order stays fixed, including inside the nested object (bean `d2kp`)
