---
# folio-assistant-0q34
$schema: bean/1.0.0
title: 'who-iris: search page built innerHTML from unescaped fields'
status: completed
type: bug
priority: low
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:24:00Z
updated_at: 2026-10-31T04:24:00Z
parent: folio-assistant-3o2w
---

**Category:** security. **Rule:** `scz-value-never-becomes-program-text`. Held privately until fixed, as the owner chose (2026-10-31). Review finding H7.

**What was wrong:** The client search script put `href` and `lang` into `innerHTML` unescaped, and placed highlight marks by repeated regex over escaped markup.

**Where:** `scripts/gen-iris-pages.ts`, `site/*/index.html`.

**Fixed:** Marks are placed on the raw text and escaped once, `href` and `lang` are escaped, and non-http(s) links are not rendered. The site pages were regenerated. who-iris#140 (`887aeea`).
