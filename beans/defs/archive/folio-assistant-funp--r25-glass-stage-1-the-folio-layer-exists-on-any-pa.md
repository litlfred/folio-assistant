---
# folio-assistant-funp
title: "R25 glass stage 1: the folio layer exists on ANY page, pulled down and put away from the keyboard"
status: completed
type: feature
priority: normal
created_at: 2026-09-22T06:10:00Z
updated_at: 2026-09-22T06:10:00Z
parent: folio-assistant-6lb8
---

R25: *"the user in visualization should be able to pull down their folio"*,
and R30's glass — *"pulling down folio panel = glass/window on which stikcy
notes/avatrs of materialized assets … are visualized."*

## The defect was procedural, not structural

The layer already existed, already on `document.body`, already
`position: fixed; inset: 0` — structurally a glass. It was **created inside
`mountTodoBoard`**, after two guards that belong to a board and not to a
folio:

    mountTodoStickies -> fetchTodoIndex -> if (items === null) return
    mountTodoBoard    -> if (!main) return null      // #main-content / main

So the reader's folio existed only on a page that had a just-the-docs main
region AND a readable todo index. That is exactly why `jpjt` measured
`docs-ui.js` 0 / boards 0 / tiles 0 on `who-iris` and concluded F8/F9 was
blocked here. **A folio that only exists where a board mounted is not a folio
a reader carries between libraries.**

`mountGlass()` hoists it: called from `init` unconditionally and again by
`mountTodoBoard`, idempotent, returning the SAME layer the board floats cards
into — one surface, because two would agree only by accident.

## Falsified, and the first attempt at falsifying did not count

Reverting the independent mount fails **8 of 8** specs: the handle never
appears and every `beforeEach` times out. Restored, 8 pass.

**The first mutation run was killed by my own `timeout` before it reported**,
and a killed run is not a red run. Re-run with `--retries=0` and a short
per-test timeout, which is what produced the 8/8 above. A falsification you
did not watch fail is not a falsification.

## The a11y failure this shipped and then fixed

`gates --all` went red on four dark-mode views: **1.39:1, `#000000` on
`#27262b`**.

The handle sets an explicit `background` and had `color: inherit`. It is
appended to `document.body`, so **there is nothing above it to inherit from
but the document default** — black, on the dark fixture. `23bc` again, and
being body-level is what makes it certain rather than likely: a sibling
control inside `.main-content` inherits a foreground that suits the page, and
this one cannot.

Fixed with an explicit `#e8eaed`, **12.46:1 on `#27262b`, computed rather
than eyeballed**. 38 a11y specs pass.

## Summary of Changes

- `docs-ui.js` — `mountGlass()`, called from `init` before `mountTodoStickies`
  and reused by `mountTodoBoard`; the handle (a `<button>`, so the keyboard
  path and focus ring are the browser's); open/close, Escape, focus return.
- `docs-ui.css` — `[data-fa-glass="open"]` flips `pointer-events` and paints a
  translucent backdrop; the sheet is always present so `:empty` cannot hide an
  open-but-empty glass; the handle's z-index clears the layer's.
- `test/glass.e2e.ts` — 8 specs against a **replica-shaped fixture**: no
  `<main>`, no `.main-content`, no sidebar header, and a 404 on the todo
  index. Every absence is asserted, so the fixture cannot drift into being a
  just-the-docs page and take the test's meaning with it.

## Done when

- [x] the glass exists on a page with no main region and no todo index
- [x] a control pulls it down and puts it away, from the keyboard alone
- [x] `l4zi`: the inverse is the same control, and it stays reachable while
      open — asserted by measuring the boxes, not reading the declarations
- [x] Escape closes it and returns focus to the handle
- [x] closed, it passes pointers through — asserted on the computed value,
      because a transparent full-viewport div that captured clicks would break
      every page invisibly
- [x] an empty glass still comes down and says so — a state, not a failure
- [x] falsified by mutation, watched to completion

## Not done — stage 2

**The pull-out action from a library row (1 → 3) and close returning to 2.**
The glass is a surface now; what it holds is the next unit. R30's three states
cannot be exercised until a reader can put something on it from the library,
and the library view already renders which items are held (`mm36`).

**`jpjt`'s mount fragment.** It rides after this, not with it: the glass had
to exist before a fragment that mounts it could have a consumer.
