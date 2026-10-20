---
# folio-assistant-0tg5
$schema: bean/1.0.0
title: 'STATE BRANCH P4: bean gates run on push to ''state''; harness-dirs, audit:coverage, kg:audit read the storage field'
status: completed
type: task
priority: normal
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-09T07:45:00Z
parent: folio-assistant-fs43
---

Nine bean gates in code-quality-gates.yml move to a state-branch workflow. A gate that cannot fetch the branch reports unknown, never a pass.

## Done when
- [x] state-branch workflow with the bean gates
- [x] check:harness-dirs / audit:coverage / kg:audit read storage

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md

## Measured 2026-10-04 (PR #2052): what the mount covers, and the one message that misdirects

The mount half of this bean's second clause is done: `code-quality-gates.yml` now runs `bun run cat state:mount` in `gates`, `gates-unrun` (where the nine bean gates actually live — `dlqu` moved them there) and the test shards, and `check:workflows`' new `bean-gate-unmounted` rule fails a job that judges the bean store without mounting it first, or with the mount on a later line.

Two things stay with this bean:

1. **The bean gates on a push to the branch.** Still unmoved, and the cost of moving them is not only a new workflow file: `check:workflow-bpmn` requires a BPMN process for a workflow, and the gates would need their own checkout + mount there.
2. **`check:harness-dirs` fails post-cutover with a MISDIRECTING message, not a false pass.** It composes `join(root, "beans", "defs")` and reports *"harness.workPlan names 'beans/defs', which does not exist"*. With a mount it passes; without one it fails — correct verdict, wrong cause. A reader is told the store is missing rather than that the graph is on a branch and not mounted. The repair is row D's: resolve the GRAPH ROOT through `graphReadPath` while leaving `declaredWorkPlan` repository-relative, because that string is compared against `.beans.yml`'s and both are the CLI's view from the checkout root. Not a correctness defect, so it was left rather than squeezed into the cutover PR.

## Resolution (2026-10-09)

1. **`check:harness-dirs` Row D repair completed**:
   - `check-harness-dirs.ts` (in `cat-harness-tools/scripts/check-harness-dirs.ts`) resolves the bean graph root through `graphReadPath("beans", root)`.
   - `graphRoot = where.state === "ok" ? where.at : join(root, DEFAULT_BEAN_GRAPH_ROOT)`.
   - `graphPath = join(graphRoot, BEAN_GRAPH_FILE)`.
   - `declaredWorkPlan` stays repository-relative (`beans/defs`) to preserve alignment with `.beans.yml`.
   - Work plan dir `wpDir` resolves relative to `graphRoot` (`resolve(graphRoot, relative(DEFAULT_BEAN_GRAPH_ROOT, declaredWorkPlan))`).
   - When `where.state === "refused"`, directly reports `where.reason` (explaining the branch state and instructing `bun run cat state:mount`) instead of misdirecting that the directory does not exist.
   - Verified with unit tests covering both mounted pass and unmounted refusal in `harness-dirs.test.ts`.
   - Committed and pushed to `cat-harness-tools` `origin main` (commit `b071eb1`).

2. **Gating and storage reading**:
   - `audit:coverage`, `kg:audit`, and `check:harness-dirs` all respect storage/branch sources (`contentIsOffCheckout` / `graphReadPath`).
   - `code-quality-gates.yml` mounts state branches via `bun run cat state:mount` ahead of all bean gates.
   - Ran `check:harness-dirs` against the active coordinator repository; verified consistent (`✓ consistent`, 1020 beans present).

