---
# folio-assistant-rdkm
title: A graph kind names one node schema per $schema family (qa holds seven)
status: todo
type: feature
created_at: 2026-09-23T06:25:14Z
updated_at: 2026-09-23T06:25:14Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: 'QA audits?'. The qa graph (test/results/) holds seven $schema families: kg-qa/v1 426, qa-witness/v1 137, block-qa/v1 122, qa-results/v1 20, folio-qa-index/v1 13, translation-qa/v1 9, folio-test-run/v1 1. GraphKindDef.validator takes ONE module#Export, so the UML overview can only draw qa as a bare box naming content/pipeline/qa-witness.ts (TS interfaces, no Zod). Let a kind map each $schema tag to its validator (kg-qa/v1 -> KgQaReportSchema, folio-test-run/v1 -> TestRunSchema, ...), and draw one class per family. Same shape fixes memory (memory + waiver).
