---
# folio-assistant-aso6
$schema: bean/1.0.0
title: 'deploy-folio runs branch scripts with production secrets and no permissions block'
status: completed
type: bug
priority: high
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
created_at: 2026-10-31T04:01:56Z
updated_at: 2026-10-31T04:22:00Z
---

Found by the 2026-10-31 security and QA review of the folio-assistant layers (SOP: cat-harness `skills/conduct/security/`, the 16 rules of `skills/voices/secure-code-authoring/voice.json`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`). No fix PR yet: fixes wait for the owner's go-ahead.

**Category:** security · **Severity:** major

folio-assistant `.github/workflows/deploy-folio.yml` at `4bffe8d`. Rule `scz-least-privilege`.

- No `permissions:` block at any level, so the job gets the repository's default token permissions.
- It passes `HETZNER_API_TOKEN`, `GOOGLE_CLIENT_ID/SECRET` and `GH_OAUTH_CLIENT_ID/SECRET` (lines 116-166) to `deploy/parse-config.py`, `deploy/provision.sh`, `deploy/update-server.sh` and `deploy/destroy-server.sh`. **None of these files exist on main** (there is no `deploy/` directory), so the workflow is dead on main, but a dispatch against another branch runs that branch's copies with the production secrets. No `environment:` with required reviewers gates it.

Other workflows with no top-level `permissions:` (rule says every workflow sets one, read-only by default): `pyhecke.yml`, `pyodide-smoke.yml`, and the build job of `pyhecke-native-wheels.yml` (only its later jobs set permissions). `copilot-setup-steps.yml` sets it at job level, which is fine.

## Done when

- [ ] deploy-folio.yml is deleted, or gated by an environment with required reviewers and a top-level `permissions: contents: read`
- [ ] Every workflow has a top-level permissions block

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
## Summary of Changes

Fixed in litlfred/folio-assistant#2827 (merge `666bac2`): top-level read-only permissions; deploy-folio runs only on main in the `production` environment.

**Owner action still needed:** move HETZNER_API_TOKEN and the OAuth secrets into the `production` environment and add a required reviewer.
