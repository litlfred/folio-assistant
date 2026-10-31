---
# folio-assistant-nn9p
$schema: bean/1.0.0
title: 'Workflows: free-text dispatch inputs reached run blocks (smart-trust, who-iris)'
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

**Category:** security. **Rule:** `scz-value-never-becomes-program-text`. Held privately until fixed, as the owner chose (2026-10-31). Review finding H4.

**What was wrong:** Typed dispatch inputs and the step outputs carrying them were substituted into `run:` script text in write-token jobs.

**Where:** smart-trust `generate-participants*.yml`, who-iris `iris-cover-pdfs.yml`.

**Fixed:** They go through `env:` and are checked against an allow-list. The dead repository_dispatch step is removed. `check-workflow-injection` dropped from 8 to 0 in smart-trust and from 1 to 0 in who-iris. smart-trust#98 (`f5446e7`), who-iris#140 (`887aeea`).
