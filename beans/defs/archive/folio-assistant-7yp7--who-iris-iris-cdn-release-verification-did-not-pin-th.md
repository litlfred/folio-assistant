---
# folio-assistant-7yp7
$schema: bean/1.0.0
title: 'who-iris: IRIS CDN release verification did not pin the expected DID or require the anchor chain'
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

**Category:** security. **Rule:** `scz-every-input-is-suspect`, `scz-refuse-never-repair`. Held privately until fixed, as the owner chose (2026-10-31). Review finding H1.

**What was wrong:** Release verification took its verifier from the release itself and passed a key that had no certificate chain, even when a trust anchor was set. The workflow also never passed the anchor variable.

**Where:** `scripts/iris-cdn/signing.ts`, `scripts/iris-cdn/run.ts`, `.github/workflows/iris-cdn.yml`.

**Fixed:** Verify now takes the DID and anchor from configuration, refuses a key outside that DID, requires the chain when an anchor is set, and refuses redirects. New tests cover each refusal. who-iris#140 (`887aeea`).
