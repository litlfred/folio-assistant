---
# folio-assistant-10uc
title: 'STREAM 2/3: GOAL 2 — the rendered surface: navbar, visualisers, stickies (p5wm, 39 open beans)'
status: in-progress
type: task
priority: high
created_at: 2026-09-22T18:09:11Z
updated_at: 2026-09-22T18:09:11Z
parent: folio-assistant-p5wm
---

## What this is

Stream 2 of 3 in the 2026-09-22 consolidation (see the sibling claims under
`vuip` and `yg29` for the stall measurement that prompted it). It owns **GOAL 2
(`p5wm`) — 39 open beans**, the largest single group in the store.

This is the stream where the artefact a reader judges actually appears: the LHS
navbar, the visualisers, the stickies, avatars and themes.

## What this stream owns

**Beans** — `p5wm` (39 open), including the `6lb8` folio-board epic and the
`o3xy` UI & accessibility epic nested under it.

**`p5wm`'s stated path is STALE, and this claim carries the re-measurement
rather than reproducing it.** Measured 2026-09-22T18:15Z against the store,
after `check:stale-paths` failed this very bean for quoting it:

`p5wm` names an eight-step path. **Four of those steps are `completed`** —
`2krx`, `ivfw`, `5y4b`, `pb04` — **and so are both side-conditions** it names,
`gjli` (the standing accessibility gate) and `1hvo` (the declaration layer).
The chain is not reproduced here on purpose: a chain through finished work
reads to the next agent as work still to do, which is what this gate exists to
catch and what it caught in the first draft of this very bean.

What actually remains, in order:

| bean | status | |
|---|---|---|
| `b5f0` | todo | **first, and not a UI bean** — it holds the ruling that settles `603s`'s own first open question, which file marks an instance |
| `603s` | in-progress | the LHS navbar as one themed section per instance |
| `hfkl` | in-progress | bootstrap is the exception |
| `6lb8` | in-progress | the folio board — its persistence half is blocked on the owner |
| `supn` | todo | harness cards become todos |

**Two of `p5wm`'s own rationales died with the beans they cite.** It calls
`hfkl` *"the cheapest real win"* because it unblocks `2krx`, *"which otherwise
fires 19 findings on day one"* — `2krx` is **completed**, so that argument is
spent and `hfkl` now needs a reason of its own. And *"stickies that move around
is `ivfw` + `5y4b`, and they must land together"* describes two beans that have
**both landed**; what remains of that thread is `6lb8`'s persistence question
alone.

Do not repair `p5wm` itself — `check:stale-paths` lists it as **outstanding**,
and an outstanding entry is repaired by the bean's OWNER, not by whoever reads
it. Put the correction to the owner.

**Pull requests on this surface:**

| PR | state | note |
|---|---|---|
| #955 | clean, **draft** | `624f` round 1 — sticky square in the dock is built and verified; requirement 2 (the art scrolls with the words) is **measured and deliberately not built**, with its spec removed rather than left as a vacuous `test.skip`. Decide whether round 1 ships alone. |
| #229 | stale since 09-18 | staging translation preview |

## First three moves

1. **`b5f0`** — the ruling that settles `603s`'s first open question. The path
   above is already re-measured, so start here rather than re-deriving it; but
   re-check anything you are about to spend a session on, because `main` moves
   and this measurement is only as old as its timestamp.
2. **`hfkl`, or argue it down.** `p5wm` called it the cheapest win because it
   unblocks `2krx` — and `2krx` is done. Either give it a live reason or take
   `603s` next and say why.
3. **#955: ship round 1 or hold it.** Its own body argues requirement 2 needs a
   mechanism change (the card does not scroll at all: `clientHeight ===
   scrollHeight === 318` on a 320 card, and the `overflow: hidden` above it is
   load-bearing). Shipping round 1 alone is defensible; say which and why.

## Blocked on the owner — do not guess these

`p5wm` records six: `yj32` (*"i wanted bootsrap/ harness/ etc as todos, not
landing page info"*, and what the writable store is), `6lb8` (the board's
persistence — a position is state, and `todos/` is committed, so two sessions
moving one note is a merge conflict in a generated file), `v1hw` and `jbx2`
(which write path), `h32d`, `g196`. Plus three that need somebody to **look at a
deployed page**: `alox`, `rptk`, and `o3xy` as a class.

A rendered page cannot be assessed from a description of it. Where this stream
needs eyes, it publishes a preview and asks — it does not substitute its own
reading.

## Not this stream

GOAL 1 / the KG (stream 1) and who-iris (stream 3). Note `yg29` **depends on this
stream**: who-iris is shown *through* a navbar section at
`<baseurl>/who-iris/...`, so `o7eq`'s URL rule is stream 3's delivery mechanism.
Coordinate on `o7eq` rather than deciding it unilaterally.

## Done when

- [x] `p5wm`'s critical path re-verified against the store (2026-09-22T18:15Z:
      four of eight steps and both side-conditions already `completed`)
- [ ] The correction put to the owner — `p5wm` itself is repaired by its owner,
      not by this stream
- [ ] `b5f0` ruling recorded and `603s`'s first open question closed
- [ ] `hfkl` landed, `2krx`'s 19 day-one findings not fired
- [ ] #955 shipped or held with a stated reason
- [ ] The six owner-blocked beans asked as questions the owner can answer by
      selecting, with a preview URL where one is needed
