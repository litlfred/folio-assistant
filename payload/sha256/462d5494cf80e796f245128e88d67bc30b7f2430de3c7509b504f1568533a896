---
# folio-assistant-xbfx
$schema: bean/1.0.0
title: 'smart-trust: 12 unpinned actions and reusable workflows in write-token workflows (security:gate fails)'
status: todo
type: bug
priority: high
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T04:10:00Z
parent: folio-assistant-3o2w
---

**Category:** security (supply chain). **Rule:** `scz-pin-third-party-by-full-sha`. **Severity:** high: the gate's blocking check fails, and the workflows hold `contents: write`.

**Evidence** (`security-gate.ts` → `action-sha-pinning — fail: 12 unpinned outside exempt staging workflows`; smart-trust `496290a`):

| file:line | uses |
|---|---|
| `.github/workflows/fhirbuild.yml:25` | `litlfred/smart-base/.github/workflows/fhirbuild.yml@main` |
| `.github/workflows/generate-participants-nightly.yml:24,27` | `actions/checkout@v4`, `actions/setup-python@v4` |
| `.github/workflows/generate-participants.yml:30,33` | `actions/checkout@v4`, `actions/setup-python@v4` |
| `.github/workflows/ig-ast-refresh.yml:43` | `litlfred/fhir-harness/.github/workflows/ig-ast-refresh.yml@main` |
| `.github/workflows/release.yml:22` | `actions/checkout@v2` |
| `.github/workflows/release.yml:38` | `WorldHealthOrganization/smart-html/.github/workflows/release.yml@main` (another organisation's branch) |
| `.github/workflows/site-publish.yml:74` | `litlfred/fhir-harness/.github/workflows/ig-ast-refresh.yml@main` |
| `.github/workflows/site-publish.yml:87,96,112` | `actions/checkout@v4`, `oven-sh/setup-bun@v2`, `ruby/setup-ruby@v1` |

Also not counted by the gate but on `@main` under write tokens: `cancel-on-close.yml:16`, `harness-pr-checks.yml:50,68` (cat-harness-tools reusable workflows).

**Fix:** `bun run cat actions:pin` for the third-party actions; decide whether first-party reusable workflows are pinned by SHA (they are the platform's own, but `@main` means a merge there runs here with this repo's write token). who-iris is already fully pinned and is the model.
