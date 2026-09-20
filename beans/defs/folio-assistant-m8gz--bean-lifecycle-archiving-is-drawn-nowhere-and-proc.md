---
# folio-assistant-m8gz
title: 'BEAN LIFECYCLE: archiving is drawn nowhere, and Process_BeanLifecycle is called by nothing'
status: todo
type: feature
created_at: 2026-09-20T07:35:41Z
updated_at: 2026-09-20T07:35:41Z
parent: folio-assistant-zzmr
---


**Owner, 2026-09-20**, on archiving 219 beans: *"make sure bpmn (sub)process
on bean archiving wired up for process state management generally and
specifically for things like publication pipeline, CRDM, SDLC... do analysis
and create bean to fill in."*

Analysis: `fsh-guts/proposals/bean-archiving-in-bpmn.md`. Measured on
`654a48c2`.

## The answer: wired up nowhere, and there is no wiring to extend

| | |
|---|---|
| engine ops (`WORK_PLAN_OPS`) | **3** — `claim`, `note`, `resolve`. No archive, and an unimplemented op fails at load |
| diagrams carrying a bean mark | **25 of 38** — 7 claim, 7 note, 5 resolve |
| `Process_BeanLifecycle` callers | **ZERO**, of 19 `calledElement` refs in the corpus |
| skills naming `beans archive` | **0** — not `todo-manager`, `bean-coordination` or `bean-blocking` |

**The three processes the owner named all reach the terminal state and stop.**
`resolve` sets `completed`, and `completed` is exactly what `beans archive`
moves:

- `draft-to-publication.bpmn` (publication) — claim → note → resolve
- `crdm-close.bpmn` — resolve; `crdm-deliver.bpmn` — claim
- `code-change-review.bpmn` (SDLC) — claim → resolve

So every one manufactures the condition and none discharges it. That is the
mechanism behind the 219, not an analogy for it.

**The bigger finding**: `bean-lifecycle.bpmn` is a PICTURE, not a subprocess
— nothing calls it. Other processes touch the plan through per-activity
`<folio:bean op>` marks, a different mechanism that never enters it. So an
`archive` op alone would not answer the ask: there is no wiring to extend.

## Two smaller defects found on the way

- `<folio:bean action="create"/>` in `bean-lifecycle.bpmn` is **not read** —
  the loader takes `.op` only, and an absent `op` is *documented* as
  meaningful ("touches the plan in some way the tools do not perform
  automatically"). A misspelling is indistinguishable from a deliberate
  abstention.
- Three layers each hid the next: the engine cannot archive, no process asks,
  no skill says when — and the one check that would have reported it, the
  `bean-store` health check, was blind to the store from #437 until `2tlx`
  repointed it an hour before this question was asked.

## Done when

- [ ] **First question settled**: is archiving a per-activity op at all, or a
      periodic sweep? It is plausibly the latter — nothing in any process
      naturally owns "and now tidy the store" — in which case the answer is a
      scheduled process, not a fourth op. Everything else follows from this.
- [ ] `Process_BeanLifecycle` is either called by something or retired. A
      diagram nobody calls looks like coverage; that is the `dh4f` family.
- [ ] `action=` on `<folio:bean>` is REFUSED at load rather than ignored, so
      the next misspelling fails instead of reading as abstention.
- [ ] `todo-manager` says when a bean is archived; it currently stops at
      `scrapped`.

## Not doing / not claiming

The 219 beans were **not** a defect. They were the correct state under the
rules as written — every process ends at `resolve` and nothing said to go
further. The defect is that no layer *could* have said so.
