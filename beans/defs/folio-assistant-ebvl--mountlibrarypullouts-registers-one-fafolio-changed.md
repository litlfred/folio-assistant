---
# folio-assistant-ebvl
title: mountLibraryPullouts registers one fa:folio-changed listener PER ROW — a leak invisible to a fixture with no re-render
status: in-progress
type: bug
priority: normal
created_at: 2026-09-22T09:12:58Z
updated_at: 2026-09-22T09:13:04Z
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

- [ ] one delegated click listener and one repaint pass, not per-row closures
- [ ] rows decorate themselves when they appear, without the page calling in
- [ ] a spec that re-renders rows and counts what survives
