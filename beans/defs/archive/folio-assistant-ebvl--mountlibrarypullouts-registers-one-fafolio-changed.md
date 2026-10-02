---
# folio-assistant-ebvl
title: mountLibraryPullouts registers one fa:folio-changed listener PER ROW — a leak invisible to a fixture with no re-render
status: completed
type: bug
priority: normal
created_at: 2026-09-22T09:12:58Z
updated_at: 2026-09-22T10:02:36Z
parent: folio-assistant-6lb8
---

Found 2026-09-22 while wiring gen-library-viz, immediately after #890 merged.

`mountLibraryPullouts` does this per row:

    document.addEventListener("fa:folio-changed", paint);

With the 18 specs' static fixture rows that is correct and bounded. The real
library view renders rows client-side and REPLACES THEM WHOLESALE on every
filter keystroke and every sort:

    $("listing").innerHTML = h + "</tbody></table>";

So each re-render destroys the rows and leaves their listeners attached to
`document`, closing over detached elements. Unbounded in the number of
keystrokes.

**My own specs could not have caught it.** The fixture has no re-render, so
the shape that makes it a leak never occurs. That is the same class as the
vacuous assertions found three times this session: the test was written
against the case the author had in mind.

## Done when

- [x] one delegated click listener and one repaint pass, not per-row closures
- [x] rows decorate themselves when they appear, without the page calling in
- [x] a spec that re-renders rows and counts what survives

## Summary of changes

Merged in #904 (`adbc37833d`).

Delegation replaces the per-row closures, so there is no per-row registration
left to leak — the fix is structural rather than a rule to remember when
adding the next control. Rows decorate themselves through a
`MutationObserver`, so the generated page emits three attributes and calls
nothing.

**A SECOND DEFECT WAS FOUND WHILE FIXING THE FIRST, and it was found by a
hang rather than by reading.** `paintLibraryRows` appends a slot and writes
`textContent`; both are `childList` mutations, so the observer fired on its
own work and never returned. The spec run had to be killed. Fixed by
disconnecting around the paint and reconnecting after — the only form that
cannot loop regardless of what the paint does next. `fa:folio-changed` goes
through the same guard, or the paint's own mutations reach a connected
observer.

**A third, found by reading the diff:** a `<span>` appended to a `<tr>` is
hoisted out of the table by the browser, so the control would have vanished
while the markup looked right. It goes into the last `<td>`.

## What this bean is really about

The leak was not carelessness. #890's eighteen specs all passed, and they
could not have failed: a fixture with no re-render never exhibits the shape
that makes a per-row listener a leak. The test was written against the case
its author had in mind.

That is the session's recurring failure and this is the clearest instance —
five assertions that would have passed for the wrong reason, each invisible
until deliberately attacked. The countermeasure that actually worked was not
care but **falsification**: break the thing the test claims to protect, and
see whether the test notices.

Five specs now cover the shape #890 lacked, including a wholesale re-render
and a ten-rebuild count, plus five driving the page the generator actually
wrote.
