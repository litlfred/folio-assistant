---
# folio-assistant-gim0
title: 'Consolidate Lean cache into an agentic loop: restore -> build -> contribute'
status: completed
type: feature
priority: high
created_at: 2026-08-07T15:01:58Z
updated_at: 2026-08-07T15:04:03Z
---

Reframe: the cache is the OUTPUT of every authoring session, not a CI chore. An agent drafts a .lean, compiles it, and contributes the build back so the next agent does not rebuild. Needs a 'contribute' verb with a no-shrink guard, the regression check moved into lake-cache.sh where both callers get it, and one skill documenting the loop.

## Summary of Changes

Reframed the cache as the OUTPUT of an authoring session rather than a CI
chore, and consolidated around that loop:

    restore -> draft/edit .lean -> lake build -> contribute
       ^                                            |
       +--------- next agent starts here -----------+

- `lake-cache.sh contribute` — the loop's last step. Inherits every seed
  guard, so it is safe to run unconditionally: a session that built
  nothing, or only a subtree, is refused rather than damaging the shared
  cache.
- **No-shrink guard**, moved INTO `lake-cache.sh seed` so both callers
  get it. This is the enabling mechanism, not a safety afterthought — an
  open contribution model only works if a partial build can never replace
  a fuller cache. Counts come from the incumbent branch's commit message
  via `--filter=blob:none`, so the check costs no bandwidth against a
  1.6 GB payload.
- `reseed-lean-cache.sh` gains `--auto-promote` (publish without the
  final prompt when verification AND no-shrink both pass) and `--force`.
  The two-step was never the real safety; the verification is.
- `lean-cache-restore` skill rewritten around the loop, leading with
  restore-before/contribute-after and why traces are the thing that
  matters.

2 new tests (15 total in the suite) pinning that `contribute` exists and
inherits the guards.

Bug caught: an apostrophe in a `printf` broke shell quoting for the whole
rest of the file — 11 tests failed until fixed.

## Follow-up

`tnbf` — the .yml sprawl (lean_ci / lean-build / lean-build-sidecar /
lake-cache-refresh) still wants an audit now that one service exists.
