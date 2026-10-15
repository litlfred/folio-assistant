---
# folio-assistant-cis6
$schema: bean/1.0.0
title: 'CI BOTTLENECK 6: run per-instance tsc --noEmit in parallel in typecheck:instances'
status: completed
type: task
priority: high
created_at: 2026-10-15T20:27:00Z
updated_at: 2026-10-15T21:05:30Z
parent: folio-assistant-cisp
---

## Problem

`cat-harness-tools/scripts/typecheck-instances.ts` spawns `tsc --noEmit -p <cfg>` sequentially in a `for` loop across all instances (`bootstrap-tools`, `cat-harness-tools`, `cat-harness`, `folio-assistant-core`, etc.).

## Remedy

Spawn all per-instance `tsc --noEmit` processes concurrently (`Promise.all` with `Bun.spawn`), buffer each instance's stdout/stderr so output remains grouped deterministically per instance, and preserve exact exit codes (`0`, `1`, `2`).
