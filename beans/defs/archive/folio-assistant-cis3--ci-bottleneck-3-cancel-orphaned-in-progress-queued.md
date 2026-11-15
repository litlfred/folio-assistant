---
# folio-assistant-cis3
$schema: bean/1.0.0
title: 'CI BOTTLENECK 3: cancel orphaned in_progress/queued workflow runs when a PR closes or merges'
status: completed
type: task
priority: high
created_at: 2026-10-15T20:27:00Z
updated_at: 2026-10-15T21:05:30Z
parent: folio-assistant-cisp
---

## Problem

When a PR is merged or closed while its `pull_request` workflows (`Code-quality gates`, `PR checks`, `Feature Staging`) are still `in_progress` or `queued`, GitHub Actions leaves them running for 5–10 minutes alongside the new `push` to `main`, starving the concurrent runner pool.

## Remedy

Add automatic cancellation of `in_progress` and `queued` `pull_request` workflow runs for a PR's `head_branch` when the PR closes (or at the start of `push` to `main`).
