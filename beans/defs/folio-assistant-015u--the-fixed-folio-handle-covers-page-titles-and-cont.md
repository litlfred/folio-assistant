---
# folio-assistant-015u
title: The fixed '▾ Folio' handle covers page titles and content
status: completed
type: bug
priority: normal
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-24T17:45:58Z
parent: folio-assistant-4ccr
---

The Folio glass handle is fixed at the top and overlaps each page's heading, and at 390 px the glass's own first controls. Reserve space for it, or move it out of the reading flow.

Observed on: `external-schemas`, `folio`, `library`, `navbar`, `tools` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.

## Done when

- [x] No page's first content sits under the handle, at 1280 or 390 px
- [x] A test fails if it comes back

## Summary of Changes — 2026-09-24

**Measured** on a local build, by the text under the handle (range rects, not
element boxes) and by controls whose centre it covers:

| page | before | after |
|---|---|---|
| themed pages (home, tools, external-schemas, a process page), both widths | clear: the handle sits in the header bar's empty middle | clear |
| folio / library viewers, 390 px | the page's `h1` | clear |
| who-iris replica | its **"INGESTED COPY — not WHO"** banner (390 px), and a link centred under the handle (1280 px) | clear |
| open glass, 390 px (the bean's second claim) | already clear, fixed by `c132`'s phone layout | clear |

**Fix:** `docs-ui.css` reserves the handle's band on any page that shows the
handle and has no theme header: `body:has(> .fa-glass-handle):not(:has(.main-header))
{ padding-top: 3.5rem }`. It is selected by what the page lacks, so a future
page that mounts the glass without the theme gets the band too.

**Test:** `glass.e2e.ts` checks that the handle is above the fixture's `h1` at
1280 and 390 px. Both checks failed with the rule disabled and pass with it.

