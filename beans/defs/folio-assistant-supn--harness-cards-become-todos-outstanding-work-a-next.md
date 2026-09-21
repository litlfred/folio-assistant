---
# folio-assistant-supn
title: 'HARNESS CARDS BECOME TODOS: outstanding work, a next-action recommendation from initialisation state, and health badges'
status: todo
type: task
created_at: 2026-09-20T15:07:23Z
updated_at: 2026-09-20T15:07:23Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20, answering the four options put to them — first "2+ 2",
corrected immediately to:

> 2+3 + recomend....

and, in the same breath:

> recommendatio on what to do based on curent state of where harness go to in
> its intialzaiton. would also have harness health check badges.

## What was chosen

**Option 2 AND option 3, together**, plus a third thing neither option had:

| part | what it means |
|---|---|
| **2** | the harness card stops carrying brochure copy — scope, RTFM links, *"The documentation you will never read"* — and carries that harness's OUTSTANDING WORK instead |
| **3** | the card IS a todo sticky: same visual treatment, same status and priority affordances, not an info panel styled to match |
| **+ recommend** | it says WHAT TO DO NEXT, derived from how far that harness got in its INITIALISATION |
| **+ badges** | harness health-check badges on the card |

So the landing page stops describing the repository and starts showing its
state: per harness, where it got to, what is outstanding, and whether it is
healthy.

## Two blockers, both measured 2026-09-20, and both are "the data does not exist"

**1. Nothing records where a harness got to in its initialisation.**
`beans/workflows/` — the declared `workflow-state` graph, one JSON per running
BPMN instance, committed so a sibling session sees the same position — is
**EMPTY**. `bootstrap/workflows/initialize-harness.bpmn` is the process an
Initiator starts, and no instance state for it exists. So "current state of
where harness got to in its initialization" is not a question anybody can
answer today.

That is the same shape as `v1hw`'s uningested badge: the widget is easy and
the RELATION it displays has never been written down. A recommendation
computed from absent state would be a confident sentence about nothing.

**2. Health checks are repository-wide, not per harness.** `bun run health`
has five checks — staging-preview-size, staging-preview-orphans,
repository-size, bean-store, todo-store — and every one is about the
REPOSITORY. `check:ci-health` is per-workflow on the default branch. Neither
is per-instance, so "harness health check badges" needs a per-harness health
notion that does not exist yet. Note the bean-store and todo-store checks are
the closest, and they are still global.

**Neither blocker is a reason to defer the bean** — they are the bean. The
card is a rendering of two facts that must first be made recordable.

## The rule this must not break

`health` **reports and never acts**, and four of its five findings name
something a PERSON does. A badge is a report, so that holds. But
"recommendation on what to do" is one step from an action, and the moment a
card offers to do the thing it recommends it is subject to
`deletion-requires-confirmation` and the rest — the card may say what should
happen; it may not decide that it happens.

## Depends on

- `5y4b` — todo stickies carrying theme art. If the harness card IS a todo,
  these stop being two designs and become one, so do `5y4b` first or together.
- `7po1` — `workflows/state` owning the beans+todos skills; the empty
  `beans/workflows/` is that bean's territory.
- `hfkl` — bootstrap's exemption. Bootstrap gets a card like everyone else,
  and its "health" is whether its `.json`/`.jsonld` exists, since that is what
  its existence means.
- `slw1`, `v1hw` — same "record the relation before rendering it" shape.

## Done when

- [ ] Initialisation position is recorded per harness and readable
- [ ] A per-harness health notion exists, distinct from repository health
- [ ] The harness card is a todo sticky carrying outstanding work, a
      next-action recommendation, and health badges — and recommends without
      acting

## `aazi` computes the same fact on a different surface

The root README dashboard (`aazi`) needs "initiated / partially initiated" per
instance — which is this bean's blocker exactly: where an instance reached in
`initialize-harness.bpmn`, with `beans/workflows/` empty. **Whichever lands
first should record the relation; the second consumes it.** Two surfaces
computing process position independently is how they start disagreeing.

---

## RE-MEASURED 2026-09-21 — blocker 1 still holds, but not for the stated reason

`beans/workflows/` is **no longer EMPTY**. It holds two committed instances,
both `$schema: "folio-workflow-instance/v1"`:

| instance | process | status | `bean` |
|---|---|---|---|
| `crdm--folio-assistant-6lb8` | `Process_CRDM` | running | `folio-assistant-6lb8` |
| `crdm--issue-607-kg-to-cdn-portal` | `Process_CRDM` | running | `folio-assistant-xies` |

**The blocker survives the correction, narrowed.** Neither instance is
`initialize-harness.bpmn` — both are the CRDM requirements process. So *"where
a harness got to in its initialization"* still has no answer, and this bean's
conclusion is unchanged.

But the REASON matters for whoever picks it up: the store works, the schema is
real, and instances are being written and committed. What is missing is that
nobody has run the initialisation process under the engine. That is a much
smaller gap than "the data does not exist", and it fails differently — an
`initialize-harness` instance would appear the first time one is started,
without any new mechanism.

Recorded rather than left, because a blocker stated more broadly than the
evidence supports is one the next agent takes as impassable.
