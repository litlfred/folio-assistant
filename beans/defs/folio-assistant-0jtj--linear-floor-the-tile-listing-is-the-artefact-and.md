---
# folio-assistant-0jtj
title: 'LINEAR FLOOR: the tile listing is the artefact and the board is an overlay over it'
status: completed
type: task
priority: high
created_at: 2026-09-20T21:46:31Z
updated_at: 2026-09-21T10:51:15Z
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

- [x] with JS disabled the page renders every note and its attachment in document order
- [x] asserted against the SERVED HTML, not against a DOM the board built
- [x] the board mounts as an overlay over that listing rather than replacing it
- [x] every board action reachable from the keyboard — for the actions that EXIST.
      Drag does not exist yet; it is `le8b`'s, and that bean carries the accelerator
      rule. Ticking this as though drag had been checked would be a claim about
      code nobody has written.

## What landed, 2026-09-21

**The defect was bigger than the bean's wording implied, and the wording was
right to be suspicious.** The floor did not exist at all on an ordinary page:
`docs-ui.js` read `meta[name="fa-todo-src"]`, fetched `assets/todos/index.json`
and built every sticky in the DOM. JavaScript off meant no note, no count and
no hint that notes existed. So this was a feature to build, not a test to add —
and the falsifier named in the opening brief is the one that fired.

- `scripts/todo-listing.ts` — the renderer. One function, escaping every
  interpolated value, never sorting, and taking the attachment href as a
  parameter because `relative_url` is Jekyll's and means nothing to a static
  server.
- `gen-docs-pages.ts` emits `_includes/generated/todo-listing.html` from the
  **same `items` array** that produces the JSON, three lines apart — which is
  the only reason two artefacts about one fact are acceptable: neither is read
  to produce the other. Two are needed because Jekyll will not read `assets/`
  as data and a browser cannot fetch `_includes/`.
- `footer_custom.html` includes it on EVERY page. The board is launched from
  every page, so a floor that exists on some of them is not a floor.
- `docs-ui.js` moves the listing into a `<details>` when the board mounts —
  moved rather than cloned, because two copies is two answers to "how many are
  open" and a screen reader reads both. Print is handled on `beforeprint`
  rather than in `@media print`, because a closed `<details>` cannot be
  revealed by a stylesheet in Chromium and a print rule would look like it
  worked.
- Tests: `scripts/tests/todo-listing.test.ts` (11) for what is emitted, and
  `test/linear-floor.e2e.ts` (9) — five of them in a browser context with
  `javaScriptEnabled: false`, including one that asserts the board did NOT run,
  so the order assertion cannot pass because the board happened to agree.

`bun run gates` — 83/83.
