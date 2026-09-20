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

---

## 2026-09-20: wired into one caller, chosen by Kepner-Tregoe over the four

The owner asked for the analysis on the four candidate callers and chose **only
`upstream-version-adoption` first**. Applying the methodology to the choice of
where to put the methodology is the honest test of it, so this was worked as a
KT MUST/WANT split rather than a preference.

### The three MUSTs, and what they eliminated

| MUST | what it rules out |
|---|---|
| M1 — real alternatives exist at the call site | a site with one path has nothing to analyse |
| M2 — not re-entered on a loop where the decision is already made | re-running an analysis after the decision is ceremony |
| M3 — the actor at the call site can descend into `Business analyst` | a lane the caller cannot enter is an unreachable subprocess |

`crdm-deliver` **eliminated on M2**: both `GW_IncrementOK` and `GW_MVPReady`
flow back into `A_Implement`, so the call would re-fire after the increment
decision was taken. `editing-hci-validation` is **weak on M3**. That leaves
`upstream-version-adoption`, where the alternatives are named in the diagram
itself — adopt, hold, decline.

### Where it sits, and why not where the bean first proposed

The bean above proposed `A_Impact → A_RecordOutcome`. That is **wrong**, and the
diagram says why: the MVP build and its gates are HOW the options' costs are
measured. An analysis before `Task_Mvp` would weigh alternatives against no
evidence, and one after `A_RecordOutcome` would analyse a decision already made.

It goes on the **single edge into `PM_Decide`** — `SF_UA_9`, the "no findings we
can fix" branch out of `GW_Findings`:

```
GW_Findings --no--> Call_OptionsAnalysis --> PM_Decide --> GW_Adopt
```

In `Lane_Agent`, not `Lane_Publication`. `PM_Decide` is a `userTask` whose lane
admits `person` only and which `folio:policy relaxable="false"` locks, so
putting the analysis in the agent's lane is what keeps "produces the options"
and "makes the decision" visibly separate rather than implied. A subprocess in
the deciding lane would be a second accepting party.

### The loop re-entry, checked rather than assumed

`SF_UA_8` loops back to `A_Impact`, so a run where the reviewer found something
fixable reaches the call activity a **second** time. I read
`bean-link.ts:147` before wiring it: `op="note"` does `--body-append` with no
dedupe, while `claim` and `resolve` are idempotent at `:163`. I had predicted
that was a defect and it is **not** — a second note is correct here, because the
analysis genuinely ran again against changed evidence, and deduping would hide
the re-analysis.

### A pre-existing defect the regeneration exposed

`processHierarchy()` in `gen-docs-pages.ts` reads `calledElement` with a regex
over the whole XML, and this diagram's `<bpmn:documentation>` says *"Callers
invoke it with `calledElement="Process_UpstreamAdoption"`"*. So the published
hierarchy has always carried `Process_UpstreamAdoption → itself`, a phantom
self-call read out of prose. Visible only because my change put that object in a
diff. The function's own comment worries about the regex matching **nothing**;
nobody considered it matching **too much**, and `todos.test.ts` pins real edges
without ever asserting a phantom one is absent. Fixed in the next commit.

### Still not done

The QA criterion for a decision recorded with fewer than two real options, and
the other three callers — `content-change-review` survives M1–M3 and is the
next candidate if the owner wants a second.

Verified: `check:workflow-refs` 0 with 10/10 coverage on the diagram,
`check:workflow-policy` 0, `render:bpmn:check` clean, `translate-bpmn:check`
clean across 5 locales, `gen-docs-pages --check` clean, `kg:audit:check` no
critical, 3311 tests 0 failures.

### The merge added an obligation to the `methodology` kind

Merging main (72 commits) revealed that the graph-kind registry had grown a
LAYER AXIS — `holds: "content" | "context" | "state"` — after the kind landed.
Two tests failed on it, and both were right to.

`methodology` is **`context`**, by the axis's own criterion rather than by
resemblance to `memory`: read during a process, never written by one. A step
that amended an adopted standard would be rewriting the standard, and bringing a
new one in is a human-directed act (`methodology-adoption`'s six-step ingestion),
exactly as relocating something into `fsh-guts` is. Not `content`, though the
files are prose a reader can follow: `content` is the folio's SUBJECT MATTER,
and a methodology is how a decision about the subject gets made.

That is the fourth obligation an added graph kind has turned out to carry here —
an avatar, a `directory-conventions` table row, the pinned literal lists (now
derived, so retired), and a layer. None is discoverable from the schema alone;
each was found by a test failing.
