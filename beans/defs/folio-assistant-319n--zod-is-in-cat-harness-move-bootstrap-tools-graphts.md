---
# folio-assistant-319n
title: 'ZOD IS IN CAT-HARNESS: move bootstrap-tools'' graph.ts and discussion.ts into cat-harness/schemas, retire bootstrap-tools if empty'
status: todo
type: task
created_at: 2026-09-23T22:52:17Z
updated_at: 2026-09-23T22:52:17Z
parent: folio-assistant-88mg
---

Owner, 2026-09-23 (bean iwtn, ruling 4): *"cat-harness/tools like renderer. zod is in cat-harness"*. `model-registry.ts` already moved (PR #1200). The owner then chose to move the other two as well, in a follow-up PR after #1200 merges.

- [ ] `bootstrap-tools/schemas/graph.ts` → `cat-harness/schemas/`; also update `vocabulary.ts` (CLASS_GLOSSES reads BOOTSTRAP_TERMS) and `gen-bootstrap-schemas.ts`
- [ ] `bootstrap-tools/schemas/discussion.ts` → `cat-harness/schemas/`; also update `gen-bootstrap-schemas.ts` and the Tool declared in `tools/index.ts`
- [ ] Move the tests with them (`graph.test.ts`, `discussion.test.ts`)
- [ ] If nothing is left, retire `bootstrap-tools/`: its declaration, the package-manifest entry, the `bootstrap-tools:schemas` script name, and the partition rules

## Done when
The generated `bootstrap/schemas/*.schema.json` files are byte-identical before and after, and `bun run gates` passes.
