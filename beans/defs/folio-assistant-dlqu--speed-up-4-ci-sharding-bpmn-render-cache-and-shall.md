---
# folio-assistant-dlqu
title: 'SPEED-UP 4: CI sharding, BPMN render cache and shallow checkout'
status: todo
type: task
created_at: 2026-10-01T17:42:24Z
updated_at: 2026-10-01T17:42:24Z
parent: folio-assistant-7x5n
---

Owner approved 2026-10-01 late (~17:30, session_01ToWZR4RgTRCWeSsgxsSQfT) as speed-up 4 of 4 for the merge treadmill (S2 `0mf0`, epic `7x5n`). Siblings: input-hash skip, parallel checks, CI merge:main (`d33q` part B).

## What
Three CI changes to `.github/workflows/code-quality-gates.yml` (and the other gate workflows):
1. **Sharding** — split the long `gates` job (and `bun test`) into parallel shards with a final aggregate status, so the slowest job sets the wall-clock rather than the sum.
2. **BPMN cache** — cache the rendered BPMN / UML outputs keyed by the hash of their inputs, so `render:bpmn:check` and friends do not re-render unchanged diagrams.
3. **Shallow checkout** — `fetch-depth` as small as each job allows; jobs that genuinely need history (merge-base, rename detection) say so.

## Falsifier
A shard that silently runs nothing is green. So: the aggregate must check that every gate ran in exactly one shard (the union of shards = `gates.ts`'s derived list). A cache keyed on less than the real inputs serves stale renders; key on the same declared inputs as the input-hash skip. A shallow job that needs history must fail loudly, never fall back to "no renames" (cf. the reference-direction ratchet's `could not determine renames`).

## Note
Another agent is editing `code-quality-gates.yml` for this; other PRs keep their workflow edits to single added steps so merges stay trivial.

## Done when
- [ ] shards + aggregate, with a test that every gate is in exactly one shard
- [ ] BPMN render cache keyed on inputs
- [ ] per-job fetch-depth, each deep one justified
- [ ] measured: CI wall-clock before/after over ≥3 runs
