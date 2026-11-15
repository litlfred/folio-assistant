---
# folio-assistant-0d23
$schema: bean/1.0.0
title: 'who-iris: IRIS identifiers were not shape-checked before becoming release paths'
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

**Category:** security. **Rule:** `scz-every-input-is-suspect`; skill path-containment. Held privately until fixed, as the owner chose (2026-10-31). Review finding H2.

**What was wrong:** IRIS uuids, handles, bundle names and file names became release paths and API URL parts with no shape check. The manifest writer already refused `..` and line breaks, so the impact was that one bad value aborted a whole run.

**Where:** `scripts/iris-cdn/run.ts`.

**Fixed:** Each value is checked, and a bad one is listed in the run report and left out. who-iris#140 (`887aeea`).
