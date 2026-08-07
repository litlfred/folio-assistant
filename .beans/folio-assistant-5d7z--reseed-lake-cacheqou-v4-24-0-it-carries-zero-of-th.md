---
# folio-assistant-5d7z
title: Reseed lake-cache/qou-v4-24-0 — it carries ZERO of the paper's own oleans
status: in-progress
type: bug
priority: high
created_at: 2026-08-07T12:10:50Z
updated_at: 2026-08-07T13:07:53Z
---

The production cache branch has 7268 oleans, all dependencies, none QOU.*. Every restore still rebuilds the paper, and sibling .lean files cannot elaborate standalone. lake-cache.sh status now detects and reports this.

## Root cause found — it was the seeding format, not the build

The refresh workflow committed `.lake/` as a TREE (`git add -f .lake`);
every live branch carries split `lake-oleans.tgz.part*` tarballs. So the
workflow never produced the live branches — they were hand-seeded, and the
hand-seeding captured `.lake/packages/` while dropping `.lake/build/`.
Hence 7268 dependency oleans and zero `QOU.*`.

The tree form would also blow GitHub's 100 MB blob limit on a
Mathlib-sized cache, which is likely why it was done by hand.

Fixed on both sides:
- folio-assistant: `seed --push` (CI path, worktree-based so the caller's
  tree is never switched), plus a guard that REFUSES to publish a cache
  with zero own-package oleans. `mathlib` is exempt — there the
  dependencies are the payload.
- qou PR #4680: the workflow delegates to that service, so format cannot
  drift again.

Also fixed `git ls-remote` hanging with no timeout — it hung an
interactive run and would hang a CI job silently.

## Remaining

- [ ] Merge qou#4680.
- [ ] Run lake-cache-refresh to actually reseed (needs CI — 1582 modules
      is hours, not feasible in an authoring container).
- [ ] Re-run the triviality probe over the full corpus once reseeded (nimj).
