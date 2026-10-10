---
# folio-assistant-89cl
$schema: bean/1.0.0
title: 'STATE BRANCH P5: adjust skills and processes — content-context-and-state-graphs, directory-conventions, todo-manager, bean-coordination, continual-progress, workflow-state, process-state'
status: completed
type: task
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-09T15:08:00Z
parent: folio-assistant-fs43
---

Proposal section 4.1. AFTER the decisions and Phase 3, not before: a skill describing a branch that does not exist yet is a rule nobody can follow.

## Done when
- [x] each skill in section 4.1 adjusted
- [x] workflow-state-in-beans.md section 0 addendum
- [x] AGENTS.md beans section pointers updated

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md

## Closed 2026-10-09

- Branch: `claude/89cl-state-branch-skills-p5`
- Commit: `9481791a2cac02d58ff6c2dad58233853e137ad0`
- Evidence:
  - `skills/kg/kg-core/content-context-and-state-graphs.md`: added §"Where each layer lives" reflecting proposal §3.1 table with `storage.keyedBy: tip` on dedicated branch-store branches (`cat/cat-harness/beans`, `todos`, `fsh-guts`).
  - `skills/kg/kg-core/directory-conventions.md`: updated §"`storage` — a directory kept on a branch" documenting that branch-mounted graphs are still declared directories mounted at declared paths.
  - `skills/sdlc/sdlc-core/todo-manager.md`: documented state mount at `beans/`, pushing via `bun cat-harness/scripts/branch-store.ts push --id beans` / `state:push`, and retiring committing bean files on code PRs on `main`.
  - `skills/sdlc/sdlc-core/bean-coordination.md`: retired obsolete references to "a claim is branch-local" (claims push immediately to `cat/cat-harness/beans` via `claimOnBranchStore` and are globally visible), and documented `Closes-bean:` and closure evidence.
  - `skills/sdlc/sdlc-core/continual-progress.md`: clarified that bean edits are pushed to the branch store and not bundled into PR commits.
  - `skills/process/workflow/workflow-state.md` and `skills/process/workflow/process-state.md`: explained that running workflow instances live in the state graph on the branch store.
  - `docs/proposals/workflow-state-in-beans.md`: added §0.1 Addendum documenting that Option A's co-location is preserved on the state branch.
  - `AGENTS.md`: verified and updated bean section pointers to mention branch store push.
  - Verification: `bun run typecheck` (0 errors), `bun test scripts/tests/claim-branch-store.test.ts` (9 pass), `bun test schemas/subgraph-source.test.ts` (25 pass), `bun test scripts/tests/subgraphs.test.ts` (14 pass).
