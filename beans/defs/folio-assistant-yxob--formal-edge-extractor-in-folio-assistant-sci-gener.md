---
# folio-assistant-yxob
title: Formal-edge extractor in folio-assistant-sci + generated blueprint export (#1492)
status: in-progress
type: feature
priority: normal
tags:
    - lean
    - formal-graph
created_at: 2026-09-29T23:18:38Z
updated_at: 2026-09-29T23:29:01Z
parent: folio-assistant-zzmr
---

Tracks litlfred/folio-assistant#1492. Owner decisions (2026-09-29): the hybrid, no LeanArchitect; an elaborated formal-edge extractor; tools and skills in folio-assistant-sci, never in core ("f-a-core has high level processes only, no tooling").

## Todo
- [x] core: `elaborated` source label, `isElaborated`, and one `summarizeSources` rule shared by the reader (content-graph.ts) and the writer (lean-atlas-ingest.ts); `--ingest --source elaborated`
- [x] folio-assistant-sci/lean/formal-edges.template.lean: LeanArchitect's collectUsed rule over a tagged SET (the lean.ref targets); reports missing names
- [ ] folio-assistant-sci/content/pipeline/formal-edges.ts: driver that collects lean.ref targets, imports every built module, runs `lake env lean`, and ingests with --source elaborated; unit tests
- [ ] MCP Tool contributed through folio-assistant-sci/contributions.ts, plus wiring ContributionRegistry.registerTools into the MCP server (today no production caller)
- [ ] skill in folio-assistant-sci (directory declared); core lean-formal-graph.md points to it
- [ ] generated leanblueprint export (paper adapter), formal \uses, --check
- [ ] fix or remove the 2 broken blueprint workflows
- [ ] docs-site graph and Lean status page

## Evidence
Small-cluster measurement on #1492: the template reproduces LeanArchitect v4.25.0 on 172/172 edges (30 % tagged), plus 2 structure-field edges LeanArchitect omits; the scan fallback has recall 0.63.
