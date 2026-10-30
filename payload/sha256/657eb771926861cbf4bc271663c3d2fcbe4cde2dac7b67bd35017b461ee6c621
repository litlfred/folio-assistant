---
# folio-assistant-607f
$schema: bean/1.0.0
title: 'UPSTREAM PIN WATCHDOG: red since 2026-10-20 on an undetermined pin, so #1481 has gone stale'
status: todo
type: bug
priority: normal
created_at: 2026-10-30T11:55:00Z
updated_at: 2026-10-30T11:55:00Z
parent: folio-assistant-rwmf
---

`upstream-pins.yml` failed on its 2026-10-20 and 2026-10-27 runs at the step
"Refuse to report success on an undetermined pin". Because of that, issue
[#1481](https://github.com/litlfred/folio-assistant/issues/1481), which the job edits
in place, was last updated 2026-10-13 and no longer shows the current state.

Likely cause: a pinned dependency moved during the repo split, so the check can't
resolve it. Find which pin reads as `unknown`, fix its declaration in
`upstream-pins.json`, and get the watchdog green.

Not in scope: moving any pin (Bun 1.3.14 → 1.4.x is the `upstream-version-adoption`
process and a person's decision).

## Done when

- [ ] The watchdog run is green.
- [ ] #1481's body shows this week's state.
