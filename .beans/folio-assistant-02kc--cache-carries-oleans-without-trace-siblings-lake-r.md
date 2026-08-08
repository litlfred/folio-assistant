---
# folio-assistant-02kc
title: Cache carries oleans WITHOUT .trace siblings — lake rebuilds and evicts them
status: in-progress
type: bug
priority: critical
created_at: 2026-08-07T13:56:17Z
updated_at: 2026-08-08T11:54:20Z
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

## The coverage metric this bean turns on was itself wrong

Dry-running the reseed against a real tree reported **192% trace
coverage**. Coverage cannot exceed 100%, so the number every gate here
depends on was not measuring what it claimed.

`trace_coverage_pct` was `total .trace files * 100 / oleans`. But most
`.trace` files in a Lake tree do not belong to an olean. From the qou
tree, 13 oleans and 25 traces, of which twelve were:

    .c.o.export.trace       (compiled object files)
    cache.trace             (a linked binary)
    ProofWidgets4.tar.gz.trace
    lake.trace
    package-lock.json.trace

True coverage there was 13/13 = 100%, reported as 192%.

Both consumers fail **OPEN** on an inflated figure, which is the
dangerous direction:

- reseed phase 2 skips fetching the upstream cache at >= 90% — so an
  inflated ratio sends you into an hours-long from-source build instead
  of a minutes-long fetch, the exact outcome this bean exists to avoid;
- the seed guard admits a cache it should refuse.

Fixed to measure real pairing — for each `X.olean`, does its own trace
exist? Two sibling forms, both counted:

    build/lib/lean/Cache/IO.olean  ->  build/lib/lean/Cache/IO.trace
    .lake/lakefile.olean           ->  .lake/lakefile.olean.trace

`status` now prints `traced: 13/13 oleans (100%)` rather than a raw trace
count beside a percentage computed from a different population.

### And a ratio alone is still not enough

With coverage correct, the same tree — 13 oleans — passed a `>= 90%`
gate and skipped fetching ~7300 modules. A ratio says nothing about
size. Phase 2 now requires high coverage AND a substantial olean count
before skipping; `lake exe cache get` is idempotent, so running it
needlessly is cheap while skipping it wrongly costs hours.

4 tests pin all of this. Verified they FAIL against the old formula
(3 of 4) rather than merely passing against the new one.

## The two routes do not produce the same cache — and no guard notices

Seeding from a from-source `lake build` (the route available when the CDN
is blocked) yields only the Mathlib modules this package's imports reach.
Seeding from `lake exe cache get` yields Mathlib's full published set.

    lake exe cache get        ~7300 modules
    lake build from source    only the import closure

Both are correctly traced; both pass `seed`'s guards. Those guards check
own-package oleans and trace coverage — neither measures BREADTH, because
there is no baseline to compare against.

Consequence: a source-seeded branch makes its own package build fast while
anything reaching outside that closure still rebuilds. Acceptable for a
single package's branch; worth stating explicitly before promoting to a
shared one, which outlives the session that seeded it.

Possible follow-up, not built: `seed` could compare the candidate's olean
count against the branch it is about to replace and warn on a large drop.
That is a real computable check, unlike an absolute breadth threshold.
Deferred rather than added mid-reseed.


---

## Blocker re-tested 2026-08-08 (session `3bada08b`) — still blocked, now measured

Asked to work all open beans, so the claim was re-tested rather than inherited.

**The toolchain half is genuinely resolved** (`ga7e` was right):
`~/.elan/toolchains/leanprover--lean4---v4.24.0` is present and both binaries
run — `lean --version` → 4.24.0, `lake --version` → Lake 5.0.0-src+797c613. So
"no linkable toolchain" is no longer the blocker.

**The network half is not.** Every host a reseed needs is unreachable from an
authoring container:

    https://release.lean-lang.org                  HTTP 000
    https://leanprover-community.github.io         HTTP 000
    https://github.com/leanprover-community/mathlib4   HTTP 403
    https://api.github.com/repos/leanprover/elan/releases/latest   HTTP 403

`lake exe cache get` fetches from the second of those, so the fast route is
out; the from-source route is the hours-long build this bean already measured
(823 targets for ONE module, not finished in 10 minutes at 0% trace coverage).

**And there is no folio here.** `scripts/lake-cache.sh restore-toolchain`
exits `no lean-toolchain` — that file is folio content, and this container has
the platform only. So even with network there is nothing to build.

Conclusion unchanged and now pinned: **this needs CI, or a machine with
unrestricted egress.** The runbook in
`docs/guides/reseeding-the-lean-cache.md` is the artifact to run there. Nothing
further is doable from an authoring container, and the next session should not
spend turns re-confirming it.
