---
# folio-assistant-cn8y
title: Page follows the remembered locale; mark source-language fallbacks in a translated navbar
status: completed
type: bug
priority: normal
created_at: 2026-09-27T05:39:33Z
updated_at: 2026-09-27T05:39:33Z
---

Owner 2026-09-27: an English page sat inside a French navbar. 'user selects locale in icon, then only those pages exist (if translated) otherwise source language fallback'. Chose: page follows too, and fallback items tagged (EN).

## Summary of Changes

- `docs-ui.js` `followRememberedLocale`: with a STORED `fa-locale`, a page that has a version in that locale (by its own `availableLocales`) is replaced by it. `?lang=` wins. Nothing stored means no jump.
- `mountNavLocale`: a fallback item gets `lang` and `data-fa-source-locale`; the CSS prints ` (EN)` after it. An English navbar shows no tag.
- `nav-locale.e2e.ts`: five redirect cases plus the tag and its absence. 160 pass across the related e2e files; `bun run gates` passes every gate.
