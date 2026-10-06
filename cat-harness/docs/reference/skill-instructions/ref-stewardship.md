---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Ref stewardship'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/ref-stewardship.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/ref-stewardship.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/ref-stewardship.md){: .fa-edit-source }

{% raw %}
# Ref stewardship — one ref, many writers, one steward

A **watched ref** is a long-lived branch that several processes write and that
something downstream consumes serially. `main` is one. `gh-pages` is one. Each
`cat/cat-harness/*` store branch is one. A feature branch is **not** — it has
one writer and no downstream serialisation, and giving it a steward buys
nothing and adds a single point of failure.

A watched ref is `main`, `gh-pages`, or a branch a declaring directory's
`storage` (or `source`) names. There is no central table: `special-branches.json`
was removed on 2026-10-05 (owner). A ref nothing declares is not a watched
ref, and this skill does not apply to it.

## What a steward is FOR, and what it must not become

[`role-model`](role-model.md): nothing *is* a
steward. An actor **acts as** one inside a process, for the duration of a lane,
over **one named ref**. The ref is a parameter of the lane instance, not a
property of the persona — which is why `merge-steward` names no ref in its own
description and why a second contended ref can acquire a steward without a
schema change.

The rule it inherits from [`merge-queue`](merge-queue.md) is the one that keeps
it honest:

> **A steward stores DECISIONS. It never stores a fact the host already
> knows.**

So a window may record *when it opened, when it must close, who holds it, and
who takes over*. It must never record the ref's tip SHA, a deployment's
conclusion, or whether the site is live. Those move, and a stored copy is a
second answer that goes stale on the next push.
`MergeQueueEntrySchema.FORBIDDEN_FACT_KEYS` refuses the tempting ones by name;
a ref window is a sibling object under the same rule, and inherits the
temptation along with it.

## A window is NOT a hold, and the difference is what ends it

[`merge-queue` §"A hold has an EXPIRY and a trigger"](merge-queue.md) is
emphatic, and right: a hold ends on **the observation that lifts it, not a
time**. A hold whose reason you cannot restate from current facts is a habit,
and the measured case cost four clean PRs roughly forty minutes.

A coalescing window looks like a hold and is a different object:

| | **hold** | **coalescing window** |
|---|---|---|
| what it is waiting for | a condition to become true | **more arrivals** |
| what ends it | the observation that lifts it | the clock, *and* a bound |
| why not the other way | a time cannot know the condition cleared | *"no more arrivals"* is only ever observable by waiting |

**That is the whole justification for a window being timed, and it is narrow.**
A window batches writes that are arriving *now* into one write, so the thing it
waits on is the absence of a future event — and absence of a future event has no
observation. A hold waits on a present condition, which does.

Both fail the same way, and the symmetry is the thing to remember: **a hold
that never ends starves, and a window that never closes starves identically.**
So a window carries a hard maximum and closes at it even while pushes keep
arriving. A window that extends on every arrival is not a window, it is an
outage with a timer.

## Coalesce into one write per window

The shape, for a ref with *n* writers arriving in bursts:

1. A write request **does not push**. It records its intent against the ref's
   open window, opening one if none is open.
2. The window closes at its deadline — never later, whatever is still arriving.
3. The steward performs **one** write for the window, composing the requests.
4. Anything that arrived after the close belongs to the next window.

**Composition is only sound when the writes do not contend**, and for a
route-keyed store they do not: `branch-store`'s `keyedBy: "route"` gives each
route one owning generator, so *"nobody authored either side, so the newer
generation wins"* (bean `1j3q`). Two requests for **different** routes compose
by union. Two for the **same** route compose by taking the newer.

**The case that must still be reported:** two same-route requests where
different authors wrote both sides. Route keying says the newer wins, and that
is correct for a regenerated page and wrong for authored content. A steward that
silently takes the newer in that case has deleted the only signal that the two
writers disagree. Report it; do not resolve it.

### Why a GitHub concurrency group is not a window

**Measured here, 2026-09-19** (the comment lives in
`.github/workflows/feature-staging.yml`): `cancel-in-progress: false` governs
the RUNNING job, not the pending one, and **GitHub cancels a PENDING job when a
newer one queues for the same group.** Three staging runs from three different
branches inside 17 seconds gave two cancelled and one run.

