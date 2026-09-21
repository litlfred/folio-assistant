---
# folio-assistant-f76l
title: 'TODO INDEX: define folio-todo-index/v1 as published, and emit target{page,node,label}'
status: completed
type: task
priority: high
created_at: 2026-09-20T21:46:04Z
updated_at: 2026-09-21T05:31:45Z
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


## Summary of Changes

**`schemas/todo-index.ts`** — the module the `$schema` tag had been naming since
it was written, describing the document **as published today**: `$schema`,
`repoWeb`, `items[]`, `processes`, `themeArt`, and every item field including
the three that had landed unannounced (`viewHref`/`editHref`, `theme`,
`repoWeb`). Option C, so the version does not move: there is exactly one reader
of this artefact and it is ours, so the usual cost of defining a version late —
stranded consumers — is not being paid.

**`target: {page, node, label}`** emitted beside `targetLabel`, which STAYS, so
every existing matcher keeps working and nobody migrates.

**The reverse index**, built from the page walk `gen-docs-pages.ts` already
performs. The data-model phase's correction was right: `readTodoFiles` hands the
emitter `targetLabel` and nothing else, so this is a JOIN rather than two fields
lying around. A **duplicate label now throws**, naming both blocks — the label
is page-qualified precisely so it is unique, and a map that kept the last writer
would attach every note with that label to whichever page was walked second.

**The measurement that makes this more than tidiness**, and it is now a test:
`sec:beans-and-todos-human-todos` resolves to page `beans-and-todos`, node
`human-todos`. A consumer splitting on `-` gets `beans`, and there is no rule it
could follow to do better without the page list.

## Done when

- [x] a Zod module describes the index as published today
- [x] `target: {page, node, label}` emitted; `targetLabel` KEPT so nothing breaks
- [x] asserted over the EMITTED JSON, not over the function that built it
- [x] the key order stays fixed, including inside the nested object (bean `d2kp`)

11 tests. `bun run gates` — 77 of 77.
