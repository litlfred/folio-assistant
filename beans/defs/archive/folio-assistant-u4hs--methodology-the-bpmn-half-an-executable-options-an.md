---
# folio-assistant-u4hs
title: 'METHODOLOGY: the BPMN half — an executable options-analysis subprocess'
status: completed
type: task
priority: normal
created_at: 2026-09-20T08:49:49Z
updated_at: 2026-09-20T15:11:06Z
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

- [x] the trigger is settled, with the owner
- [x] `options-analysis.bpmn` with a `business-analyst` lane, whose first activity
      is the selection question and whose branch is the chosen methodology
- [x] called from the four points above, rather than copied into them — **4 of 4**,
      one `calledElement="Process_OptionsAnalysis"` per diagram, never copied
- [x] a QA criterion for a decision recorded with **fewer than two real options** —
      bean `brv6`, now in the `bean-store` health check as *"decision records with
      fewer than two options"*

---

## 2026-09-20: built, on the trigger the owner authorised

`processes/options-analysis.bpmn` — one lane (`Business analyst`, a lane name
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


---

## STATE 2026-09-20 — built and called once, by the owner's choice of scope

Measured rather than assumed: `grep` for `calledElement="Process_OptionsAnalysis"`
across `processes/` and `methodologies/` returns **exactly one** hit,
`upstream-version-adoption.bpmn:85`, which is the site the owner authorised.

Placement inside that diagram, recorded because it was a judgement: the call sits
after the MVP build and the gates, because those are **how an option's costs are
measured**, and before `PM_Decide` — a `userTask` admitting `person` only with
`relaxable="false"`. So the subprocess informs a decision it cannot make.

### What is left, and it is additive

The other three call sites. Each is a `callActivity` pointing at the same
`Process_OptionsAnalysis`, so none of them re-opens the design; the reason to do
them one at a time is that each needs its own placement argument of the kind above,
and a placement argument is worth more than a wired edge.

**This bean stays open for those three.** Closing it on one call site would make
the work plan assert a coverage it does not have — and the three are exactly the
kind of thing that becomes invisible once the epic above it is resolved.


---

## DONE 2026-09-20 — all four wired, and the fourth caller found a defect in the subprocess

`grep` for `calledElement="Process_OptionsAnalysis"` now returns **four** hits:

| diagram | interposed on | lane |
|---|---|---|
| `upstream-version-adoption` | `GW_Findings --no-->` into `PM_Decide` | Agent |
| `content-change-review` | `a6`, out of `Task_AssessImpact` | Agent |
| `editing-hci-validation` | `Flow_21`, out of `Task_ReviewFindings` | Agent |
| `crdm-deliver` | `SF_..._1`, the entry into `A_Implement` | Agent |

All four in the agent's lane, and for one reason stated in each: **the subprocess
produces the analysis and does not decide.** Every caller's decision step is a
`userTask` or a gateway owned by someone else.

### Two of the three named call points did not exist as named

The work plan's table was written from intent, not from the diagrams, and both
errors are the same kind — a pair of tasks named as if an edge joined them:

- **`content-change-review`: `Task_AssessImpact` → `Task_ReviewImpact`.** Those are
  in **different lanes with no sequence flow between them** — the agent's
  assessment reaches the committee through `Task_CompareBeforeAfter`. The
  conceptual handoff is real; the edge was not. Interposed on the edge that exists,
  `Task_AssessImpact` → `Task_CommitPush`.
- **`editing-hci-validation`: `Gateway_EditorDecision` → `Task_RecordDecision`.**
  Those run the **other way round**: `Flow_21b` goes `Task_RecordDecision` →
  `Gateway_EditorDecision`, so the gateway routes on a decision already recorded.
  Interposing there would analyse options after the choice was made.
- **`crdm-requirements-workflow`: before `A_Implement`.** `A_Implement` is not in
  that diagram at all. `crdm-requirements.bpmn` is an orchestrator of seven call
  activities; Phase 6 lives in `crdm-deliver.bpmn`. The call goes where the step
  is.

### The finding: the subprocess had no way to STOP

`A_Frame`'s documentation has always ended with the trigger and its exit —

> *"is this irreversible, or would the answer surprise someone? If neither, say so
> and stop; the calling step decides without this subprocess. **Stopping here is a
> correct outcome, not a skipped step.**"*

— and **the diagram gave it no way to stop.** `Process_OptionsAnalysis` was a
straight line: `Start → A_Frame → A_Select → A_Apply → A_Record → End`. The prose
promised a branch the model did not have, so a wired caller had to run all four
activities for every decision. That is the ceremony this process's own
documentation refuses: *"a subprocess fired on every decision becomes ceremony,
and ceremony is how a gate stops being read."*

**Found by the second caller, not by reading.** With one caller the straight line
looked fine. Wiring `editing-hci-validation` made its corpus-gate tests fail with
`Task_RecordDecision is not enabled. Enabled now: A_Frame.` — every write in that
process, including a spelling fix, now required a full options analysis.

Fixed: `GW_Trigger` after `A_Frame`, and a **separate** `End_TriggerNotMet` rather
than a short-circuit into the existing end, because the two outcomes are different
facts for a caller — *"no analysis was needed"* is not *"the analysis recommends
X"*, and collapsing them leaves a caller unable to tell a considered skip from a
completed comparison.

**Deliberately not DMN-backed.** Irreversibility and surprise are judged, not
computed; `dmn` says to claim computability only when the criteria recur with the
same inputs having to produce the same answer, and *"would this surprise someone"*
does not. So the outcome is supplied at the step, exactly as
`Gateway_EditorDecision` takes one.

### The general shape, worth keeping past this bean

> **A subprocess with one caller is a subprocess whose contract has been tested
> once — by the diagram that happened to fit it.**

The owner's *"only `upstream-version-adoption` first"* was the right call for a
different reason than scope: the first caller proved the design, and the second
proved the *contract*.

### Verified

- `bun run gates --all` — **60 of 60 pass, the whole set**, including 174 e2e tests
- `check:workflows`, `check:workflow-refs`, `check:workflow-coverage`,
  `kg:audit:check` — all 0
- 5 new tests on the gateway, including the control that `yes` still runs the whole
  analysis — without it, a gateway routing everything to the exit would be the
  opposite defect and just as quiet
- both existing drivers updated to take the early exit
  (`drainSubprocess(..., { GW_Trigger: "no" })`), 63 pass
- SVGs, docs pages, `.pot` catalogues and kg-qa sidecars regenerated


---

## CORRECTION 2026-09-20 — I put the CALLEE's skill on the CALLER's activity, four times

Caught by reading `role-carries-activity-skill` after the wiring, not by the
gates, which were **green with all four findings present** because
`kg:audit:check` fails only on `critical`.

Every one of my four call activities carried
`<folio:skill ref="methodology-adoption"/>`, and every one produced:

> needs skill `"methodology-adoption"`, but its lane's role `"authoring-agent"`
> does not carry it.

Including `upstream-version-adoption`, so this was **latent from the first call
site** and I did not notice when I wired the other three — I propagated it.

### The rule the corpus actually follows

Two precedents, and they look contradictory until you read what each names:

| call activity | skill ref | its lane's role carries it? |
|---|---|---|
| CRDM's seven (`Call_Issue` … `Call_Close`) | `crdm-requirements-workflow` | **yes** — the ORCHESTRATING skill |
| `CallActivity_Evidence` | none | n/a |

So: **a call activity may name a skill its own lane's role carries — the skill of
orchestrating the call — and must never name the callee's internal skill.** The
subprocess declares its own; `Process_OptionsAnalysis`'s `business-analyst` lane
already carries `methodology-adoption`, which is exactly why the caller naming it
was redundant at best and false at worst.

Fixed by dropping the ref from all four, not by adding `methodology-adoption` to
`authoring-agent`. Adding it would have made the audit pass by asserting the
authoring agent performs methodology selection — diluting the lane distinction
this platform is built on (*"nothing IS a reviewer; somebody ACTS AS reviewer
inside a process"*). The audit was right and my annotation was wrong.

Also fixed, same line and same class, in the same file: `Call_ThemeUIReview`
carried `theme-ui-review`, the callee's skill, with the same finding. Pre-existing
rather than mine, and left failing it would have kept `crdm-deliver`'s sidecar red
in a file I was already editing.

`role-carries-activity-skill` is now `pass` on all four diagrams.
`crdm-deliver` keeps one pre-existing `skill-servable` failure —
`crdm-requirements-workflow` is served by no local package — which is the same
family as `sa8y`'s manifest item and not this bean's.

### Why the gates did not catch it, which is the part worth keeping

`role-carries-activity-skill` is not `critical`, so `bun run gates` passed 60 of
60 with four false claims in the graph. That is the `ci-health` shape one level
in: **a green gate set is not a clean audit, and this session shipped four
findings on a green run before reading the sidecars.** Read the sidecar after
touching a diagram; the gate does not stand in for it.
