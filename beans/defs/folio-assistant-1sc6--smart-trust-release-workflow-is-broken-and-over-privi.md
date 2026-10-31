---
# folio-assistant-1sc6
$schema: bean/1.0.0
title: 'smart-trust: release.yml is broken and over-privileged (checkout@v2, ::set-output, empty tag ref)'
status: todo
type: bug
priority: low
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T04:10:00Z
parent: folio-assistant-3o2w
---

**Category:** correctness, security. **Rule:** `scz-least-privilege`. **Severity:** low: manual dispatch only.

**Evidence** (`.github/workflows/release.yml`, smart-trust `496290a`):

- `:3-7` grants `contents, pages, id-token, pull-requests: write` to every job, including the `check` job that only reads a file.
- `:22` `actions/checkout@v2` (Node 12, long deprecated).
- `:24` `ref: ${{ github.event.release.tag_name }}` is empty on `workflow_dispatch`, the only trigger, so it checks out the default branch, not a release.
- `:30, :32` `echo "::set-output ..."` is deprecated; use `>> "$GITHUB_OUTPUT"`.

**Fix:** job-level permissions (read for `check`), current pinned checkout, a dispatch input for the tag, `$GITHUB_OUTPUT`.
