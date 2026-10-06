---
# folio-assistant-0tg5
title: 'STATE BRANCH P4: bean gates run on push to ''state''; harness-dirs, audit:coverage, kg:audit read the storage field'
status: todo
type: task
priority: normal
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-04T06:42:31Z
parent: folio-assistant-fs43
---

Nine bean gates in code-quality-gates.yml move to a state-branch workflow. A gate that cannot fetch the branch reports unknown, never a pass.

## Done when
- [ ] state-branch workflow with the bean gates
- [ ] check:harness-dirs / audit:coverage / kg:audit read storage

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md

## Measured 2026-10-04 (PR #2052): what the mount covers, and the one message that misdirects

The mount half of this bean's second clause is done: `code-quality-gates.yml` now runs `bun run state:mount` in `gates`, `gates-unrun` (where the nine bean gates actually live — `dlqu` moved them there) and the test shards, and `check:workflows`' new `bean-gate-unmounted` rule fails a job that judges the bean store without mounting it first, or with the mount on a later line.

Two things stay with this bean:

1. **The bean gates on a push to the branch.** Still unmoved, and the cost of moving them is not only a new workflow file: `check:workflow-bpmn` requires a BPMN process for a workflow, and the gates would need their own checkout + mount there.
2. **`check:harness-dirs` fails post-cutover with a MISDIRECTING message, not a false pass.** It composes `join(root, "beans", "defs")` and reports *"harness.workPlan names 'beans/defs', which does not exist"*. With a mount it passes; without one it fails — correct verdict, wrong cause. A reader is told the store is missing rather than that the graph is on a branch and not mounted. The repair is row D's: resolve the GRAPH ROOT through `graphReadPath` while leaving `declaredWorkPlan` repository-relative, because that string is compared against `.beans.yml`'s and both are the CLI's view from the checkout root. Not a correctness defect, so it was left rather than squeezed into the cutover PR.
