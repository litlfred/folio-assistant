---
name: work-plan-store
description: >
  The contract the work plan (beans) keeps as a data store: give back a bean
  exactly as written, keep ids unique, keep links between beans pointing at
  beans that exist, keep status and type to their closed lists, lose nothing
  when two writers push at once, and keep the history of who changed what. A
  mechanical Actor plays this Role; this is what it must do.
---

# The work plan's contract

**The work plan is a data store, and this is its contract** (owner,
2026-11-01, Q-DS-1 A and Q-DS-2 A). `work-plan` in
[`scenarios/roles.json`](../../../scenarios/roles.json) is a mechanical Role
with a `store` block: what it holds, and how it is reached. This skill is the
other half, what it must do. How an agent USES the plan is
[`todo-manager`](todo-manager.md); this file says what the plan promises back.

A diagram draws it as a data store, never a lane (Q-BR-3 A): a
`dataStoreReference` with `dataStoreRef="work-plan"`, declared once in
[`processes/global-tasks.bpmn`](../../../processes/global-tasks.bpmn). A task
that opens or closes a bean writes to it with a `dataOutputAssociation`; a
task that reads the plan has a `dataInputAssociation` from it. The task sits
in the lane of whoever does it.

## What it holds, and how it is reached

| | |
|---|---|
| Holds | beans (`bean-defs`, one Markdown file each, `$schema: bean/1.0.0`), PR addenda (`bean-notes`), running BPMN instances (`workflow-state`) |
| Where | `beans/` in each instance, laid out by `beans/beans.json`. One logical plan, one copy per instance repository |
| GraphQL | `beans-serve`'s schema, [`internal/graph/schema.graphqls`](https://github.com/litlfred/beans/blob/main/internal/graph/schema.graphqls) |
| CLI | the harness tools `beans-cli`, `bean-query`, `bean-claim-check` |
| Files | [`schemas/kinds/bean-defs.schema.json`](../../../schemas/kinds/bean-defs.schema.json) |

## Responsibilities

Each line is something a test can check.

1. **Give back what was written.** A bean read back is, byte for byte, the
   bean written.
2. **Keep ids unique.** No two beans share an id, and a short id resolves to
   exactly one bean or to none.
3. **Keep links whole.** `parent`, `blocking` and `blocked_by` name beans that
   exist (`beans check`).
4. **Keep the lists closed.** `status` and `type` take only the values the
   CLI declares.
5. **Lose nothing to a race.** Two writers at once both land: a push that is
   refused fetches, rebuilds on the tip and retries, and is never forced.
6. **Keep the history.** Git shows who changed a bean and when.

## Tests

None yet. Until a test names each line above, `kg-audit` reports this role as
`mechanical-role-untested`, which is the truth. The tests belong with the
toolset, and this file gains a `tested-by:` line when they exist.

## Not its responsibility

Deciding what to work on, who claims a bean, or whether work is done. Those
are judgements made in the lanes of the people and agents who read and write
the plan.
