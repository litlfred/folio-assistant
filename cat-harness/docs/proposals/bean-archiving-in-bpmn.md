---
title: "Bean archiving in BPMN — the terminal state nothing draws"
kind: proposal
movedFrom: fsh-guts/proposals/
movedOn: 2026-09-23
issue: 200
bean: folio-assistant-m8gz
summary: >-
  Every process that touches the work plan reached `resolve` and stopped, and `Process_BeanLifecycle` was called by nothing — mechanically why 219 completed beans sat inline until 2026-09-20. Settled 2026-10-24: the lifecycle is split into Process_BeanOpen and Process_BeanClose, which every bean-touching process calls; claim, resolve and archive live only there.
---

# Bean archiving in BPMN — the terminal state nothing draws
{: .no_toc }

Asked by the owner, 2026-09-20, on archiving 219 work items:

> make sure bpmn (sub)process on work item archiving wired up for process state
> management generally and specifically for things like publication pipeline,
> CRDM, SDLC… do analysis and create work item to fill in.

Measured on `654a48c2`. The short answer is that it is wired up **nowhere**,
and the more interesting finding is the second one below.

1. TOC
{:toc}

## Outcome — where the ops live now (2026-10-24)

All four questions below are settled. **Archiving is a per-activity op**
(owner, 2026-10-20) — the sweep stays the floor. **`Process_BeanLifecycle` is
called, and consolidated** (owner, 2026-10-24, option A): its two halves are
now called processes, and every process that works on a work item calls both.

| | process | file | ops |
|---|---|---|---|
| OPEN | `Process_BeanOpen` | `processes/sdlc/bean-open.bpmn` | `claim` — after check, create, whose work item; or leave it alone |
| CLOSE | `Process_BeanClose` | `processes/sdlc/bean-close.bpmn` | `resolve`, then `archive` on one activity shared by the done and scrapped outcomes; a blocker is noted and handed back |

`Process_BeanLifecycle` is OPEN → work → CLOSE. Each bean-touching process
calls OPEN where the work item becomes its own (then a `claimed` / `not yours`
gateway, since the engine does not hand a called process's end event back)
and CLOSE straight before each end it reaches from there. The CRDM phases run
on `crdm-requirements.bpmn`'s work item, which opens and closes it. Measured on
main before the change: 19 `claim` ops in 18 diagrams, 13 `resolve` in 11,
3 `archive` in 3; after it, one of each, all inside OPEN and CLOSE.
`check:bean-calls` (run within `check:workflow-refs`) keeps it that way, and
`todo-manager` § "Where the bean ops live" says how to call them.

The sections below are the 2026-09-20 analysis, kept as the record of why.

## What the engine supports

`WORK_PLAN_OPS` in `cat-harness/src/workflow/bean-link.ts` is exactly three:

| op | what the engine does |
|---|---|
| `claim` | sets the work item `in-progress` |
| `note` | appends |
| `resolve` | sets the work item **`completed`** |

There is no fourth. `process-model.ts` refuses an unimplemented op by name,
so a diagram *cannot* ask for archiving today — it would fail to load.

## Coverage — the arc is drawn, and it stops one step short

**25 of 38 diagrams** carry a `<cat-harness.processes:bean>` mark: 7 `claim`, 7 `note`,
5 `resolve`.

The three the owner named all reach the terminal state and stop there:

| process | ops |
|---|---|
| `draft-to-publication.bpmn` — the publication pipeline | `claim` → `note` → `resolve` |
| `crdm-close.bpmn` | `resolve` |
| `crdm-deliver.bpmn` | `claim` |
| `code-change-review.bpmn` — the SDLC diagram | `claim` → `resolve` |

`resolve` sets `completed`, and **`completed` is precisely the status
`beans archive` moves.** So every one of these processes manufactures the
condition and none of them discharges it. That is not a metaphor for how 219
work items accumulated; it is the mechanism.

## The finding that is worse than a missing op

**`Process_BeanLifecycle` is called by nothing.**

The corpus has 19 `calledElement` references. Not one of them names it:

```
Process_BuildL1Kg  Process_CRDM_Close  Process_CRDM_Deliver  Process_CRDM_Issue
Process_CRDM_Needs  Process_CRDM_Requirements  Process_CRDM_Signoff
Process_CodeChangeReview  Process_CodeReview  Process_DeriveContent
Process_Editing ×2  Process_EvidenceRetrieval  Process_ExtractStructure
Process_L1Gate  Process_NarrativeReview  Process_Publication  Process_Review
Process_UpstreamAdoption ×2  Process_VoiceReview
```

So `bean-lifecycle.bpmn` — the one diagram that models what happens to a
work item — **is a picture, not a subprocess.** The other processes interact with
the work plan through per-activity `<cat-harness.processes:bean op>` marks, which is a
different mechanism entirely: the engine performs the op inline, and the
lifecycle diagram is never entered.

That is why adding an `archive` op alone would not answer the owner's
question. The ask is *"wired up for process state management"*, and today
there is no wiring to extend — there is a diagram nobody calls and a set of
marks that know nothing about it.

## Two smaller defects found on the way

**`<cat-harness.processes:bean action="create"/>`** appears in `bean-lifecycle.bpmn`. The
loader reads `.op` and nothing else, and an absent `op` is *documented* as
meaningful — *"the step touches the plan in some way the tools do not perform
automatically"*. So a misspelled attribute is **indistinguishable from a
deliberate abstention**. Whatever that step was meant to do, it does nothing
and reports nothing.

**Archiving is named in no skill.** `todo-manager.md`, `bean-coordination.md`
and `bean-blocking.md` between them do not mention `beans archive` once. The
only thing in the repository that notices an unarchived work item is the
`bean-store` health check — which *reports and never acts*, and which was
itself blind to the store from `#437` until `2tlx` repointed it, about an
hour before the owner asked this question.

So the gap is three-layered and each layer hides the next: the engine cannot
do it, no process asks for it, no skill says when, and the one check that
would have said so could not see the store.

## What filling it in involves

Not a plan — the work item decides. But the shape is constrained by what is above:

1. **An `archive` op**, or a reasoned decision that archiving is *not* a
   per-activity operation. It is plausibly a periodic sweep rather than a
   step in any one process, in which case the answer is a scheduled process
   and not a fourth op — and that is the first question to settle, because
   it determines everything after it.
2. **Wiring `Process_BeanLifecycle` to something**, or retiring it. A diagram
   nobody calls is the `plj1`/`dh4f` family again: it looks like coverage.
3. **`action=` refused rather than ignored**, so the next misspelling fails
   at load instead of reading as an abstention.
4. **A skill saying when**, since `todo-manager` is the source of truth for
   the store and currently stops at `scrapped`.

## What this does NOT claim

That the 219 work items were a defect. They were the correct state under the rules
as written — `resolve` is where every process ends, and nothing said to go
further. The defect is that no layer *could* have said so.
