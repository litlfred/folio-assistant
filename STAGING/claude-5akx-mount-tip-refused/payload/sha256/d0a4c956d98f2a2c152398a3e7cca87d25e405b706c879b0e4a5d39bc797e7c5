---
# folio-assistant-k9yq
title: 'STICKY ART DEFAULT: square crop, faded, unless the todo names a layout; themes page shows square samples'
status: completed
type: feature
created_at: 2026-09-24T18:37:44Z
updated_at: 2026-09-24T18:37:44Z
---

Owner 2026-09-24: "i want sticky themes to by default use the square avatar layout but mostly faded, if not specified. themes/ pages should show sticky as square".

## Summary of Changes
- ThemedTodoFieldsSchema gains an optional `layout` (laptop|mobile|card); absent means the square card crop. todos.ts reads it from front matter.
- docs-ui.js buildBackdrop: the square crop on every screen, no longer swapping in the tall crop below 30rem; a todo naming a layout gets that crop.
- Fade is unchanged: the theme's scrim (82–86%) with its AAA-over-pure-black guarantee.
- themes/ page: each sample sticky is a square card with the theme's square crop behind the text, faded by the theme's own scrim.
- Tests: sticky-todos.e2e.ts asserts no <source> swap and adds a todo that names a layout (59/59 pass); theme-page.test.ts asserts each themed sample uses its square crop; node-kind.test.ts field list updated; glossary regenerated.
