---
# folio-assistant-7vbx
$schema: bean/1.0.0
title: 'merge-main ran pre-merge steps from the PR tree while a write token was available'
status: completed
type: bug
priority: high
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
created_at: 2026-10-31T04:21:22Z
updated_at: 2026-10-31T04:21:22Z
parent: folio-assistant-sb31
---

Found by the 2026-10-31 security review of the folio-assistant layers. Held privately until the fix merged, then filed (owner, option A).

**Where:** `.github/workflows/merge-main.yml`, job `merge`.

**Fixed in** litlfred/folio-assistant#2825 (merge `d89e05b`). The PR is checked out without persisted credentials, pre-merge preparation runs from main's tree, and the App token is minted only for the push step.

**Follow-up (not done):** move the push into its own job so the merge tree's own regen steps never share a job with the token.
