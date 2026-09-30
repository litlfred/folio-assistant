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
- [x] folio-assistant-sci/lean/formal-edges.lean.tmpl: LeanArchitect's collectUsed rule over a tagged SET (the lean.ref targets); reports missing names
- [x] folio-assistant-sci/content/pipeline/formal-edges.ts: driver that collects lean.ref targets, imports every built module, runs `lake env lean`, and ingests with --source elaborated; unit tests
- [x] MCP Tool contributed through folio-assistant-sci/contributions.ts, plus wiring ContributionRegistry.registerTools into the MCP server (today no production caller)
- [x] skill in folio-assistant-sci (directory declared); core lean-formal-graph.md points to it
- [ ] generated leanblueprint export (paper adapter), formal \uses, --check
- [ ] fix or remove the 2 broken blueprint workflows — template half DONE (dead push gates in paper `blueprint.yml` and `lean_ci.yml` now fire on a manual run of main; `template-dispatch-gates.test.ts` holds every dispatch-only template to it); `publish.yml`'s editorial-`\uses` job waits for the generated export
- [ ] docs-site graph and Lean status page

## Evidence
Small-cluster measurement on #1492: the template reproduces LeanArchitect v4.25.0 on 172/172 edges (30 % tagged), plus 2 structure-field edges LeanArchitect omits; the scan fallback has recall 0.63.

## Findings while building

- **Stale-output bug, fixed:** the first driver draft never deleted a previous run's raw output, so a failed Lean run could be read as current. runFormalEdges now removes it first.
- **Root choice for contributions:** the server loads from the FOLIO root (findContentRepoRoot()); where that falls back to the platform's own cat-harness/ (no folio found, as in this repository), it uses the repository root above it. Verified on the real server: tools/list gives 13 tools including lean_formal_edges.
- **PRE-EXISTING, not fixed here:** qa-sweep.ts loads contributions from INSTANCE_ROOT = cat-harness/, which declares no dependencies, so it registers 0 contributed checkers (measured). folio-assistant-sci's two cost checkers (proof-compile-cost, proof-no-cost-regression) therefore never run in a real sweep, while qa-checker-discovery.test.ts passes because it loads from the repository root. Needs its own bean and the owner's call.
- **Known limitation, shared with --scan:** with no formal-ref layer configured, blocks resolved only through the Lean package resolver carry no lean_path, so --stale cannot track them.
- **Dead deploy gates in the paper templates, fixed:** `blueprint.yml` and
  `lean_ci.yml` trigger only on `workflow_dispatch`, yet their deploy /
  doc-gen4 steps were gated on `github.event_name == 'push'` — never true, so
  every folio `folio_init` wrote could never publish its blueprint or Lean
  docs, and no run failed to say so. Now gated on a dispatch of `main` with no
  `ref` override. Calibrated test: 2 fail on the old templates, pass after.
