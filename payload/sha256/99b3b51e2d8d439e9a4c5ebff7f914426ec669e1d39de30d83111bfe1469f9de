---
# folio-assistant-xbfx
$schema: bean/1.0.0
title: 'smart-trust: 12 unpinned actions and reusable workflows in write-token workflows (security:gate fails)'
status: completed
type: bug
priority: high
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T20:26:05Z
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

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

## Fixed (2026-10-31)

litlfred/smart-trust#98 merged as `f5446e7`. The third-party actions are pinned to full SHAs, and `checkout@v2` is replaced. Still at `@main`, by the owner's decision: `WorldHealthOrganization/smart-html` (release.yml) and the first-party reusable workflows (smart-base fhirbuild, fhir-harness ig-ast-refresh, cat-harness-tools callers).

_2026-10-31T08:21:00Z_ — Third-party actions SHA-pinned in https://github.com/litlfred/smart-trust/pull/98; remaining 4 reusable workflow calls (`fhirbuild.yml`, `ig-ast-refresh.yml`, `release.yml`, `site-publish.yml`) SHA-pinned with `# main` comments in https://github.com/litlfred/smart-trust/pull/99 (`unpinnedActions` reports 0 unpinned).

_2026-10-31T20:26:05Z_ — All fix PRs merged (owner card choice A, 2026-10-31 20:22Z, thread "Drain workplan, issues and beans"); bean completed.
