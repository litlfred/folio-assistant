---
# folio-assistant-clzd
title: check:import-direction — cat-harness imports nothing above it; content adapters declared by their instance (#1737)
status: completed
type: task
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-01T06:58:00Z
parent: folio-assistant-iirv
---

Landed in #1737 (merge `bf8f5c80c27` on main, 2026-10-01; branch `claude/laughing-thompson-vjcmlx`): cat-harness imports nothing above it — content adapters are declared by their own instance (`schemas/cat-harness.ts`), and `scripts/check-import-direction.ts` (new, 337 lines) reads every instance's `needs` and fails an upward import. CI step in `code-quality-gates.yml`. This is the gate `p11x` asked for across instances; stage 0 of the separation generalises it with a planted `cat-harness → cat-harness-tools` import. Related: `p11x`, `yj6r`, `ybp4`, `y5si`, `bf5l`, `zhg2`. Recorded retroactively; no bean carried it while in flight.

## Summary of Changes
- `check:import-direction` gate (`check-import-direction.ts`), wired in CI
- content adapters declared by their owning instance instead of imported by the harness
- `partition/instance-rules.ts` updated

Evidence: `git show --stat bf8f5c80c27` on origin/main.
