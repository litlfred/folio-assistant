---
# folio-assistant-2vpn
title: who-iris's top LHS navbar mark is the letter 'W', not an icon — and every harness's top mark must come from one mechanism
status: todo
type: bug
priority: high
created_at: 2026-10-04T18:34:12Z
updated_at: 2026-10-04T18:34:12Z
parent: folio-assistant-yg29
---

Owner, 2026-10-04, in session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi, on being asked to sign GOAL 3 off: *"actually no, who-iris is missing top icon on LHS navbar. investigate why and if also try of other harnesses. all needs to be sconsisisten and consolidated"* — with a screenshot of https://litlfred.github.io/folio-assistant/who-iris/ whose `.fa-nav-head` shows a slate tile with the letter **W** beside "WHO IRIS".

## What is known so far

`cat-harness/scripts/lib/navbar.ts` draws the header's `mark` from the instance's avatar when one is supplied and otherwise falls back to the instance's initial (`i.icon ?? i.label.slice(0, 1).toUpperCase()`). That fallback exists on purpose (#1757, owner 2026-10-01: *"each page needs avatar or atleast letter to be clickable"*); the letter is the floor, not the goal. Related, not duplicates: `0w7q` (viewer rail avatar header), `603s` (one themed section per instance), `p5wm` (GOAL 2).

## Done when

- [ ] the cause for who-iris is stated with file:line evidence — no declaration, a declaration that does not resolve across the mount, or a caller that never passes the mark
- [ ] every harness instance's top mark is measured (avatar, glyph, or letter fallback), and the measurement is recorded here
- [ ] one mechanism supplies the top mark for every harness; who-iris's top navbar shows a real mark on the published page
- [ ] a gate fails when a harness's top mark falls back to its letter, so this cannot recur silently
