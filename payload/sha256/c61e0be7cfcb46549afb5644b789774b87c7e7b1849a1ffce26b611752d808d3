---
# folio-assistant-k3tw
$schema: bean/1.0.0
title: 'lean-kg-viewer inserted unsanitised HTML and loaded CDN scripts without SRI'
status: completed
type: bug
priority: normal
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
created_at: 2026-10-31T04:25:00Z
updated_at: 2026-10-31T04:25:00Z
---

Found by the 2026-10-31 security review of the folio-assistant layers. Held privately until the fix merged, then filed (owner, option A).

**Where:** folio-assistant-sci `adapters/paper/lean/lean-kg-viewer/` (`viewer.js`, `index.html`).

**Fixed in** litlfred/folio-assistant-sci#152 (merge `1ec9283`). All HTML goes through DOMPurify (text fallback, never raw HTML), links are limited to http(s) or relative, and MathJax, marked and DOMPurify load version-pinned with SRI.
