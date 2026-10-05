---
# folio-assistant-l0lq
title: 'IG AST formats: Zod + JSON Schema + JSON-LD export for downstream use'
status: completed
type: task
priority: normal
created_at: 2026-10-01T19:48:24Z
updated_at: 2026-10-02T08:10:12Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01: *"is ast export XML? any utility for downstream use to have it export json(ld)+schema?"*, then "1 y" to building it here.

**State.** The AST is JSON: `ig-ast/v1` (manifest plus one entry per resource), `ig-ast-dependencies/v1` (edges) and `ig-ast-plan/v1`. They exist only as TypeScript interfaces in `fhir-harness/scripts/ig-ast.ts`. The Java exporter (`litlfred/fhir-ig-publisher@claude/ast-export`) writes to match by convention, so nothing checks that the two agree, and a downstream consumer has no schema to validate against.

## Done when
- [x] Zod schemas for the three families, the single declaration `ig-ast.ts` reads through (`readAst` validates rather than spot-checks)
- [x] JSON Schemas generated from them, committed in a declared directory and gated as current
- [x] a JSON-LD context, and an `ig-ast.ts jsonld <ast>` export that identifies each resource by its canonical URL and turns edges into links
- [x] tests over a fixture AST; the schemas named so the Java side can validate its output against them

## Done (2026-10-01)

- `fhir-harness/schemas/ig-ast.ts`: Zod, all objects open (`.passthrough()`) to fields the Java writer adds first; `authority` is the literal `"cache"`. `readAst` validates through it.
- Generated and committed beside it: `ig-ast.schema.json`, `ig-ast-dependencies.schema.json`, `ig-ast-plan.schema.json` (draft-07, so ajv 6 here and the Java validators read them), and `ig-ast.context.jsonld`. `bun run ig-ast:schema`, gated by `ig-ast:schema:check` in code-quality-gates.
- `ig-ast.ts jsonld <ast>`, declared as Tool `ig-ast-jsonld`: resources as nodes with `@id` = canonical (else `urn:fhir:Type/id`), edges as `@id` links.
- Tests: generated AST files validate under ajv; a non-cache authority is refused by both Zod and the schema; JSON-LD ids and edges; committed files current.

Not done: validating a real Publisher-written AST against the schemas. That needs an ast-export run, which is bean wnhh's dispatched session (fhir-ast seeding).

## 2026-10-02: real Publisher-written ASTs validate

The two ASTs agy seeded with `ig-cache.sh` both validate against the generated draft-07 schemas under ajv:
- `fhir-ast/smart.who.int.trust` on litlfred/smart-trust: 678 resources.
- `fhir-ast/smart.who.int.base` on litlfred/smart-base: 162 resources, 172 edges.

Checked per AST:
- `manifest.json` against `ig-ast.schema.json`;
- `dependencies.json` against `ig-ast-dependencies.schema.json`.

`ig-ast.ts list` (Zod, through `readAst`) reads both. This closes the "Not done" line above.
