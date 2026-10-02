---
# folio-assistant-mm36
title: "The library view ALREADY renders the three materialisation states — I recorded it open twice"
status: completed
type: bug
priority: normal
created_at: 2026-09-22T05:50:00Z
updated_at: 2026-09-22T05:50:00Z
parent: folio-assistant-6lb8
---

## The claim that was wrong, and where it went

Twice — in `vhmz` (#828) and again in `jpjt` (#837) — the design record's
"still open" section carried this:

> **Whether the library view distinguishes materialised from
> not-materialised.** The states now have a name and a schema … so the
> question is no longer *is there a distinction* but *does the reader's view
> render it*. Nothing yet says.

**It does render it, and it did before either of those was written.**

## Measured on the LIVE site, not from the source tree

The first look was misleading and is recorded so the next reader does not
repeat it: `who-iris/docs/` holds **three** committed pages, and the badges
appear on only one of them — `kg-to-portal.html`, which is the *legend*. The
catalogue pages are generated at build time, so a source-tree grep says
"almost nowhere" about a thing that is in fact everywhere.

On `origin/gh-pages`, a real collection page:

| | occurrences |
|---|---|
| `state materialized` | 2 |
| `state referenced` | 1 |
| `state unknown` | 0 (none in that collection) |

And `gen-iris-pages.ts` renders all three as distinct badges, with
`stateBadge(k.materialization?.state ?? "unknown")` — **defaulting to
`unknown`, never to `referenced`**, which is the schema's no-default rule
honoured at the render layer rather than only in the type.

The owner's own words are in that file's header, and they are about exactly
this:

> collectiosn w/ nothing greyed out. only 3 materialized assets in KG so one
> or two link works.

with the reasoning beside them: *"a row that says **referenced** reads as
'upstream, not here', which is the actual state and the distinction the whole
catalogue-by-reference model is for."*

## What this does to the ordering question

**It dissolves it.** The open decision was R25's glass *versus* R30's library
half, on R30's warning that building the glass alone ships the two-state model
— closing from the glass with no reachable way back.

The library half is **not missing**. What is missing is one ACTION: the way
from a library row onto the glass — *"need to go back to the library and pull
it out to folio display window"*, the 1 → 3 transition. The view that action
hangs off already exists and already says which items are held.

So the glass and its pull-out action are **one unit of work**, not two
orderable halves, and there is nothing to sequence.

## Summary of Changes

- `docs/architecture/folio-board-requirements.md` — the "still open" section
  no longer claims the library view is unanswered; it records what renders,
  where it was measured, and the source-tree trap.
- `vhmz` — its "not done" note carried the claim. **Left standing with a
  correction beneath it**, not rewritten: a bean edited to be right cannot be
  told from one that was right the first time, which is the `v0jv` lesson.
  (This entry named `jpjt` in its own first draft, which was also wrong —
  `jpjt` never carried the claim. Fixed before pushing, and noted because
  getting the provenance of a correction wrong is the same defect one level
  down.)

## Done when

- [x] the claim is corrected in the design record
- [x] the measurement says WHERE it was taken, since the source tree gives the
      opposite answer
- [x] the ordering question is recorded as dissolved rather than answered
- [x] `jpjt` no longer carries the stale half of it

## Not done

**The pull-out action is not built** — that is `j2if`'s, with the glass.
