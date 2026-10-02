---
# folio-assistant-qivo
title: 'SPOKEN COUNT: the glass handle''s accessible name says how many items wait on the folio'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T11:27:15Z
updated_at: 2026-09-23T11:27:15Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-23: "do the spoken count on phone next".

`c132` (#1039) drew the phone handle's `· N` with `::after` and recorded it as Not done: a screen reader reads the handle's `aria-label`, which replaces its content, so the number was visible and silent.

## Done when

- [x] while the glass is closed, the accessible name carries the count: "Pull down your folio — 2 items on it", singular for one, nothing when none
- [x] open, the name is the plain inverse "Put your folio away"
- [x] the same name on every screen (a spoken name has no breakpoint)
- [x] e2e: 5 specs; removing the count fails the 3 that assert it

## Summary of Changes

`labelHandle()` in `mountGlass` is now the one place the handle is named, called from `setOpen` and `countWaiting`. Full e2e 550/550, gates 135/135.
