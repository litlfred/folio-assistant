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

---

## 2026-09-20: built, on the trigger the owner authorised

`skills/workflows/options-analysis.bpmn` — one lane (`Business analyst`, a lane name
`roles.json` already declares), four activities, indexed on the workflow page,
rendered to SVG, translated to `.pot`, audited.

| activity | skill | why |
|---|---|---|
| `A_Frame` | `opening-brief` | name the KIND of thing being chosen, then check the trigger |
| `A_Select` | `methodology-adoption` | the selection question, in order, first yes decides |
| `A_Apply` | `methodology-adoption` | follow it whole; at least two real options; no scoring |
| `A_Record` | `decision-audit` + `folio:bean op="note"` | the rejected options are part of the output |

**The trigger is `opening-brief`'s: irreversibility and surprise, not size.** A
reversible choice leaves at `A_Frame` — and the diagram says that stopping there is
a correct outcome, not a skipped step, because otherwise the first person to hit it
will think they have to continue.

**One subprocess, not a branch per methodology.** The methodologies are parallel
tracks selected by context, and the selection is a judgement inside `A_Select`. A
gateway per methodology would assert the choice is computable from data, which
`dmn` says to claim only when the criteria recur.

**It does not decide.** It produces the options, their trade-offs and a
recommendation; the decision and its authorisation belong to whoever owns the
calling step. Stated in the diagram's own documentation so a caller cannot read it
as delegating the decision.

### Three gates refused it, each for a real reason

1. **The engine refused `folio:bean op="update"`** — *"not implemented. Supported:
   claim, note, resolve."* `note` is correct: recording an analysis on a bean is
   neither claiming it nor resolving it. The engine refusing an unimplemented op
   rather than accepting it silently is the same guarantee as refusing a
   hand-supplied gateway outcome.
2. **`check:workflow-refs` refused it as NOT INDEXED** — and my first fix edited
   `docs/publication-workflow.md`, which is **generated**. `AGENTS.md` forbids
   hand-editing a generated directory, and the check reads the content-object
   source under `content/docs/publication-workflow/` rather than the page. Reverted
   and edited the source, which regenerated 12 pages and 145 witnesses.
3. **`role-carries-activity-skill` refused it** — `A_Frame` names `opening-brief`
   and `business-analyst` did not carry it. Added to the role, which it wants on its
   own terms: an analyst framing a decision needs the brief. Third time this
   criterion has caught a skill bound to an activity without being given to the
   lane's role.

### Not done, and deliberately

**Not yet called from the four decision points** (`crdm-requirements-workflow`,
`content-change-review`, `upstream-version-adoption`, `editing-hci-validation`).
Wiring a call-activity into four live diagrams is a separate change with its own
review surface, and each caller needs its own decision about where in its flow the
call sits. The subprocess stands alone and correct first.

Also not done: the QA criterion for a decision recorded with fewer than two real
options — MADR's own refusal made checkable.

Verified: `check:workflow-refs` 0, `check:workflow-policy` 0, SVG renders, 3311
tests with 0 failures, 46 gates — the whole set.
