---
# folio-assistant-6zcw
$schema: bean/1.0.0
title: 'folio-assistant-sci cannot run the security gate'
status: in-progress
type: bug
priority: normal
tags:
    - security
    - security-review-2026-10-31
    - red-flag-false-green
created_at: 2026-10-31T04:01:56Z
updated_at: 2026-10-31T04:15:00Z
---

Found by the 2026-10-31 security and QA review of the folio-assistant layers (SOP: cat-harness `skills/conduct/security/`, the 16 rules of `skills/voices/secure-code-authoring/voice.json`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`). No fix PR yet: fixes wait for the owner's go-ahead.

**Category:** false-green · **Severity:** minor

Same shape as folio-core-0dy3, measured on folio-assistant-sci at `f0d44d9` on 2026-10-31: no `check:*` scripts in `package.json`; `check-secret-leaks.ts` cannot load `@litlfred/bootstrap-tools` outside the folio-assistant layout; `pin-actions.ts` crashes reading `feature-staging.yml`; `check-workflow-injection.ts` compares against folio-assistant's baseline (5 stale entries). sci's workflows hold write tokens and are checked by no gate in sci's own CI.

folio-assistant itself: `check-workflow-injection` passes (12 constrained expressions baselined, no free text in run/script blocks) and `pin-actions` reports nothing to pin.

## Done when

- [ ] sci's CI runs the security gate over sci's own workflows

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
