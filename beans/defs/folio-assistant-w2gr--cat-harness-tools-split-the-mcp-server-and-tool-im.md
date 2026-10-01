---
# folio-assistant-w2gr
title: 'cat-harness-tools: split the MCP server and tool implementations into their own instance, depending on cat-harness'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T08:12:08Z
updated_at: 2026-10-01T05:14:21Z
parent: folio-assistant-vuip
---

Owner 2026-09-29/30: 'i want to split out cat-harness-tools too https://github.com/litlfred/cat-harness-tools' — 'see sibling work' (#1514, bootstrap-tools, bean 81tw). Direction ruled 2026-09-30: **tools depend on the harness** — cat-harness never imports the new instance.

Measured 2026-09-30: litlfred/cat-harness-tools is EMPTY (no commits). In scope: cat-harness/tools/ (8 files: discover, index, mcp, sessions, viewers, templates) and cat-harness/src/tools/ (17 MCP tool implementations). 40 files elsewhere in cat-harness import src/tools, because the MCP server registers the tools directly — so the server moves WITH the tools, and those 40 import sites are the work.

Recipe (from #1514): stage `cat-harness-tools/` as an instance in this repo first, own namespace, nothing in cat-harness names it; a published contract that stays byte-identical; move to the repo last.

## Done when
- [ ] The 40 import sites are listed and each classified (moves with tools / reads a harness schema / must invert)
- [ ] cat-harness-tools/ staged with its own declaration and namespace; cat-harness imports nothing from it
- [ ] gates green; the MCP server still starts and lists the same tools
- [ ] pushed to litlfred/cat-harness-tools

## Import sites, classified (2026-09-30, on main after #1592)

Measured by real import statements (a path mention in a comment is not one): **33 files** outside the tool directories import tool modules. The bean's "40" counted mentions.

The discovery that changes the plan: **`cat-harness/tools/` is not tool code.** It is the harness's `tools` GRAPH (Tool definitions, `defineTool` nodes, one subdirectory per contributing instance), and `tools/discover.ts` is the harness's reader over it: `discoverTools` walks every instance's declared `tools` directory. It STAYS in cat-harness. cat-harness-tools declares its own `tools` graph, which the reader finds by declaration, not by import.

| group | files | what they import | classification |
|---|---|---|---|
| harness scripts reading the Tool graph | kg-audit, kg-export, check-tools, check-maintained-artefacts, harness-schema-export, tool-coverage, viewer-declarations, gen-tools-viz, gen-upload-step-docs, check-tabular-stubs + 11 tests | `tools/discover.js`, `tools/index.ts` | **reads a harness graph — stays**; no inversion needed |
| the MCP server's registration | `adapters/document/index.ts` (9 src/tools modules), `src/index.ts` (capabilities) | `src/tools/*` | **moves with the tools** (server + wrappers, owner 2026-09-30) |
| harness code reaching into a Tool | `scripts/gen-skill-commands.ts` → `skill-prompts`; tests of `auth`, `capabilities`, `workflow`, `skill-prompts`; `schemas/kg-qa.test.ts` → `skill-fetch` | `src/tools/*` | **must invert**: the logic they need moves into a harness module first (as `skill-packages.ts` did in #1594) |
| content adapters' own tools | `adapters/*/tools/*` | own directory | out of scope, not the platform MCP tools |

## Owner ruling 2026-09-30: option A

Tool DEFINITIONS (the contracts in cat-harness/tools/mcp.ts etc.) stay in the harness; cat-harness-tools IMPLEMENTS them — the split bootstrap / bootstrap-tools already uses. So cat-harness/tools/ (definitions graph + discover.ts reader) stays whole; what moves is src/tools/* and the MCP server.

## 2026-09-30: the harness no longer imports Tool implementations
- #1594 moved skill-package discovery to scripts/skill-packages.ts (kg-audit, the workflow engine).
- The user-invocable skill list moves to scripts/invocable-skills.ts (gen-skill-commands).
After this, harness code imports cat-harness/tools/ (the definitions graph, which stays) and no src/tools module. Remaining: the MCP server, routes, sessions and src/tools/* move into cat-harness-tools/, plus the tests that exercise them.

## Classification, 2026-09-30 (real imports only, on main b1eaffee)

92 non-test modules under cat-harness/src/ and cat-harness/adapters/: **56 MOVES, 35 STAYS, 1 SPLIT**.
- MOVES: src/index.ts, server.ts, route-groups.ts, tool-groups.ts, types.ts; src/tools/* (16); src/routes/* (5); src/core/{cache,feedback,git,logging,rbac,github-auth}; auth/gateway; mcp/project; adapters/document/* (11); adapters/mcp-server/* (11).
- STAYS: src/workflow/* (14, by ruling); src/core/{access,git-refs,markdown-links,retry,safe-path,workflow-events}; blocks/*; crdm; docs; impact; issue-watch/*; logging/*; sessions/staleness; upstream/pins; qa-agent-write; adapters/manifest-entries.ts.
- SPLIT: src/builtin-adapters.ts — init-folio (harness) reads the BUILTIN_ADAPTERS table; resolveBuiltinAdapter() (server only) loads adapters/document by variable path.

Blockers found:
1. scripts/capture-mcp-tools.ts loads 11 src/tools by variable path — moves with them (with mcp:capture and mcp-project.test).
2. folio-assistant-core/scripts/sample-import-run.ts imports registerWorkflowTools from src/tools/workflow.ts — rewrite against the src/workflow engine.
3. folio-assistant-sci/adapters/paper imports adapters/document/* — sci's paper adapter is server-side, so sci would depend on cat-harness-tools (allowed by direction; paths repoint).

Entry points to repoint: package.json main/exports/files/scripts (start*, check-deps, mcp:capture), .mcp.json, build-lean-mcp.yml (adapters/mcp-server/Dockerfile), start-folio-assistant.sh, tsconfig include, code-quality-gates ruff scope.


## Owner rulings 2026-10-01

**Q1 — may folio-assistant-core depend on cat-harness-tools? NO: split the adapter.** Measured on main 19ab47a: core's adapters/document imports 16 modules that move (src/tools/{check-deps,preferences,preview,skill-fetch,skill-prompts,folio-init,readme-sync,render-order,readme-audit,lsi-query}, types, core/{git,feedback,logging,rbac,cache}, routes/chat), and scripts/sample-import-run.ts drives src/tools/workflow.ts. Ruling: the document adapter's SERVER half (tool registration, routes, RBAC/git/feedback wiring) moves into cat-harness-tools; core keeps the content logic. Layering stays cat-harness <- cat-harness-tools, and core does not import cat-harness-tools. sci (paper adapter, which extends core's DocumentContentAdapter) follows the same split.

**Q2 — packaging: own package.json**, like bootstrap-tools: cat-harness-tools carries its own manifest with the server entry points; the root start*/check-deps/mcp:capture scripts, .mcp.json and Docker paths are repointed; no compatibility re-exports.
