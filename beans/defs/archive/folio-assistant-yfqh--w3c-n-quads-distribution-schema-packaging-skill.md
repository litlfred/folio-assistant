---
# folio-assistant-yfqh
$schema: bean/1.0.0
title: 'W3C N-Quads distribution schema, packaging skill, and universal named query engine'
status: completed
type: task
priority: normal
created_at: 2026-10-07T23:37:59Z
updated_at: 2026-10-08T19:50:00Z
parent: folio-assistant-whlc
---

Implements the W3C N-Quads distribution schema, packaging skill, and universal named query engine:
- External schema `w3c-n-quads` registered in `external-schemas/w3c-n-quads.json`.
- Platform schema `folio-nquads-distribution/v1` in `schemas/nquads-distribution.ts` with partition size ceiling constants.
- Packaging skill `nquads-distribution` and execution skill `named-query-execution` in `skills/kg/graph-management/`.
- Query CLI in `scripts/nquads-query.ts` and Oxigraph browser client in `docs/assets/js/oxigraph-query-client.js`.
- MCP tool `nquads_query` in `cat-harness-tools/src/tools/nquads-query.ts`.
- BPMN process diagrams for distribution packaging and query execution.

## Done when
- [x] W3C N-Quads external schema and platform schema registered and validated
- [x] 2-tier subgraph partitioning and packaging skill documented and implemented
- [x] Named SPARQL query engine implemented with Graph Availability Guard and parameter binding
- [x] MCP tool `nquads_query` exposed in `cat-harness-tools`
- [x] Automated unit and integration tests passing

## Completed on landed evidence
- Landed in `litlfred/cat-harness` PR #2 (merge commit `0c257d18`, head commit `9375373e`): W3C N-Quads distribution schema, packaging skill, and named query engine.
- Landed in `litlfred/cat-harness-tools` PR #1 (merge commit `e8a5c70`, head commit `efaf3e0`): `nquads_query` MCP tool.
- Verified test suite `scripts/tests/nquads-distribution.test.ts` passing (3/3 pass) and `tsc --noEmit` typecheck clean in both repositories.
