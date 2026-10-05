---
# folio-assistant-xpcu
title: 'REGEN + GATES SPEED-UP: input-hash staleness skipping and a parallel worker pool for regen-after-merge and gates'
status: in-progress
type: feature
priority: high
created_at: 2026-10-01T17:26:24Z
updated_at: 2026-10-01T17:26:36Z
parent: folio-assistant-7x5n
---

## Why

Measured by the steward: `bun run regen` runs ~83 check/writer pairs serially
via `spawnSync`, up to 3 passes, ~25 min locally. `bun run gates` takes >50 min
locally. The box has 4 CPUs shared with other sessions.

## What (owner-approved, 2026-10-01)

1. **Input-hash staleness skipping** in regen: hash each pair's declared inputs
   plus its script source; skip when it matches the hash recorded at the last
   green run. Cache is git-ignored, never committed. Undeclared or
   undeterminable inputs always run. `--no-cache`, `--explain`. CI unchanged
   (cache absent/disabled under `CI`).
2. **Parallel pool** (`--jobs`, default `max(1, cpus-1)`) for regen pairs and
   for read-only gates; overlapping or undeclared outputs serialize; output
   buffered and printed in original order.

## Done when

- One PR on `claude/regen-gates-speedup` with unit tests for hash skip,
  could-not-determine runs, overlap serialization and ordering.
- Before/after wall times measured and in the PR body, with box load noted.

Claimed by session https://claude.ai/code/session_01ToWZR4RgTRCWeSsgxsSQfT on branch claude/regen-gates-speedup (2026-10-01).
