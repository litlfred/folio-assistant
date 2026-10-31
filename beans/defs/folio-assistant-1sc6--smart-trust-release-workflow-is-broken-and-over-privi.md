---
# folio-assistant-1sc6
$schema: bean/1.0.0
title: 'smart-trust: release.yml is broken and over-privileged (checkout@v2, ::set-output, empty tag ref)'
status: completed
type: bug
priority: low
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T20:26:05Z
parent: folio-assistant-3o2w
---

**Category:** correctness, security. **Rule:** `scz-least-privilege`. **Severity:** low: manual dispatch only.

**Evidence** (`.github/workflows/release.yml`, smart-trust `496290a`):

- `:3-7` grants `contents, pages, id-token, pull-requests: write` to every job, including the `check` job that only reads a file.
- `:22` `actions/checkout@v2` (Node 12, long deprecated).
- `:24` `ref: ${{ github.event.release.tag_name }}` is empty on `workflow_dispatch`, the only trigger, so it checks out the default branch, not a release.
- `:30, :32` `echo "::set-output ..."` is deprecated; use `>> "$GITHUB_OUTPUT"`.

**Fix:** job-level permissions (read for `check`), current pinned checkout, a dispatch input for the tag, `$GITHUB_OUTPUT`.

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T08:21:00Z_ — Fixed in https://github.com/litlfred/smart-trust/pull/98 (least-privilege `permissions: {}` with `contents: read` on `check`, `actions/checkout` SHA-pinned at v4, `$GITHUB_OUTPUT`) and https://github.com/litlfred/smart-trust/pull/99 (`workflow_dispatch.inputs.tag` wired to `ref: ${{ inputs.tag || github.event.release.tag_name || 'main' }}`).

_2026-10-31T20:26:05Z_ — All fix PRs merged (owner card choice A, 2026-10-31 20:22Z, thread "Drain workplan, issues and beans"); bean completed.
