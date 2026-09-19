---
# folio-assistant-y8cm
title: fa-node-edit fails WCAG contrast at 2.22:1 on every node of the docs site
status: todo
type: task
created_at: 2026-09-19T06:10:27Z
updated_at: 2026-09-19T06:10:27Z
---


## Measured, 2026-09-19

axe-core over a harness carrying nothing but `docs/assets/css/docs-ui.css` and
one node edit link exactly as `gen-docs-pages.ts:308` emits it:

```
color-contrast: 2.22 (foreground #a6a6f9, background #ffffff, 9.0pt/12px, normal)
Expected contrast ratio of 4.5:1
```

That is **every `✎ Edit` link on the docs site**, one per node, not a sticky-specific
defect. `gen-docs-pages.ts` emits one for every node it can resolve a target for.

## The cause, and why it was deliberate

`docs/assets/css/docs-ui.css`:

```css
.fa-node-edit {
  float: right;
  margin: -2.2rem 0 0;
  opacity: 0.35;      /* <- this */
}
.fa-node-edit:hover,
.fa-node-edit:focus-visible { opacity: 1; ... }
```

The intent is sound: the link sits pulled up into a heading's line and would be
noisy at full strength, so it stays quiet until hovered or focused. **Quiet was
implemented as `opacity`, which composites the link colour toward the
background and destroys the ratio.** At 0.35 the site's `#7253ed` link colour
renders as `#a6a6f9` on white.

Found while building the sticky board (#336), where the same class lands in a
tool row. That instance is fixed there by overriding the presentation; the
class itself is untouched, because changing it alters the appearance of every
page on the site and that is the owner's call, not a side effect of a sticky PR.

## What is NOT established

**The dark scheme is unmeasured.** Both probe runs reported
`background: #ffffff` — the harness loads the CSS but not `docs-ui.js`, and the
page's scheme is set by JS via `data-fa-scheme`, so setting Playwright's
`colorScheme` changed nothing. Two light-scheme measurements, not one of each.
Do not quote this as "fails in both schemes"; it is unknown in dark, and the
link colour there may composite differently.

## Done when

An edit link is legible without being loud. Options, cheapest first:

1. **Raise the resting opacity until it passes**, and keep `opacity: 1` on
   hover/focus. One value to change; the smallest possible diff. Cost: it is
   still tuning a number against a threshold, and the next link-colour change
   silently re-breaks it.
2. **Stop using opacity for quietness.** Set an explicit resting colour that
   passes at 4.5:1 and let hover/focus brighten it. Cost: two colours to
   maintain per scheme rather than one opacity, and the dark values need the
   measurement above first.
3. **Leave it, and record the exemption.** Defensible only if the link is
   judged decorative — and it is not: it is the site's entire authoring
   affordance, and `#314` established that a control a reader cannot see is a
   control that does not exist.

Recommend 2, after measuring dark. It is the one that cannot silently re-break,
and `.fa-qr-panel` already establishes the per-scheme-colour pattern in this
same stylesheet.

**Do not fix this without looking at a rendered page.** The whole reason the
opacity is there is visual noise beside a heading, and a value that passes axe
while making every heading look cluttered trades one real defect for another.
