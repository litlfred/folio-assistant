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

## Both schemes, now measured — and it is LIGHT ONLY

The first probe could not answer this: it loaded the CSS but not `docs-ui.js`,
and the page's scheme is set by JS via `data-fa-scheme`, so setting
Playwright's `colorScheme` changed nothing and both runs measured light.

Re-measured 2026-09-19 with `data-fa-scheme` set on `<html>` directly, which is
what the JS does:

| scheme | result |
|---|---|
| light | **fails, 2.22:1** (`#a6a6f9` on `#ffffff`) |
| dark | **passes** — no contrast violation |

That is not a detail. `opacity: 0.35` composites the link toward whatever is
behind it, and on a dark background the same operation moves the colour AWAY
from the backdrop rather than toward it. The defect is one scheme's, not the
declaration's in general — which makes the fix roughly half the size, and rules
out the reflex of "set an explicit colour per scheme" for the scheme that is
already correct.

## Done when

An edit link is legible without being loud. Options, cheapest first:

1. **Raise the resting opacity until it passes**, and keep `opacity: 1` on
   hover/focus. One value to change; the smallest possible diff. Cost: it is
   still tuning a number against a threshold, and the next link-colour change
   silently re-breaks it.
2. **Stop using opacity for quietness, in LIGHT only.** Set an explicit
   resting colour that passes at 4.5:1 under
   `:root[data-fa-scheme="light"]`, and leave the base declaration — which
   dark uses and which already passes — alone. Cost: one more scheme-keyed
   rule in a stylesheet that already has several (`.fa-qr-panel`,
   `.fa-sticky-floating`), and the light and dark links then differ in
   mechanism, which somebody must not later "tidy" back into one.
3. **Leave it, and record the exemption.** Defensible only if the link is
   judged decorative — and it is not: it is the site's entire authoring
   affordance, and `#314` established that a control a reader cannot see is a
   control that does not exist.

Recommend 2. Dark is measured and passing, so this touches one scheme and
cannot silently re-break the way a tuned opacity would; `.fa-qr-panel` and
`.fa-sticky-floating` both already establish the per-scheme-colour pattern in
this same stylesheet.

**Do not fix this without looking at a rendered page.** The whole reason the
opacity is there is visual noise beside a heading, and a value that passes axe
while making every heading look cluttered trades one real defect for another.

## APPROVED, 2026-09-19

Owner said yes. Fix it: an explicit resting colour under
`:root[data-fa-scheme="light"]` that passes 4.5:1, leaving the base
declaration — which dark uses and which already passes — alone.

Queued behind the `content-pipeline-navigator` retirement, per the owner's
standing instruction to queue rather than pivot.
