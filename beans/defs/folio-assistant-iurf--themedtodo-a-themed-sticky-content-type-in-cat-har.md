---
# folio-assistant-iurf
title: 'ThemedTodo: a themed sticky content type in cat-harness, with named CSS tokens instead of hardcoded colours'
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:55:05Z
updated_at: 2026-09-19T11:32:08Z
parent: folio-assistant-8jt6
---

## The ask, owner 2026-09-19 (verbatim)

> todos can have different stylings. it is a ThemedTodo content type that only
> comes in cat-harness, not bootstrap. theme are grumpy-cat, white black (and
> whatever needed accessability), a couple pale sages and dusty carolina blues,
> in a couple of fading gradations. in a sticky panel you can [+] a new sicky
> (plu on a sticky icon). themes should be transltable. user can select stikky
> theme. default is one of the sages (to match the staging bar). themes need
> all three layouts to be defined to be conisdered valid.
>
> try to use named css assets in KG rather than hardcoded colors so themeing is
> easier... there should be a theemes css under an "docs/assets/ dir or so that
> is referenable.

## What exists today — measured 2026-09-19 on `main` at `ed3cf127`

- **`Todo` is already a content type**: `schemas/todo.ts` and
  `schemas/todo-graph.ts`. `todos/` is a declared graph (`todos/todos.json`,
  nodes `items` and `feedback`), separate from `cat-harness`.
- **A sticky panel already ships** — `tests/sticky-todos.e2e.ts` covers it, and
  it is built by `scripts/gen-docs-pages.ts` into
  `docs/folio-assistant/assets/{css/docs-ui.css, js/docs-ui.js}`.
- **No theme concept exists anywhere.** `grep -rln theme schemas/*.ts` returns
  nothing. This is greenfield.
- **The styling substrate is the problem the owner named.** `docs-ui.css`
  carries **106 hardcoded hex colours** against **22 CSS custom properties**.
  Tokenising is not a nicety here; with 106 literals a theme switch is a
  find-and-replace, which is how the wrong shade survives in one state.
- **The assets path has MOVED.** The ask says `docs/assets/`; it is now
  `docs/folio-assistant/assets/`. A sibling relocated the tree this morning and
  it broke seven links in `AGENTS.md` alone (bean `v8gh`).

## Two readings I want confirmed before building

**1. "only comes in cat-harness, not bootstrap."** I read this as a LAYER
statement — the harness layer ships themes, a bare bootstrap instance does not —
rather than as "put the nodes in the `skills/` directory". `todos/` is already
its own declared graph, and moving todo content under `cat-harness` would
conflate the work-plan graph with the knowledge graph. **Proposed:** the
ThemedTodo *type and its themes* are harness-layer nodes; the *todos* stay in
the `todos` graph and reference a theme by id. Say if you meant the stronger
thing.

**2. "all three layouts."** The only three-layout precedent in this repo is
`harness.json` `images[].layout` — **`laptop`, `mobile`, `card`** — where each
carries its own `textRegion` because the crop differs. That maps cleanly onto a
sticky (a phone sticky is not a laptop sticky scaled down), so I am taking those
three unless told otherwise. The validity rule then mirrors the images one: a
theme missing any of the three is **invalid, not degraded** — no silent
fallback, because a theme that renders wrong on a phone is worse than one that
refuses to load.

## Proposed shape

- **`schemas/themed-todo.ts`** — `ThemedTodo` extends `Todo` with a `theme` id.
  A `Theme` node declares: id, translatable display name, the three layouts,
  and its **token values** — never raw colours at the use site.
- **Themes to ship:** `grumpy-cat`; a **high-contrast** pair (white/black) that
  is the accessibility answer rather than a decorative one; a couple of **pale
  sages**; a couple of **dusty Carolina blues**; each with a fading gradation.
  **Default: a sage**, chosen to match the staging bar — so the default has to
  be picked against the live staging banner, not from a palette in isolation.
- **`docs/folio-assistant/assets/css/themes.css`** — one referenceable
  stylesheet defining the tokens per theme. `docs-ui.css` consumes tokens only.
- **Translatable**: theme display names go through the existing `.pot`/`.po`
  pipeline (`translations/`), like every other user-facing string. The token
  VALUES are not translatable; the names are.
- **`[+]` affordance**: a plus on a sticky icon in the panel, adding a new
  sticky. Owner can select the theme.

## Done when

- [ ] the two readings above are confirmed or corrected
- [ ] `ThemedTodo` + `Theme` schemas exist, with the three-layout validity rule
      enforced and tested (a theme missing one layout FAILS, and the test proves
      the check can fire)
- [ ] `themes.css` exists under `docs/folio-assistant/assets/` and is
      referenceable; the sticky panel reads tokens, not literals
- [ ] a measured reduction in hardcoded colours in the sticky path, quoted with
      the command and date — not an assertion that it improved
- [ ] theme names extracted into the `.pot` and present in every locale stub
- [ ] default sage verified against the staging bar ON THE STAGING SITE, since
      that is the only place the two appear together
- [ ] `[+]` adds a sticky, covered by the existing e2e spec

## Not doing unless asked

Retokenising all 106 colours in `docs-ui.css`. Only the sticky path needs it for
this bean; a full sweep is its own change and would bury this one.
