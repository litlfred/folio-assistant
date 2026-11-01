---
# folio-assistant-ylu8
$schema: bean/1.0.0
title: 'Workflows with no permissions block run with the repository''s default token'
status: completed
type: bug
priority: normal
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-11-01T19:40:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** security · **severity:** minor · **rule:** scz-least-privilege

**Where:** no top-level or job-level `permissions:` in smart-base `release.yml` and `fhirbuild.yml`; smart-immunizations `release.yml` and `fhirbuild.yml`; smart-ra `fhirbuild.yml` and `ghbuild.yml`. Each then inherits whatever default the repository setting gives `GITHUB_TOKEN`, and the `release.yml` ones pass it on to `WorldHealthOrganization/smart-html/.github/workflows/release.yml@main` (see x09n).

## Done when
- [x] each of these workflows starts from `permissions: {}` (or `contents: read`) and grants only what its jobs need

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T08:25Z_ — Fixed across all 3 repos: https://github.com/litlfred/smart-base/pull/255 (`release.yml`, `fhirbuild.yml`), https://github.com/litlfred/smart-ra/pull/181 (`release.yml`, `fhirbuild.yml`, `ghbuild.yml`), and https://github.com/litlfred/smart-immunizations/pull/105 (`release.yml`, `fhirbuild.yml`).

_2026-11-01T19:40Z_ — Completed: smart-ra#181 merged (418d12f), the last open PR; smart-base#255 and smart-immunizations#105 merged 2026-10-31. Session https://claude.ai/code/session_01Qmmkt7h4RWc6UwiBW5kbZ2
