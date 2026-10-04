---
# folio-assistant-dxqm
title: 'UNREACHABLE DECLARED ARTEFACTS: a declared executable artefact nothing can reach reads exactly like a decision nobody takes — measured on merge-priority.dmn (kg-qa says pass, no caller can evaluate it) and merge-queue.ts (only importer is its own test)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T05:49:00Z
updated_at: 2026-10-04T05:49:50Z
parent: folio-assistant-1xhc
---

`1xhc` one level deeper. The epic's line is *a gate that does not fire is
indistinguishable from one that passed*. This is: **a declared executable
artefact that nothing can reach is indistinguishable, from outside, from a
decision nobody takes.**

Two instances found by the merge steward 2026-10-04, both past all 217 CI gates:

1. **`cat-harness/scripts/merge-queue.ts`** — docblock says *"a library the
   merge steward and the tile call"*. Nothing called it: no `package.json`
   script, no workflow, no tool, and its **only importer is its own test**. So
   `merge-priority.dmn`'s ordering could not be asked for, and the queue was
   ordered by hand.
2. **`cat-harness/processes/sdlc/decisions/merge-priority.dmn`** — `not("green")`
   in `Rule_HeadNotGreen` since it was drawn. `unaryTest` throws
   `UnsupportedDmn` on `not(...)`, so the table was unevaluable by **any**
   caller. Its committed `kg-qa` sidecar read `"result": "pass"`, because
   `decision-outcomes-used` calls `loadDecisionTable` + `possibleOutcomes` and
   **neither parses a unary test**. Load is not evaluability.

Both fixed on PR #1952. This bean is the GATE and the GUIDANCE.

## Done when

- [ ] every declared `.dmn` decision is checked EVALUABLE — not merely loadable
      — against this repo's own evaluator, and an unevaluable one is a hard
      failure
- [ ] the evaluability question is asked of `decision-table.ts` itself, never by
      restating the FEEL grammar in a gate (two spellings of one grammar are
      free to disagree)
- [ ] every declared `.bpmn` is checked reachable through the engine's own entry
      point, with stem and `bpmn:process` id ambiguity a failure
- [ ] a module whose only importer is its own test is reported, with a
      declaration (`@entrypoint`) as the way to say how it IS reached
- [ ] the measurement is a committed sidecar, so "never audited" cannot read as
      "audited clean"
- [ ] wired into `.github/workflows/code-quality-gates.yml`, so `gates.ts`
      derives it

## Measured before building, 2026-10-04

| question | denominator | findings |
|---|---|---|
| declared `.dmn` decisions evaluable | 10 | **1** (`merge-priority#Decision_MergePriority`) |
| declared `.bpmn` reachable by `processFiles` | 85 | 0 |
| stem collisions / duplicate `bpmn:process` ids | 85 | 0 / 0 |
| `.bpmn` that will not load | 85 | 0 |
| modules whose ONLY importer is a test | 1834 tracked `.ts` | **9** |
| modules "unreferenced" by pure inference | 1834 | **710** — unusable |

The last row is the whole argument for a declaration over a grep, and it is
`audit-coverage`'s gate half for the same reason: inference fails in both
directions at once. 710 of 1834 is not a finding list, it is noise, and a gate
keyed on it would be switched off in a week. The 9-item slice is crisp because
it names a *relation* — the only thing that reaches this module is the thing
that proves it works — and `merge-queue.ts` is the first of the 9.
