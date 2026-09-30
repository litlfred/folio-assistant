---
# folio-assistant-xsqm
title: 'BOOTSTRAP-TOOLS: re-create as a sibling instance; Zod, generators and checks move down; import cone to zod only'
status: in-progress
type: feature
priority: high
created_at: 2026-09-29T23:42:57Z
updated_at: 2026-09-30T08:46:25Z
parent: folio-assistant-vke6
---

Owner rulings, 2026-09-29 (answers to the separation analysis, Q7/Q1/Q10/Q5):

- **Zod moves DOWN into bootstrap-tools** — reverses `319n`'s placement. Across repos, Zod in cat-harness makes a bootstrap release depend on cat-harness, which depends on bootstrap. bootstrap still knows no zod (`etg1`).
- **bootstrap-tools owns content checks AND the README/SVG writers** (options 1+2), not a whole harness. Owner: *"i dont think we need 3 b/c no seperate visualizers/declared directories, just a content KG … should be swappable content — someone wants a different visualizer they can use different toolset"*.
- **Discussion `$id`s change to the file path**, and *"make QA gate for KG nodes"*: a published node's identifier must match where its file sits.
- **CI:** reusable workflow described but DISABLED; npm package yes; *"all scripts … should be in bootstrap-tools, but can also be directed to agent to play a role in a process in a chat discussion. i dont want to pay $, so can describe github actions but dont implement unless explicit user request. assume primarily agentic"*.
- **No initial commits to litlfred/bootstrap or litlfred/bootstrap-tools yet.** Staged here as a sibling directory.

Analysis: session scratchpad `separation-process-analysis.md` (94 beans, cone measurements, 11 owner questions).

## Phase 1 — core (one PR)
- [x] `bootstrap-tools/` sibling instance: declaration, package.json (zod only), not nested in bootstrap
- [x] move Zod sources (graph, model-registry, glossary-ledger, requirement, discussion), gen-bootstrap-schemas, bootstrap-schema-page, release-iri, iri-sync, term-links, check-bootstrap-concepts, dependency-order's checkDeclaredOrder
- [x] cuts E1–E4: minimal declaration reader over KnowledgeGraphDeclarationSchema; `--root`; git ls-files instead of git-corpus
- [x] repoint cat-harness's 11 import sites
- [x] generated bootstrap/schemas byte-identical before/after (except the $id fix)
- [x] discussion $ids = file path; QA gate: published node IRI = release base + its path
- [x] closure gate: bootstrap-tools imports only its own files + zod + node builtins
- [x] tests move (split graph.test.ts per the analysis §3.6)

## Phase 2 — README + SVG writers
- [x] subgraph-readmes, readme-sections (kg:processes/kg:files), render-bpmn into bootstrap-tools with cones cut — output byte-identical (78 SVGs, every README but the two template rows); standalone writes only `supports` graphs

## Phase 3 — publication + docs gaps
- [ ] publish-instance-files documented; `/0.1.0/` and `/v0/` layout described; bootstrap.json name collision fixed; bs: vocabulary producer; hosted outputs in skills; stale kg-export/bootstrap-graph-publication text; release/tag mechanics; migration-plan Phase II
- [ ] reusable workflow + npm manifest, disabled/unpublished; agent-runnable role/process for the tools

## Phase 4 — the replicable separation process
- [ ] kg-separation BPMN + skills (done, 433d3c5) + missing gates (analysis §6–7; still open)

**Port from #1514 (2026-09-30):** the two pieces unique to the overtaken PR #1514 (bean `81tw`, now scrapped) — the `bootstrap-contract-semver` skill with `scripts/schema-semver.ts` (`bootstrap:semver`), and `scripts/validate-bootstrap.ts` (`bootstrap:validate`, a CI step beside `bootstrap:schemas:check`) — are ported onto this bean's `bootstrap-tools/` under child task `folio-assistant-l9d5`, adapted to the zod-only closure; the validator's graph-document target is not ported because its Zod is still in cat-harness.
