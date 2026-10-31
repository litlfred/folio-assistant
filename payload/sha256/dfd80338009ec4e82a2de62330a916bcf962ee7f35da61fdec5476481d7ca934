---
# folio-assistant-vbhb
$schema: bean/1.0.0
title: 'sci and folio-assistant pin tools and workflows to moving refs'
status: in-progress
type: bug
priority: normal
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
created_at: 2026-10-31T04:01:56Z
updated_at: 2026-10-31T04:15:00Z
---

Found by the 2026-10-31 security and QA review of the folio-assistant layers (SOP: cat-harness `skills/conduct/security/`, the 16 rules of `skills/voices/secure-code-authoring/voice.json`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`). No fix PR yet: fixes wait for the owner's go-ahead.

**Category:** security · **Severity:** minor

Rule `scz-pin-third-party-by-full-sha`.

- folio-assistant-sci `.github/workflows/cancel-on-close.yml:16`, `harness-pr-checks.yml:20,38`, `publish-context.yml:18` call `litlfred/cat-harness-tools/.github/workflows/layer-*.yml@main`. These run with sci's tokens (`issues: write`, `contents: write`, `actions: write`). folio-assistant pins the same kind of call by SHA (`main-qa.yml:35`).
- folio-assistant `.mcp.json`: the `sage` server runs `sagemath/sagemath:latest`, a moving Docker tag, on every session that enables it. Pin by `@sha256:` digest.

Third-party actions in both repos are all SHA-pinned (cat-harness-tools `pin-actions.ts`: 0 to pin in folio-assistant; grep in sci).

## Done when

- [ ] sci's reusable workflow calls are SHA-pinned
- [ ] The sage image is pinned by digest

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
