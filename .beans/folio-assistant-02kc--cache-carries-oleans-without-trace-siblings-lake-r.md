---
# folio-assistant-02kc
title: Cache carries oleans WITHOUT .trace siblings — lake rebuilds and evicts them
status: in-progress
type: bug
priority: critical
created_at: 2026-08-07T13:56:17Z
updated_at: 2026-08-07T14:49:26Z
---

Root cause of the cache never helping lake build. Lake decides staleness from .trace files; an olean with no trace is out-of-date, so lake rebuilds it and evicts. Measured: restore laid 7268 oleans with only 775 traces; a single-module 'lake build' ran 823 targets and left 772 oleans — every survivor had a trace (494 mathlib oleans / 494 traces, 0 of 200 sampled lacking one). The cache only ever worked for direct lean+LEAN_PATH calls, which is why the triviality probe succeeded while builds did not.

## Blocked on ga7e

The fix is to seed from a tree where a real `lake build` produced traces
alongside oleans. Two routes, both blocked here:

- `lake exe cache get` — the fast route (Mathlib upstream ships traces).
  Needs `lake exe` to LINK, which fails: no static libs (ga7e).
- `lake build` from source — measured: one module ran 823 targets and did
  not finish in 10 minutes, because with 0% trace coverage everything is
  out-of-date. Hours, and it EVICTS as it goes (7268 -> 772 observed).

Incremental chipping does not help while coverage is 0%: the first chip
has to rebuild all of Mathlib before any module of the paper compiles.
Once traces exist, subsequent builds are genuinely incremental — so the
expensive step is one-time, and belongs in CI.

## Local runbook written

`docs/guides/reseeding-the-lean-cache.md` — exact steps for a machine with
unrestricted network, since elan's host is 403 here.

Order that matters: remove the incomplete extracted toolchain FIRST (elan
skips the download otherwise), then `lake exe cache get` for a traced
Mathlib in minutes rather than an hours-long from-source build, then
`lake build`, then seed to a `-test` branch and verify a restore from it
before force-pushing production.
