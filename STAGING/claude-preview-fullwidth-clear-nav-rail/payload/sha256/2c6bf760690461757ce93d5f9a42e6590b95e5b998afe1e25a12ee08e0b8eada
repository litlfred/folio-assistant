---
# folio-assistant-56jc
$schema: bean/1.0.0
title: 'CI: secrets and write tokens sat beside unpinned code (who-iris, smart-trust)'
status: completed
type: bug
priority: high
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:24:00Z
updated_at: 2026-10-31T04:24:00Z
parent: folio-assistant-3o2w
---

**Category:** security. **Rule:** `scz-pin-third-party-by-full-sha`, `scz-least-privilege`, `scz-secrets-never-in-text`. Held privately until fixed, as the owner chose (2026-10-31). Review finding H3.

**What was wrong:** Write-token and Cloudflare-secret jobs ran code fetched without a pin (a script from a branch, a floating npm range, lockfile-less installs), and one token was passed on a command line.

**Where:** `iris-cover-pdfs.yml`, `iris-cdn.yml`, smart-trust `site-publish.yml`, `release.yml`.

**Fixed:** who-iris pins the renderer by commit and digest, pins wrangler and pymupdf, and keeps the token off argv. smart-trust installs mounts from a lockfile when one exists and runs installs before the token is set. The owner keeps the decision on the WHO smart-html@main call, on first-party reusable workflows at @main, and on smart-trust's global push header. who-iris#140 (`887aeea`), smart-trust#98 (`f5446e7`).
