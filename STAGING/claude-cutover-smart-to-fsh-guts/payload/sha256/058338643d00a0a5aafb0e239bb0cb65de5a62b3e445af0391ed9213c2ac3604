---
# folio-assistant-j00t
title: Retire the unused contributes config field and its module loader path
status: todo
type: task
priority: normal
created_at: 2026-10-05T11:38:54Z
updated_at: 2026-10-05T11:39:01Z
parent: folio-assistant-zzmr
---

Left behind by riit. Every contribution is now a node: block kinds, content adapters, QA checkers, pipeline plugins and Tool nodes. No instance declares a `contributes` module; measured 2026-10-05, no `<instance>.json` carries the field.

The loader still reads it:
- `harness-config.ts` has `contributes: z.string().optional()` at :364 and imports the module at :1862.
- `harness.config.example.json` documents the field.

## Done when
- [ ] The field, its loader branch and the example entry are gone, or the owner rules to keep it as an extension point.
- [ ] RendererContribution is decided. No renderer is contributed today: either renderers get a node graph like checkers have, or the shape goes along with the field.
