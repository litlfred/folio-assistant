---
# folio-assistant-rdkm
title: A graph kind names one node schema per $schema family (qa holds seven)
status: completed
type: feature
priority: normal
created_at: 2026-09-23T06:25:14Z
updated_at: 2026-09-23T06:39:05Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: 'QA audits?'. The qa graph (test/results/) holds seven $schema families: kg-qa/v1 426, qa-witness/v1 137, block-qa/v1 122, qa-results/v1 20, folio-qa-index/v1 13, translation-qa/v1 9, folio-test-run/v1 1. GraphKindDef.validator takes ONE module#Export, so the UML overview can only draw qa as a bare box naming content/pipeline/qa-witness.ts (TS interfaces, no Zod). Let a kind map each $schema tag to its validator (kg-qa/v1 -> KgQaReportSchema, folio-test-run/v1 -> TestRunSchema, ...), and draw one class per family. Same shape fixes memory (memory + waiver).

## Summary of Changes

- `GraphKindDef.nodeSchemas`: `$schema` tag → `{ validator }` (Zod) | `{ shape }` (TS type, read from source) | `{ writtenBy }` (no declared type — recorded, not invented).
- `qa` declares all seven families found under `test/results/`; its summary, which named one, is corrected.
- `resolveNodeSchemas` / `readShape` in `schemas/kind-validator.ts`; `loadValidator` shared with `resolveKindValidator`.
- `check:kind-validators` routes every node by its tag: fails on an unmapped tag, an unresolvable reference, or a node failing its Zod schema. First run: kg-qa 426/426, block-qa 122/122, test-run 1/1 parse.
- `kg:validate` routes by tag too; `gen-uml-overview.ts` draws one class per family.
- Skill: directory-conventions §"Node schemas, one per `$schema` family".
