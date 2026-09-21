---
# folio-assistant-0jtj
title: 'LINEAR FLOOR: the tile listing is the artefact and the board is an overlay over it'
status: todo
type: task
priority: high
created_at: 2026-09-20T21:46:31Z
updated_at: 2026-09-20T21:46:31Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R4 + R8. Unit 5 of 10.

The owner: *"this dymanic moving state is overlayed, its an 'extra'. on stndard
folio just simple tile based listing."* and, from the original ask, *"but ALWAYS
collapsable to linearly rendablee/just the docs."*

**This is an accessibility floor, not a fallback.** A board that cannot be read
linearly cannot be read by a screen reader, printed, or translated — and this
instance's declared interaction profile is **low-dexterity**, which is why the
existing Pin control is a button rather than a drag.

The sharpening: the floor is not merely "linear", it is a **simple tile-based
listing**, and the board is an overlay ON TOP of it. So the tile listing is the
artefact and the board is the extra — which also means the listing must be correct
with **no JavaScript at all**, not merely correct when the board is toggled off.

## Done when

- [ ] with JS disabled the page renders every note and its attachment in document order
- [ ] asserted against the SERVED HTML, not against a DOM the board built
- [ ] the board mounts as an overlay over that listing rather than replacing it
- [ ] every board action reachable from the keyboard; drag is an accelerator only
