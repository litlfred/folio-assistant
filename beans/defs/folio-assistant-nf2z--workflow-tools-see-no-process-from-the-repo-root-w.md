---
# folio-assistant-nf2z
title: 'WORKFLOW TOOLS SEE NO PROCESS: from the repo root workflow_list reports none — diagrams live in dependencies, the resolver is root-only'
status: completed
type: bug
priority: high
created_at: 2026-09-29T22:32:34Z
updated_at: 2026-10-06T19:30:00Z
parent: folio-assistant-ahvw
---

Found 2026-09-29 while starting xlg2 (bean `xlg2`, the first real sample-import run).

**Measured:** `registerWorkflowTools` captured with a stub server (the pattern in `precondition-consumer.test.ts`), rooted at the repository root — the MCP server's default (`src/index.ts`: `resolve(import.meta.dir, "../..")`). `workflow_list` returned **"Processes: _(none)_"**. `workflowFiles(repoRoot)` → 0 `.bpmn`; `workflowFiles("cat-harness")` → 71.

**Cause.** `resolveModel` and `workflow_list` call `workflowFiles(root)` → `workflowDirs` → `kgDirectories(root)`, root-only on purpose (AGENTS.md). Since the split the root instance (`folio-assistant.json`) declares no diagrams; all of them belong to dependencies: bootstrap 3, cat-harness 71, folio-assistant-core 1. Skills already cross that boundary through `resolveSkillDirs`; the workflow tools never did. `roleGraphFor(root)` is undefined at the root for the same reason, so a step could not say what role it acts as.

**Consequence.** In a default server no process can be started, so none can be recorded — the "a turn inside a process has an instance" rule (bean `vlhk`) was structurally uncompliable. Consistent with `beans/workflows/`: newest instances 09-21/22.

## Done when
- [x] the workflow tools resolve diagrams across the dependency overlay (dependencies in order, the root last and winning a name collision), without changing `workflowDirs`/`kgDirectories`, whose root-only behaviour other callers rely on
- [x] the role graph resolves the same way, root first
- [x] instances are still read from and written to the ROOT's `beans/workflows/`
- [x] a test: from the repository root `workflow_list` lists `sample-import`, and `workflow_start` resolves a dependency's process

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n sweep of in-progress beans whose work has landed). Every Done-when box was already ticked by its holder. That was NOT taken as the evidence: the measurement below was re-run on main at 24b221415 (2026-10-06), and no open PR names this bean.

- `bun test cat-harness-tools/scripts/tests/workflow-overlay.test.ts` → pass (the overlay test that box 4 names: `workflow_list` from the root lists `sample-import`).
