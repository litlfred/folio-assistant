---
# folio-assistant-bbza
$schema: bean/1.0.0
title: 'S5-b: tool implementations land on their layer — folio-specific to core, maths to sci (23 rows)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-29T15:05:00Z
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

_2026-10-24T08:16Z_ — Claimed by the separation drain thread (session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e). Open PRs: litlfred/cat-harness#508, litlfred/folio-assistant-sci#67, litlfred/folio-assistant-core#203.

_2026-10-26T13:20:00Z_ — Progress update: Slice 1 has merged across all three repositories (`litlfred/cat-harness#508` @ `2026-10-24T10:43:50Z`, `litlfred/folio-assistant-sci#67` @ `2026-10-24T13:17:53Z` receiving the 11 Lean/LaTeX/proof Tools, and `litlfred/folio-assistant-core#203` @ `2026-10-24T13:17:57Z` receiving `folio-block-qa-summary` and `folio-block-screenshots`). Remaining tools tracked in `litlfred/cat-harness#507`.

_2026-10-29T08:05Z_ — ~~Every tool row is now off cat-harness.~~ (corrected 08:40Z below) Slice 2 (litlfred/cat-harness#658 + litlfred/folio-assistant-sci#104) moved paper-preferences, paper-preview and check-dependencies to sci, since they satisfy sci's folio-paper-adapter skills. The last row (litlfred/cat-harness#662 + litlfred/folio-assistant-sci#105) moved headless-render-qc to sci: its subject is a folio's built paper, and satisfying the harness's rendered-verification from sci points down. All of these merged under the owner's 2026-10-29 07:20Z rule ("merge all ready and then deal with aftermath"). litlfred/cat-harness#507 is closed. Left before ticking: "MCP server lists the same tool set; gates green", checked at the next folio-assistant re-pin. The in-process modules stay in cat-harness-tools and resolve through `resolveImplementingPath`. Lane A, session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo.

_2026-10-29T08:40Z_ — Correction: slice 2 is reverted (litlfred/cat-harness#667, litlfred/folio-assistant-sci#106). A composed-index `check:tools` reported 3 missing paths. `resolveImplementingPath` looks in the declaring instance and in the instances that need it. cat-harness-tools needs cat-harness, but nothing needs sci, so from sci the `src/tools/{preferences,preview,check-deps}.ts` modules are unreachable, and the MCP server would have stopped serving them. **Left:** paper-preferences, paper-preview and check-dependencies, which move only together with their implementations (a sci code home, or a needs edge). headless-render-qc stays in sci, because it is `invoke.shell` only. litlfred/cat-harness#507 is reopened.

_2026-10-29T15:05Z_ — The last three rows moved with their code, and are merged on the owner's 15:01Z card ("A. Merge all five"). litlfred/folio-assistant-sci#113 (150054214) adds the paper-preferences, paper-preview and check-dependencies Tools, with their MCP modules in `adapters/paper/tools/`. litlfred/cat-harness#706 (d6158d5) removes the definitions. litlfred/cat-harness-tools#855 (af72448) removes `src/tools/{preferences,preview,check-deps}.ts`. In the composed index, `registerServedToolGroups` registers all three from sci. kg:audit has 3 fewer critical findings and no new ones. **Left before ticking:** confirm the MCP tool set and gates at the next folio-assistant re-pin, then close litlfred/cat-harness#507. Lane A, session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo.
