---
# folio-assistant-wea0
$schema: bean/1.0.0
title: 'who-iris: outbound fetches followed URLs chosen by the data'
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

**Category:** security. **Rule:** `scz-guard-outbound-requests`. Held privately until fixed, as the owner chose (2026-10-31). Review finding H6.

**What was wrong:** The DID document fetch and the cover fetcher followed URLs that came from fetched data, and wrote files under names that were not checked.

**Where:** `scripts/iris-cdn/signing.ts`, `scripts/iris-covers/fetch-referenced-pdfs.py`.

**Fixed:** Fetches stay on the configured host and refuse redirects, did:web hosts and path parts must be plain, and file names must be single segments. who-iris#140 (`887aeea`).
