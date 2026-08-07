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

## Still blocked — but the blocker has moved, and is now pinned exactly

"Blocked on ga7e" is no longer right. ga7e is resolved: a linkable
toolchain is obtainable locally from GitHub releases, and mathlib's
`cache:exe` builds and LINKS here (20/20 targets).

The fast route is still unavailable, for a **different and independent**
reason — Mathlib's cache CDN is unreachable from this container:

    mathlib4.lean-cache.cloud         no route
    lakecache.blob.core.windows.net   no route
    github.com release assets         200   (control — toolchain route)

Measured: `lake exe cache get` in content/quantum-observable-universe/lean
resolved 7335 modules, attempted every one, downloaded zero, each failing
`CONNECT tunnel failed, response 403`.

The toolchain had a reachable mirror because Lean publishes it as a
GitHub release asset. Mathlib's oleans have no such mirror, so the same
trick does not transfer.

### What this means for the route choice

Both routes in the "Blocked on ga7e" section above need revisiting:

- `lake exe cache get` — now blocked at the CDN, not at the linker.
  Works in CI, where the CDN is reachable.
- `lake build` from source — unchanged; still hours, still evicts as it
  goes while trace coverage is 0%.

So the conclusion "belongs in CI" survives, but the REASON recorded for
it was wrong, and would have sent the next session hunting the toolchain
again.

`reseed-lean-cache.sh` phase 2 now probes the CDN up front and dies with
the host names, instead of emitting ~7300 identical failures.
