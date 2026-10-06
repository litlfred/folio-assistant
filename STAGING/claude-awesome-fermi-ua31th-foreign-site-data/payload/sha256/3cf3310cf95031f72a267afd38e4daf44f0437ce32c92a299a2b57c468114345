---
# folio-assistant-vglq
title: 'FOREIGN-SITE DATA SCOPE (#2263 follow-up): translation and fsh-guts figures on a folio''s site describe the folio'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-06T12:14:15Z
updated_at: 2026-10-06T12:14:31Z
parent: folio-assistant-uhkv
---

Follow-up to #2263 / PR #2265 (bean ky3r), which left two defects of the same class open:

1. _data/translation-qa.json and _data/translations.json are copied into a folio's shell by compose-docs --shell, so smart-trust pages show the PLATFORM's 'Swept 49/689' translation badge.
2. The fsh-guts icon on a folio site fetches its count from the folio's own site, where no fsh-guts document exists, and shows '?'.

Rule (#2265): on a folio's site a figure describes the folio or is not shown with someone else's number. Absent is not zero; an inert control says why. Extend lib/foreign-site-scope.ts and the compose-docs --shell scoping; no second mechanism.

## Done when
- [ ] shell leaves out the platform's translation data; the sweep badge says why instead of 'Swept 49/689' or 'not run'
- [ ] fsh-guts icon on a folio site is inert with a reason, no '?'
- [ ] foreign-site-scope.test.ts asserts both
- [ ] harness-tiles rule table carries the rows
- [ ] smart-trust rebuilt locally, before/after screenshots

## Collision review, 2026-10-06 (coordinate.md §Starting new work)

Files this touches: cat-harness/scripts/lib/foreign-site-scope.ts, cat-harness/scripts/compose-docs.ts, cat-harness/docs/_includes/head_custom.html, cat-harness/docs/assets/js/navbar-row.js, cat-harness/docs/assets/js/docs-ui.js (sweep badge only, ~line 10366), cat-harness/scripts/tests/foreign-site-scope.test.ts, cat-harness/skills/ui/ui-core/harness-tiles.md.

Step 1, open PRs (11, files intersected via REST and git diff):
- #2276 (claude/awesome-fermi-ua31th-ig-diagram-zoom, diagram pan/zoom): docs-ui.js hunks at 9741-10115 and docs-ui.css. My docs-ui.js hunk is the translation sweep badge at ~10366, outside every hunk; I do not touch its diagram code or docs-ui.css.
- #2277 (claude/bold-brahmagupta-c8eoku, replica locale band): docs-ui.js hunks at 5620-5660. Disjoint.
- #2189: _data/translations.json (regenerated data). I do not edit that file, only stop copying it into a shell. Not a collision.
- No other open PR touches foreign-site-scope, compose-docs, head_custom, navbar-row, harness-tiles or the IG-repo template.
Step 2, in-progress beans searched for 'foreign', 'translation', 'fsh-guts': ky3r (#2265, merged; this is its reported follow-up), gkv6 (completed). No overlap.
Steps 3-4: overlap is line-disjoint in one shared file; no ordering needed. #2276 is a sibling from the same session family and was told not to be touched.
