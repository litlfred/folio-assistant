---
# folio-assistant-hto2
$schema: bean/1.0.0
title: 'Installs that fall back from the lockfile: smart-trust site-publish, who-iris checks, dth-hrh session hook'
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

**Category:** security (supply chain). **Rule:** `scz-review-dependency-changes`; injection-boundaries "a pin that falls back is not a pin". **Severity:** normal.

**Evidence** (`check-lockfile-pinning.ts`):

- smart-trust `.github/workflows/site-publish.yml:109` `bun install --no-save` in each mounted layer, with no lockfile (flagged NEW).
- who-iris `.github/workflows/checks.yml:53` plain `bun install` although `bun.lock` exists (flagged NEW). Should be `--frozen-lockfile`.
- dth-hrh `.claude/hooks/session-start.sh:21` `bun install --no-save` per mount, and `:26` `bun install --frozen-lockfile || bun install`, which silently falls back when the lockfile disagrees.

**Fix:** `--frozen-lockfile` where a lockfile exists; where it does not (mounts), either commit one or report "no lockfile" as its own state with a `::warning::`, as the check asks.

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
