---
# folio-assistant-ylu8
$schema: bean/1.0.0
title: 'Workflows with no permissions block run with the repository''s default token'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T04:15:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** minor · **rule:** scz-least-privilege

**Where:** no top-level or job-level `permissions:` in smart-base `release.yml` and `fhirbuild.yml`; smart-immunizations `release.yml` and `fhirbuild.yml`; smart-ra `fhirbuild.yml` and `ghbuild.yml`. Each then inherits whatever default the repository setting gives `GITHUB_TOKEN`, and the `release.yml` ones pass it on to `WorldHealthOrganization/smart-html/.github/workflows/release.yml@main` (see x09n).

## Done when
- [ ] each of these workflows starts from `permissions: {}` (or `contents: read`) and grants only what its jobs need

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
