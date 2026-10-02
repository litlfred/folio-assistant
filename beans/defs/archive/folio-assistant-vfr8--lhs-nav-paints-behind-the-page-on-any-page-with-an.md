---
# folio-assistant-vfr8
title: LHS NAV PAINTS BEHIND THE PAGE on any page with an auto-expanded figure — a z-index fix scoped to the whole sidebar instead of the one panel
status: completed
type: bug
priority: high
created_at: 2026-09-23T18:21:27Z
updated_at: 2026-09-23T18:24:17Z
parent: folio-assistant-p5wm
---


Owner, 2026-09-23, with a screenshot of `/document-ingestion.html`: *"bad LHS
… and probably similar pages"*. The opened nav and the page content are drawn on
top of each other.

## What it is

The open nav **overlays** the page rather than pushing it — `.side-bar + .main`
keeps `margin-left: var(--fa-nav-collapsed)` at every width, so the opened
16.5rem column sits over content that is still there. That only reads as a nav
if the sidebar paints above `.main`, and the theme is against it: it sets
`.side-bar { z-index: 0 }` while `.main` is `position: relative` with
`z-index: auto` and later in tree order, so `.main` wins the tie.

`.side-bar:hover` answers that with `z-index: 100`, and its comment says exactly
what happens otherwise:

> Without this the sidebar opens BEHIND the page content and reads as a
> rendering bug rather than as a nav.

A second rule, added for an unrelated reason, took it back:

    :root.fa-has-fullwidth .side-bar { z-index: auto; }

At **(0,3,0)** against the hover rule's **(0,2,0)** it wins the cascade in
**every state**, open or closed, so on any page carrying `fa-has-fullwidth` the
nav opened behind the page.

## Measured

`/document-ingestion.html` has 5 figure scopes and **auto-expands 4** of them, so
the class is legitimately set. With the nav open, `elementFromPoint` at x=120
returned page content — `A`, `SPAN.fa-qa-glyph`, `P` — and the nav only inside
the original 56px strip. `crdm-methodology.html` is affected the same way;
`index.html` and `agentic-harness.html` are not, and carry no such class. So the
owner's "probably similar pages" is right and the class is the discriminator.

## The generalisation error

The rule was written to let ONE element escape — a QR panel pinned over a
full-bleed figure. It was applied to **the whole sidebar** rather than the panel,
and in **every state** rather than where the conflict arises. Two axes widened
past what the problem needed, and the second is what reached the nav.

## And it did not achieve its own purpose

Synthesising the beneficiary those rules describe — a
`.fa-qr-panel.fa-qr-in-sidebar[data-open="true"]` on a full-width page — the
panel was **not visible at its own centre** under `auto`:
`DIV.main-content-wrap` painted over it, despite the panel's `z-index: 1200`.
Under `100` it is visible. So `100` is better on **both** counts; it is not a
trade between the nav and the panel.

## A thing found on the way

**Nothing in this repository sets `fa-qr-in-sidebar`.** It occurs 4 times, all in
`docs-ui.css`. The three rules keyed on it cannot currently match, so the escape
they describe is unreachable today and the old value's only live effect was the
defect. Left alone rather than removed — whether that class is still wanted is
the owner's call, not this fix's.

## The value

`100`, because it is measured as sufficient: 100, 1300 and 10001 give an
identical, correct hit-test, and 100 is the number the open-nav rule already
uses. A second, larger constant would be two answers to one question.

## Verified

Rebuilt and driven with Playwright over four pages at 1180×958 — two with
`fa-has-fullwidth`, two without. Every hit test inside the opened column returns
a sidebar element on all four.

The guard is a **text check over the stylesheet**, not a browser one, and the
reason is in `sidebar-strip.test.ts`'s own header: the defect needs the theme's
stacking context, `remote_theme` resolves on the runner, the published site is
refused at this environment's proxy, and every e2e spec here builds a fixture
rather than a Jekyll site. Falsified by reintroducing `auto` — both assertions
fail, and pass again when restored.

## Done when

- [x] The open nav paints above `.main` on a page carrying `fa-has-fullwidth`
- [x] Pages without the class are unchanged
- [x] The QR-panel case the old rule existed for is no worse — measured better
- [x] A guard fails if any rule lowers the sidebar below the open-nav value
- [x] The guard is falsified against the original defect

Parent `p5wm`.