So a concurrency group keeps at most one pending run. It is not a queue, and
`cancel-in-progress: false` is not coalescing — it protects the job in flight
and silently drops the intermediate ones. It is worth having for the first
reason and must not be described as the second.

This is the measurement that moved the `gh-pages` fix from a workflow policy to
a steward (bean `xp5j`): the published site was up to **396.2 minutes** behind
`main` across a streak of **24** consecutive cancellations, and no concurrency
setting can coalesce the bursts that caused it.

## The window's four durable fields — because of HANDOVER

A window that lives in one agent's head is lost the moment that agent hands
over, and the next steward then either waits for a window that will never close
or opens a second one and double-pushes. **So the window is committed state, in
the `workflow-state` graph under `beans/workflows/`, not a variable.**

The four fields are `HoldSchema`'s, deliberately — `schemas/merge-queue.ts`
already derived them for the hold case, from the same reasoning
([`bean-blocking`](bean-blocking.md)'s `## Blocked on`): *"a hold with no expiry
cannot be told from an abandoned one."* Read that sentence with "window" in it
and nothing needs re-deriving.

`schemas/ref-window.ts` is the type. Three fields are `HoldSchema`'s verbatim
and the fourth is narrowed:

| field | for a window | without it |
|---|---|---|
| `ref` | the watched ref — `HoldSchema`'s `waitsOn`, narrowed from prose to a declared ref | a reader cannot tell which ref this window is for |
| `since` | when it opened | the deadline cannot be checked, only trusted |
| `expires` | the hard close — **after `since`**, enforced by refine | abandoned and open are indistinguishable |
| `handoff` | who takes it if this steward stops | the next steward cannot tell "mine to close" from "someone else's in flight" |

Two more the type carries for the same reason. `heldBy` says whose window it
is, and `closedAt` says whether the single write happened — **absent means open
OR abandoned, and `expires` is the only thing that tells those apart**, so a
reader must never take an absent `closedAt` for "still collecting".

There is **no `extend`**, and the object is strict, so the field a well-meaning
writer reaches for is refused rather than ignored. That makes "set once, at
open" a property of the type instead of a promise in this paragraph.

**`expires` does the work here that it does for a hold, for the same reason and
with the opposite polarity.** A hold's expiry stops it outliving its
justification; a window's expiry *is* its justification, and also stops it
outliving its burst.

## The two gaps a steward reports rather than fixes

A declaration can disagree with the world in **both** directions, and a sweep
that checks one direction reads as clean while the other is broken:

- a declared writer that no longer writes the ref — the declaration is stale;
- **a workflow that writes the ref and is not declared** — the declaration is
  incomplete, and this is the one a grep over the declaration cannot find,
  because it is looking in the wrong file.

Measured on `gh-pages`, 2026-10-04: its `writers` list held **4**, and parsing
all 35 workflows found **5** — `publish.yml` defaults `publish_branch:
gh-pages` and was unlisted. Adding the line is the symptom; the fix is a gate
comparing declared against measured and failing either way.

And a sweep **prints its denominator**
([`generalise-the-fix`](generalise-the-fix.md) §1.2a): the first pass over
those workflows reported 6 producers because `'gh-pages' in text` matched a
comment in `merge-main.yml`. `parsed 35 of 35` beside the verdict is what makes
the number readable at all.

## What this does not do yet

- **No steward runs over `gh-pages`.** The ref is declared, and bean `xp5j`
  carries the migration; until the five producers write through
  `branch-store`'s route keying there is no window to hold.
- **No steward runs over the `cat/cat-harness/*` refs.** They are seeded and
  declared and, per their declarations, *"not authoritative"* until arc
  `fs43`'s flip. A steward over a ref nobody reads from would be ceremony.
- **Nothing writes a window yet.** `schemas/ref-window.ts` types one and
  `ref-window.test.ts` holds it to the handover rules, but no steward opens one,
  because there is nothing to coalesce until the producers stop pushing
  directly. The type lands first on purpose: a steward written before the state
  it hands over is a steward whose handover is untested.
- **The parity between the window and the hold is behavioural, not structural.**
  `SHARED_LEASE_FIELDS` is the declared list and the test removes each field
  from both schemas and requires both to refuse. An earlier version compared key
  lists through `HoldSchema.def.innerType.shape`; it threw, because a
  `.refine()` does not expose its inner object there — and a parity check that
  silently compared two empty lists would have passed forever (the `dh4f`
  shape).
{% endraw %}
