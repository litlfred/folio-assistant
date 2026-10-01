---
# folio-assistant-w2gr
title: 'cat-harness-tools: split the MCP server and tool implementations into their own instance, depending on cat-harness'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T08:12:08Z
updated_at: 2026-10-01T08:56:37Z
parent: folio-assistant-vuip
blocked_by:
    - folio-assistant-70lx
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


## Owner ruling 2026-10-01 (third): sci's server half

**sci's server parts go into a NAMED SUBGRAPH of folio-assistant-sci** — 'not big enough for full repo, at least not yet'. That covers PaperContentAdapter (a server wrapper over core's content plus tool registration) and tools/lean.ts (the Lean MCP tool registrar). So it is not cat-harness-tools, and not a separate sci-tools instance. The subgraph may depend on cat-harness-tools; sci's content does not.

Steps landed: #1736 (types.ts split, ContentSource), #1738 (DocumentContent / server wrapper split, boundary test).


## Handover 2026-10-01 (session pausing about a week)

**Landed:** #1736 (step 1: content model split into src/content-types.ts, ContentSource), #1738 (step 2: DocumentContent / DocumentContentAdapter split, boundary test), #1742 (step 3a: cat-harness-tools instance created; adapters/mcp-server and its 3 tests moved in). The owner authorised merging #1742 before CI finished on its final head (77fdefd). Its earlier heads' failures were fixed in-branch (folio-root scan, Dockerfile path, server-path-sinks, jsonld-gen-check paths). **First thing next time: check CI on main after 4e11aa1** and fix anything red.

**Next: step 3b.**
- git mv the cat-harness/src server modules into cat-harness-tools/src/ (mirrored layout): src/{index,server,route-groups,tool-groups,types}.ts, src/tools/*, src/routes/*, src/core/{rbac,github-auth}.ts, src/auth/*, src/mcp/*. core/{git,feedback,cache,logging,anthropic,safe-path,...} STAY.
- Core's server wrapper goes with them: folio-assistant-core/adapters/document/index.ts and tools/{audit,bib,qa,render,transform,validate}.ts, plus their 6 core tests and declared-adapter.test.
- folio-assistant-core/scripts/sample-import-run.ts (+test) moves to cat-harness-tools: it drives the real workflow tool, and is the only staying non-test importer of a moving module (measured).
- Move contentAdapters 'document' out of folio-assistant-core.json into cat-harness-tools.json, and update BUILTIN_ADAPTERS paths (src/builtin-adapters.ts stays: init-folio uses it).
- Declare sci's server subgraph: re-describe sci-adapters (adapters/) as sci's server half (owner ruling). PaperContentAdapter extends DocumentContentAdapter, which then lives in tools.
- Root package.json main/exports/start*/check-deps/mcp:capture, .mcp.json, tsconfig, partition rules, cat-harness-tools/package.json scripts.
- Tools: scratchpad move-ts.py (git mv plus re-resolve imports and links). Beware HAND-BUILT paths (join(import.meta.dir, ...)) and paths filters: tests found them only in CI. Run bun run gates before merging.

**Then:** the 9umr finale. Move the 5 tool skills left in folio-core (mcp-assembly, mcp-contract, mcp-projection, skills-and-tools, covered-is-not-reachable) to their home once the tools layer exists, then close 9umr.


## 2026-10-01 — step 3b folded into iirv 70lx (separation arc 7x5n, gap G2)
Same move, two plans. 70lx carries the list now; this bean closes when 70lx does.


## Owner ruling C1, 2026-10-01 (separation arc 7x5n): cat-harness-tools sits BELOW core
cat-harness-tools needs only cat-harness (+ bootstrap-tools); folio-assistant-core MAY depend on it. MCP-server / tool-implementation parts that need core move UP into folio-assistant-core. Supersedes the reading of the 2026-10-01 ruling 2 as 'core must not depend on cat-harness-tools': it now reads 'core must not depend on the MCP server'. Measured basis: 88 references from core into cat-harness code. Under D1 those would have formed a core<->tools cycle. Concretely: cat-harness-tools/cat-harness-tools.json drops needs: folio-assistant-core.
