---
# folio-assistant-dm4j
title: todos/index.html serves ZERO notes without JavaScript — the one page most about notes is the only one with no linear floor
status: todo
type: task
priority: normal
created_at: 2026-10-02T17:41:46Z
updated_at: 2026-10-02T17:42:06Z
---

Found while measuring the linear floor for `qj9a`, 2026-10-02, on
`origin/gh-pages`. Parent topic: `qj9a`; the floor itself is bean `0jtj`.

## The defect

`todos/index.html` — the dedicated notes dashboard — carries **no
`fa-todo-listing` section and zero `fa-todo-listing-item` elements** in its
served bytes. It is one of the eight generated JS shells in
`cat-harness/test/first-paint-scheme.e2e.ts`, whose own note says they "do not
carry the snippet, deliberately".

Meanwhile `footer_custom.html:40` includes the full 12,876-byte listing into
every *other* Jekyll page. So:

| page | notes served without JavaScript |
|---|---|
| `accessibility.html` | all 3 |
| `architecture.html` | all 3 |
| any `reference/` page | all 3 |
| **`todos/index.html`** | **none** |

**The one page most about notes is the only page with no linear floor.**

## Why it matters rather than being a curiosity

This is bean `0jtj`'s defect, still live, at the destination. `0jtj` was opened
because with JavaScript off a reader got *"no note, no count, no hint that
notes exist"*, and the remedy was a served listing. The remedy was applied to
every page the board can launch from, and **not** to the page named for the
subject — so a reader who follows a "notes" link to the notes page lands on the
one page that tells them nothing.

It also inverts the `footer_custom.html` rationale. That comment argues
per-page inclusion is needed because "the board is launched from every page, so
a floor that exists on some of them is not a floor". By that reasoning the
notes dashboard is the LAST page that should lack one.

## Measured

- `todos/index.html`: 86,452 bytes served, `fa-todo-listing-item` count **0**,
  `id="fa-todo-listing"` count **0**.
- Contrast `accessibility.html`: 246,026 bytes, listing section 12,876 bytes,
  3 items.
- The data is already published at `assets/todos/index.json` (18,269 bytes),
  which is what the shell fetches.

## Done when

- [ ] `todos/index.html` serves the notes listing in its own bytes, readable
      with JavaScript disabled
- [ ] It keeps first-painting dark from CSS alone — `first-paint-scheme.e2e.ts`
      asserts this for all eight shells with JS off in a light-preferring
      browser, so the fix must not disturb the first-paint style
- [ ] A test asserts it, with JS off, the way `linear-floor.e2e.ts` does for an
      ordinary page

## Note on sequencing

Do NOT fix this by hand-editing a generated page. The listing comes from
`renderTodoListing` in `cat-harness/scripts/todo-listing.ts`, which is the one
function both the include and the e2e read, deliberately, so that "the test and
the site cannot disagree about any of it". The shell is written by
`gen-docs-pages.ts`.

If `qj9a`'s footer-stub option is taken, this bean is subsumed by it: that
option moves the full listing INTO `todos/index.html` precisely because it is
missing here. Check before doing both.
