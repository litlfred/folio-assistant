---
# folio-assistant-bbza
$schema: bean/1.0.0
title: 'S5-b: tool implementations land on their layer — folio-specific to core, maths to sci (23 rows)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-24T08:05:00Z
parent: folio-assistant-7x5n
---

Story S5 (txue), with 70lx. Rows: cat-harness/docs/proposals/placement-audit-2026-10-01.json (PR #1778) — pr '(tool placement; S5 70lx carries implementations)': cat-harness -> sci 18, -> core 3, -> fhir-harness 1; smart-base -> fhir-harness 1. MCP rulings: generic MCP skills -> cat-harness/skills/tools/mcp/, folio-specific MCP -> folio-assistant-core/skills/tools/mcp/ and folio-assistant-core/tools/; folio-init SPLIT (mer2).
## Done when
- [ ] rows moved; MCP server lists the same tool set; gates green; merged

## State 2026-10-09
Re-derived from `placement-audit-2026-10-01.json` against the post-split mount: **23 of 23** rows tagged `unplanned (tool placement; S5 70lx carries implementations)` are still at their original path. Blocker `70lx` is completed. `cat-harness/skills/folio-core/` still holds the MCP skills the MCP ruling places under `skills/tools/mcp/`. Not started; now cross-repository. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

_2026-10-16T06:55:00Z_ — Block lifted: `70lx` is completed. Owner ruling 2026-10-16 06:50Z (question 4, option 1): the part-by-part measurement stands in for `bun run cat gates --all` and for falsifier 2, so 70lx is closed. Session https://claude.ai/code/session_01K9Xi9QSxCNYju8QNu7EuHg.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured against main: 20 of 23 tool rows still declared in `cat-harness/tools/` (lean-cache and glossary-build moved; fsh-cone and valueset-schemas are declared nowhere now). Slice 1 opened: litlfred/cat-harness#508 + litlfred/folio-assistant-sci#67 move 11 Tools whose skills already live in sci (latex-preflight, latex-overfull, tex-snippet-validate, tex-source-audit, lean-coverage, lean-audit, content-manifest-validate, paper-latex-build, proof-dependency-graph, proof-objects-extract, proof-status-update); merge #508 first. Tracking issue litlfred/cat-harness#507. Left: lean-build + lean-toolchain-setup (tied to the harness's `lean-toolchain-contract` skill and test), paper-preferences / paper-preview / check-dependencies (MCP-served), headless-render-qc (harness skill), folio-block-qa-summary / folio-block-screenshots (to core).
