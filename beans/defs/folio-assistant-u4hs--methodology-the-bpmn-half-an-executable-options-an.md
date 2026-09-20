---
# folio-assistant-u4hs
title: 'METHODOLOGY: the BPMN half — an executable options-analysis subprocess'
status: todo
type: task
priority: normal
created_at: 2026-09-20T08:49:49Z
updated_at: 2026-09-20T08:55:16Z
parent: folio-assistant-d308
---

The owner asked for the methodologies to be **beaned up to BPMN**, 2026-09-20. The
four sub-graphs and the adoption skill are done; the executable process is not.

## What exists now

- `methodology` graph kind, registered in `BASE_GRAPH_KINDS`
- `cat-harness/methodologies/` — `kepner-tregoe`, `madr`, `dmn` (harness-owned)
- `smart-kg/methodologies/` — `grade` (first content in smart-kg)
- `methodology-adoption` skill, on the `business-analyst` role, carrying the
  selection question and the six-step ingestion process

## What is missing

An **executable subprocess** so selecting and applying a methodology is a process
step rather than advice — called from the points that already ask for a judgement:

| caller | task |
|---|---|
| `crdm-requirements-workflow` | before `A_Implement` |
| `content-change-review` | `Task_AssessImpact` → `Task_ReviewImpact` |
| `upstream-version-adoption` | `A_Impact` → `A_RecordOutcome` (already records a decline) |
| `editing-hci-validation` | `Gateway_EditorDecision` → `Task_RecordDecision` |

The call-activity precedent is already in the corpus: `CallActivity_Evidence`,
`Call_NarrativeReview`, `Call_CodeReview`. One definition, many callers.

## The design question to settle first

**What triggers it.** A subprocess invoked on every decision is ceremony, and
ceremony is how a gate stops being read. The proposal is `opening-brief`'s own
trigger — **irreversibility and surprise, not size** — so a reversible choice
needs no subprocess and an irreversible one cannot skip it.

The lane is `business-analyst`, which now carries `methodology-adoption`.

## Done when

- [ ] the trigger is settled, with the owner
- [ ] `options-analysis.bpmn` with a `business-analyst` lane, whose first activity
      is the selection question and whose branch is the chosen methodology
- [ ] called from the four points above, rather than copied into them
- [ ] a QA criterion for a decision recorded with **fewer than two real options** —
      one option is not a choice, which is MADR's own refusal made checkable
