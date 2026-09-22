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

### The path as this claim was written — SUPERSEDED 2026-09-22

This claim was created quoting `p5wm`'s eight-step path. Re-verified against the
store on 2026-09-22 as the claim's own first instruction required, and **four of
its steps were already finished**: `2krx`, `ivfw`, `5y4b` and `pb04` — plus
`1hvo`, the declaration layer, and `gjli`, which is a standing rule rather than a
step. `p5wm` now carries the repair and the withdrawal reasons.

**The live path is `b5f0` → `603s` → `hfkl` → `6lb8` → `supn`.** Five steps.

Two notes this claim carried, both now corrected:

- **`b5f0` is not a UI bean** — still true, and better than stated. It holds the
  ruling that settles `603s`'s first open question, which file marks an instance,
  and **that ruling already exists**: the owner ruled REPLACE, recorded in
  `hfkl`'s 2026-09-21 trailer and propagated to both beans on 2026-09-22.
- **`hfkl` is the cheapest real win** — the win is real, the reason given was
  not. *"It unblocks `2krx`, which otherwise fires 19 findings on day one"* is
  void: `2krx` has been `completed` since 2026-09-20, and it shipped *with*
  bootstrap's exemption as declared data, so those findings cannot fire.

**Pull requests on this surface:**

| PR | state | note |
|---|---|---|
| #955 | clean, **draft** | `624f` round 1 — sticky square in the dock is built and verified; requirement 2 (the art scrolls with the words) is **measured and deliberately not built**, with its spec removed rather than left as a vacuous `test.skip`. Decide whether round 1 ships alone. |
| #229 | stale since 09-18 | staging translation preview |

## First three moves

1. **Re-verify the critical path before acting on it.** Bean `k59d` records that
   `p5wm` specifically advertises blockers that are already complete. Do this
   before picking a bean off the path.
2. **`b5f0` then `hfkl`** — the ruling, then the cheapest unblock.
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

- [x] `p5wm`'s critical path re-verified against the store, stale blockers
      withdrawn with their reasons — 2026-09-22. `check:stale-paths` reports the
      `p5wm:chain` baseline entry as no longer matching; removed from
      `stale-paths-baseline.json`, which is how that file shrinks rather than
      fossilises
- [ ] `b5f0` ruling recorded and `603s`'s first open question closed
- [ ] `hfkl` landed, `2krx`'s 19 day-one findings not fired
- [ ] #955 shipped or held with a stated reason
- [ ] The six owner-blocked beans asked as questions the owner can answer by
      selecting, with a preview URL where one is needed
