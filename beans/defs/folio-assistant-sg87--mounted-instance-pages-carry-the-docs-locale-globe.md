---
# folio-assistant-sg87
title: Mounted instance pages carry the docs locale globe (#2219)
status: completed
type: task
priority: normal
created_at: 2026-10-05T18:07:13Z
updated_at: 2026-10-06T05:23:38Z
parent: folio-assistant-bzyu
---

Issue #2219. Owner chose B: same chrome as folio-assistant on mounted pages (fa-translation-meta + docs-ui band globe), every declared locale shown, untranslated ones greyed. No new UI.

## Future work, NOT done here
- C: make the who-iris replica's UI strings translatable (pot from gen-iris-pages.ts, per-locale builds at /<loc>/who-iris/ or /who-iris/<loc>/), and teach translation-index.ts to see instance roots. ~2-3 PRs + human-validated translations x5.
- D: translate who-iris/docs/*.md (style guide) via the markdown pipeline; mounted .md is served raw today.

## Done when
/who-iris/ shows the band globe with AR ZH EN FR RU ES, only EN live; unit + e2e cover it; PR green.


## Summary of Changes

Landed in #2220: mounted instance pages (e.g. /who-iris/) carry the docs locale globe, with declared but untranslated locales greyed out. Issue #2219 is left for the owner to close.
