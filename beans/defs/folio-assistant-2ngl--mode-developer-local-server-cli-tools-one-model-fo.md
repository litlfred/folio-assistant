---
# folio-assistant-2ngl
title: 'MODE: developer — local server, CLI tools, one model for every workflow'
status: completed
type: task
priority: normal
created_at: 2026-09-19T08:55:36Z
updated_at: 2026-10-09T18:59:00Z
parent: folio-assistant-5a3l
---

From [#363](https://github.com/litlfred/folio-assistant/issues/363): "developer
mode: likely wants local server hostign the content, run CLI version of tools.
uses single agent/model for all workflows".

## The strawperson position

Developer mode is a **point in the topology product**, not a special code path:

| axis | value |
|---|---|
| forge | local git only, or any — the mode does not care |
| publication host | local HTTP server |
| compute | the developer's own machine |
| model supply | one model, every workflow |
| data stores | none |

If that is right, then "developer mode" needs no implementation at all beyond
the axes themselves plus the local-server tool — it is a named preset. That is
the claim to attack.

## Where it might not be right

**"CLI version of tools"** is the part that may be a real requirement rather
than a preset. Every capability here exists twice: as an MCP tool and as a
`bun run` script. `AGENTS.md` §Commands lists nine scripts; the MCP surface is
larger. If some capability is MCP-only, then developer mode is not merely a
preset — it is blocked on parity, and that parity gap should be measured before
this bean is scoped.

**One model for every workflow** may also be substantive. The role model assigns
skills per lane; if any lane's skill assumes a model class the single model does
not have, the workflow degrades rather than fails. Degrading silently is worse
than refusing.

## Done when

- [x] the MCP-vs-CLI parity gap is measured and written down, with the command
      that measured it and the date
- [x] developer mode is expressible as axis values, or the reason it is not is
      recorded
- [x] a workflow whose lane needs a capability the configured model lacks
      refuses rather than degrades

## Not doing

Building a CLI for anything. Measuring first — the gap may be empty.

## Closed 2026-10-09

- Branch: `claude/2ngl-developer-mode-parity`
- Commit: `b158ec5448a73b1a07cdfaab0720f84c3820188f`

### Evidence
1. **MCP-vs-CLI Tool Parity Measurement**:
   - Implemented `scripts/check-tool-parity.ts` (`bun run cat check:tool-parity`).
   - Measured on 2026-10-09 across 145 declared tools:
     - 9 tools available on both MCP and CLI (6.2%)
     - 16 tools MCP-only (11.0%) (`workflow-list`, `workflow-start`, `workflow-next`, `workflow-gate`, `workflow-complete`, `skill-fetch`, `skill-list`, `paper-preferences`, `paper-preview`, `user-auth`, `translation-*`, `bean-query`)
     - 112 tools CLI-only (77.2%)
     - 8 tools neither (5.5%)
   - 9 skills are satisfied ONLY by MCP tools with no CLI equivalent (`process-state`, `skills-and-tools`, `build-pdf`, `build-docs`, `rendering-auditor`, `staging-review`, `task-authorization`, `deployment-auth`, `decision-audit`).
   - Documented in `docs/reference/developer-mode.md`.
2. **Developer Mode Topology**:
   - Defined Developer Mode axes in `schemas/cat-harness.ts`: `COMPUTES`, `TOOL_SURFACES`, `MODEL_CARDINALITIES`, `DATA_STORES`, `VISIBILITIES`.
   - Defined `DEVELOPER_MODE_TOPOLOGY` (`forge: "none"`, `compute: "workstation"`, `toolSurface: "cli"`, `modelCardinality: "single"`, `dataStores: ["none"]`, `outwardFacing: false`) and `DEVELOPER_MODE_PROFILE` (`publicationHost: "local-server"`).
   - Verified zero conflicts via `topologyConflicts()`.
3. **Single-Model Capability Refusal Guard**:
   - Implemented `schemas/model-capabilities.ts` and `src/workflow/model-capabilities.ts`.
   - Extended `RoleDef` and `RoleDefSchema` with `requiredCapabilities`.
   - Integrated `validateWorkflowModel` and `validateLaneModelCapabilities` in `src/workflow/instance.ts` (`startInstance` and `complete`), raising structured `WorkflowCapabilityRefusalError` when a model lacks lane capabilities.
4. **Verification**:
   - `scripts/tests/developer-mode-parity.test.ts` (8 passed, 72 assertions).
   - Full test run passed (`scripts/tests/developer-mode-parity.test.ts`, `scripts/tests/topology-conflicts.test.ts`, `scripts/tests/workflow-roles.test.ts`).
   - `bun run typecheck` clean.
