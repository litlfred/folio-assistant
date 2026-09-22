---
# folio-assistant-m8gz
title: 'BEAN LIFECYCLE: archiving is drawn nowhere, and Process_BeanLifecycle is called by nothing'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-20T07:35:41Z
updated_at: 2026-09-22T10:57:22Z
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

## Third Done-when delivered 2026-09-22 — and the guard found 19 more instances

`<folio:bean>` now REFUSES an unknown attribute at load. That is a different
check from the one already there, which refuses an unknown op VALUE — and the
gap between them is the whole defect this bean recorded.

### What the guard found that nobody knew about

The `action="create"` instance was already gone, kept only as a comment in
`bean-lifecycle.bpmn`. The DEFECT CLASS was not, and turning the guard on
found a second one immediately:

| | |
|---|---|
| `store="beans/"` on `<folio:bean>` | **19 occurrences across 11 diagrams** |
| ...plus in test fixtures and a docstring | 2 more |

Every one was unread by the engine. Every one also hardcoded `beans/` — a
declared directory — inside a diagram, which is the literal `check:declared-
paths` exists to refuse and does not reach `.bpmn`.

**It is the case that hides best**, and this bean's own analysis did not spot
it. `action="create"` sat ALONE, so its step silently did nothing and somebody
eventually noticed. `store="beans/"` sat BESIDE a valid `op`: the step worked,
nothing looked wrong, and the stray attribute was copied into ten more
diagrams and two fixtures. A defect that breaks something gets found; one that
breaks nothing propagates.

### Abstention stays legal, and that is asserted rather than implied

A bare `<folio:bean/>` still loads and still means what `ProcessNode.
workPlanOp` documents — "touches the plan in some way the tools do not perform
automatically". A guard that refused it would have removed the READING instead
of the AMBIGUITY, which is the opposite of the fix.

### Falsified before it was trusted

| break | result |
|---|---|
| the attribute guard removed | 4 pass, **3 fail** |
| the guard also refusing a bare `<folio:bean/>` | 3 pass, **4 fail** |
| restored | **7 pass, 0 fail** |

A corpus test loads every diagram in the repository, with a vacuity guard on
the file count — it is what found the 19, and a fixture-only test would not
have.

`bun run gates` — 122 of 122.

## Still open, and the first one is the owner's

The design question is untouched and deliberately so: **is archiving a
per-activity op at all, or a periodic sweep?** Everything else in this bean
follows from it, and picking an answer to get on with the work would decide it
by default.

## Done when

- [ ] **First question settled**: is archiving a per-activity op at all, or a
      periodic sweep? It is plausibly the latter — nothing in any process
      naturally owns "and now tidy the store" — in which case the answer is a
      scheduled process, not a fourth op. Everything else follows from this.
- [ ] `Process_BeanLifecycle` is either called by something or retired. A
      diagram nobody calls looks like coverage; that is the `dh4f` family.
- [x] `action=` on `<folio:bean>` is REFUSED at load rather than ignored — and
      turning it on found 19 live `store="beans/"` instances across 11 diagrams
- [ ] `todo-manager` says when a bean is archived; it currently stops at
      `scrapped`.

## Not doing / not claiming

The 219 beans were **not** a defect. They were the correct state under the
rules as written — every process ends at `resolve` and nothing said to go
further. The defect is that no layer *could* have said so.
