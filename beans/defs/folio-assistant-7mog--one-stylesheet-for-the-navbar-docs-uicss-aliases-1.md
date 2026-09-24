---
# folio-assistant-7mog
title: 'ONE stylesheet for the navbar: docs-ui.css aliases 12 rules that navbarCss() already owns'
status: todo
parent: folio-assistant-p5wm
type: task
created_at: 2026-09-24T17:39:39Z
updated_at: 2026-09-24T17:39:39Z
---

The owner chose "1 2" on 2026-09-24: land the low-risk version first, then single-source the CSS. This is the 2.

## What shipped as 1 (PR #1264)

`nav_footer_custom.html` is a single `{% include %}` and composes no markup.
The sidebar's navbar is RENDERED by `lib/navbar.ts`. To keep the look
byte-for-byte, `docs-ui.css` gained the renderer's class names as ADDITIONAL
SELECTORS on rules it already had — one set of declarations, two vocabularies:

    .fa-harness-tab__label,
    .side-bar .fa-nav-label { ... }

Twelve rules, plus `.site-footer:has(.fa-nav-in)` beside `:has(.fa-nav-home)`.

## Why that is not the end state

**`navbarCss()` already declares all of it**, scoped under `.fa-nav`, and the
rail uses that. So the same visual facts are stated twice: once in 111 lines of
`navbarCss()` and once in the 185 sidebar lines of `docs-ui.css`. They were
hand-aligned, which is why the switch rendered identically — but hand-aligned
is exactly the state `sjic` says is not "one navbar".

The aliasing makes the duplication VISIBLE (each pair is now one rule with two
selectors) rather than removing it. That was the point of doing it first: it is
a smaller, verifiable step, and it leaves the old rules removable in one go.

## The shape of the fix

`navbarCss()` takes a declared SCOPE — `.fa-nav` for the rail, `.side-bar` for
the sidebar — and a generator writes the sidebar-scoped copy to a stylesheet
the site loads. Then the 185 lines go. The container rule
(`position:fixed;width:...`) is the exception: the theme owns `.side-bar`'s
geometry, so that rule is excluded rather than re-scoped, which is a THIRD
declared difference beside `hrefs`, `graphs` and `openControl`.

## What makes this risky, stated before anyone starts

1,283 pages. And `preview:site` applies no site-wide default layout where CI
does, so a local render UNDER-REPRESENTS the published one — a CSS migration
verified only locally is verified against a weaker rendering. Verify on the
staging preview, not just the local build.

## Done when

- [ ] `navbarCss()` takes a declared scope; the rail's output is byte-unchanged
- [ ] the sidebar-scoped stylesheet is generated and gated by a `--check`
- [ ] the 12 aliases and the 185 hand-written sidebar lines are gone
- [ ] before/after RENDERS match on the staging preview, not only locally
- [ ] `bun run gates` green
