---
# folio-assistant-ztg5
$schema: bean/1.0.0
title: 'smart-trust: participant generator repaired FSH strings instead of refusing bad values'
status: completed
type: bug
priority: normal
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:24:00Z
updated_at: 2026-10-31T04:24:00Z
parent: folio-assistant-3o2w
---

**Category:** security. **Rule:** `scz-refuse-never-repair`, `scz-value-never-becomes-program-text`. Held privately until fixed, as the owner chose (2026-10-31). Review finding H5.

**What was wrong:** Names from certificates and the xMart API went into FSH string literals through an `escape()` that handled only the double quote.

**Where:** `input/scripts/generate_organizations.py`.

**Fixed:** Values with a quote, a backslash or a control character are now refused (a refused locality falls back to the placeholder name), and requests have timeouts. smart-trust#98 (`f5446e7`).
