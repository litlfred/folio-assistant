---
# folio-assistant-319n
title: 'ZOD IS IN CAT-HARNESS: move bootstrap-tools'' graph.ts and discussion.ts into cat-harness/schemas, retire bootstrap-tools if empty'
status: completed
type: task
priority: normal
created_at: 2026-09-23T22:52:17Z
updated_at: 2026-09-24T05:45:45Z
parent: folio-assistant-88mg
---

Owner, 2026-09-23 (bean iwtn, ruling 4): *"cat-harness/tools like renderer. zod is in cat-harness"*. `model-registry.ts` already moved (PR #1200). The owner then chose to move the other two as well, in a follow-up PR after #1200 merges.

## The rule (owner, 2026-09-23)

> Zod - these are authoring tools for the KG, different tools can/will be used, but the core KG should be unchanged.

The Zod files are one **authoring tool**. The **Knowledge Graph** is what they generate into bootstrap: `schemas/*.schema.json`, plus the data they validate. Any tool may produce those, and changing the tool must not change them. So the move is judged by its output, not by its code.

- [x] Record this rule in the skill that governs bootstrap's schemas, so the next authoring tool (another language, a hand-written schema) knows the generated files are the contract
- [x] `bootstrap-tools/schemas/graph.ts` → `cat-harness/schemas/`; also update `vocabulary.ts` (CLASS_GLOSSES reads BOOTSTRAP_TERMS) and `gen-bootstrap-schemas.ts`
- [x] `bootstrap-tools/schemas/discussion.ts` → `cat-harness/schemas/`; also update `gen-bootstrap-schemas.ts` and the Tool declared in `tools/index.ts`
- [x] Move the tests with them (`graph.test.ts`, `discussion.test.ts`)
- [x] If nothing is left, retire `bootstrap-tools/`: its declaration, the package-manifest entry, the `bootstrap-tools:schemas` script name, and the partition rules

## Done when
The generated `bootstrap/schemas/*.schema.json` files are byte-identical before and after (checked by hashing them before and after), nothing under `bootstrap/` changes except where a path is named, and `bun run gates` passes.

## Summary of Changes

Owner, 2026-09-24: *"Validate/zod in cat-harness. Graph and Subgraph too"*.

- `graph.ts` (bootstrap's terms, and the Knowledge Graph and Subgraph declaration shape), `discussion.ts` and `bootstrap-graph.ts`, with their two tests, moved to `cat-harness/schemas/`. Imports are fixed, and the partition rules now classify all three as harness.
- **The Knowledge Graph is unchanged:** all four generated `bootstrap/schemas/*.schema.json` files were hashed before and after, and are byte-identical.
- The rule is recorded in the header of `gen-bootstrap-schemas.ts`: Zod is one authoring tool, and its output is the contract.
- `bootstrap-tools` is retired: its declaration, README, AGENTS.md, its entry in `cat-harness.json`, and its two orphaned generated pages. The scripts are renamed `bootstrap:schemas` and `bootstrap:schemas:check`, and the schemas wireframe is updated.
- Found along the way: `discussion.test.ts` now typechecks. It was written for Ajv 8, but the Ajv installed is 6, which comes with eslint and is not a direct dependency. It is now written for Ajv 6. **`ajv` is still only a transitive dependency**; adding it directly is a dependency decision left to the owner.
- Found along the way: bean `ghgn`. The viewer generators never remove a retired instance's page, and `detangle`'s is still published.
