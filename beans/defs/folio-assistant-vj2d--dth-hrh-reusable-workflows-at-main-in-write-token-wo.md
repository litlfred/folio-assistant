---
# folio-assistant-vj2d
$schema: bean/1.0.0
title: 'dth-hrh: reusable workflows at @main in write-token workflows (security:gate fails)'
status: in-progress
type: bug
priority: normal
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T04:15:00Z
parent: folio-assistant-3o2w
---

**Category:** security (supply chain). **Rule:** `scz-pin-third-party-by-full-sha`. **Severity:** normal: first-party code, but the gate's blocking check fails.

**Evidence** (`security-gate.ts` on dth-hrh `ffb89eb`: `action-sha-pinning — fail: 2 unpinned`):

- `.github/workflows/wg-comment-check.yml:18` `litlfred/folio-assistant-core/.github/workflows/public-comment-check.yml@main`, with `contents: write, issues: write`.
- `.github/workflows/wg-comment.yml:21` `litlfred/folio-assistant-core/.github/workflows/public-comment.yml@main`, with `contents, issues, pull-requests, actions: write`.

The other callers (`qa-sweep*.yml`, `site-publish.yml`, `section-title-audit.yml`, `harness-pr-checks.yml`) use cat-harness-tools workflows at `@main` too; the gate does not count those.

**Fix:** pin to a SHA with a `# <ref>` comment, or record the owner's decision that first-party reusable workflows may float, and make the gate say so consistently (today it fails folio-assistant-core@main and passes cat-harness-tools@main).

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
