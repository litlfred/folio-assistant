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

## The rule (owner, 2026-09-23)

> Zod - these are authoring tools for the KG, different tools can/will be used, but the core KG should be unchanged.

The Zod files are one **authoring tool**. The **Knowledge Graph** is what they generate into bootstrap: `schemas/*.schema.json`, plus the data they validate. Any tool may produce those, and changing the tool must not change them. So the move is judged by its output, not by its code.

- [ ] Record this rule in the skill that governs bootstrap's schemas, so the next authoring tool (another language, a hand-written schema) knows the generated files are the contract
- [ ] `bootstrap-tools/schemas/graph.ts` → `cat-harness/schemas/`; also update `vocabulary.ts` (CLASS_GLOSSES reads BOOTSTRAP_TERMS) and `gen-bootstrap-schemas.ts`
- [ ] `bootstrap-tools/schemas/discussion.ts` → `cat-harness/schemas/`; also update `gen-bootstrap-schemas.ts` and the Tool declared in `tools/index.ts`
- [ ] Move the tests with them (`graph.test.ts`, `discussion.test.ts`)
- [ ] If nothing is left, retire `bootstrap-tools/`: its declaration, the package-manifest entry, the `bootstrap-tools:schemas` script name, and the partition rules

## Done when
The generated `bootstrap/schemas/*.schema.json` files are byte-identical before and after (checked by hashing them before and after), nothing under `bootstrap/` changes except where a path is named, and `bun run gates` passes.
