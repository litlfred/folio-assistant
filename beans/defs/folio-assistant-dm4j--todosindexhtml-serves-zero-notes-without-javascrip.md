---
# folio-assistant-dm4j
title: todos/index.html serves ZERO notes without JavaScript — the one page most about notes is the only one with no linear floor
status: todo
type: task
priority: normal
created_at: 2026-10-02T17:41:46Z
updated_at: 2026-10-02T18:08:07Z
parent: folio-assistant-o3xy
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


## The owner's correction, 2026-10-02: a todo IS a content node, so R1 already decides this

Owner, on being shown the footer-stub option: *"1 but shouldnt todos be put
into proper Todo content nodes?"*

**They already are, and that is the point.** `todos/todos.json` declares the
graph with the same `ContentDirectory` schema as `beans/beans.json` and
`<instance>.json`; `folio-assistant.json` declares `todos` among its
directories; the kinds are `todo-items`, `todo-feedback`, `boards`,
`board-positions`; each item carries `$schema: folio-todo/v1`; the shape is
`schemas/todo.ts` and the graph `schemas/todo-graph.ts`. They are tagged
against the knowledge graph — roles, processes, tasks, identities, references,
artefacts.

**So the footer is violating a requirement that is already written.** R1:

> The board SHALL render content nodes alongside notes, and a note attached to
> a content node SHALL render **at that node** rather than at an independent
> position.

The footer does the exact inverse: it renders **every** note at **every**
node. Measured — all three todos carry a `targetLabel`, so every one is
attached:

| todo | `targetLabel` | page it is about |
|---|---|---|
| `human-todos-page-says-not-built-yet` | `sec:beans-and-todos-human-todos` | `beans-and-todos` |
| `subagent-roles-for-the-two-judgement-agents` | `sec:publication-workflow-agents-and-system-actors` | `publication-workflow` |
| `what-kick-off-means-for-a-ci-watcher` | `sec:publication-workflow-agents-and-system-actors` | `publication-workflow` |

**Three notes belonging to two pages are being served on ~2,405 pages.**

### What this supersedes

The footer-stub option (stub everywhere + fetch for bodies) is no longer the
best answer, and **the fetch is not needed at all**:

- a page with no attached todo carries **zero** listing bytes — 2,403 of 2,405;
- `beans-and-todos` carries its one todo, `publication-workflow` its two,
  statically, in the served bytes, **at the node the note is about**;
- `todos/` carries the global listing, which fixes this bean;
- a todo attached to nothing has no page to render at, so `todos/` is its
  home — R1's "attached to nothing is an existing declared state".

Main site: 31.0 MB becomes roughly three pages' worth, ~39 KB. With STAGING,
~104 MB becomes negligible. **Better than the stub's ~97 %, with no
JavaScript, no fetch, and a STRONGER no-JS floor than today** — a reader with
JS off gets the note on the page it concerns, which they do not get now
(today they get all three notes on every page, which is noise, and none on
`todos/`, which is the defect).

### Consequence worth stating plainly

**R4's relaxation was not needed for this either.** The premise that the
no-JS floor had to be weakened to shrink this artefact was wrong twice over:
the docs nav was never under R4 (see the note above), and this listing is
shrunk by applying R1 rather than by relaxing R4. Nothing here fetches.

### Gap noticed while checking

The todo graph is **declared but not published as a graph rendering**. Every
instance publishes `<stub>.jsonld` / `.json` / `.schema.json` / `<stub>/` per
`serving-renderings.md`, and `origin/gh-pages` carries no todo `.jsonld` at
all. Not in this bean's scope; recorded so it is not re-discovered.

### Revised done-when

- [ ] `renderTodoListing` is called per page with the todos whose `targetLabel`
      resolves to that page, and with the full set only on `todos/`
- [ ] a page with no attached todo emits NO listing markup (not an empty
      section — `could not determine` and `nothing here` stay distinct)
- [ ] `todos/index.html` serves its listing with JavaScript disabled
- [ ] `first-paint-scheme.e2e.ts` still passes for all eight shells
- [ ] `linear-floor.e2e.ts` asserts the per-page case AND the `todos/` case;
      no test deleted
- [ ] the count on a page is that page's own cardinality, never the global
      total (R6: a count that is not the panel's own cardinality is a number
      somebody will act on)
- [ ] coordinated with #1886, since `footer_custom.html` is its phase C
