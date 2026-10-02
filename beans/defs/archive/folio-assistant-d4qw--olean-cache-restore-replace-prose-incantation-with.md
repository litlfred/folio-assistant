---
# folio-assistant-d4qw
title: 'olean cache restore: replace prose incantation with a real service'
status: completed
type: feature
priority: high
created_at: 2026-08-07T10:30:13Z
updated_at: 2026-08-07T10:44:36Z
---

Agents struggle with Lake/olean cache restore. Machinery exists but is documented as a multi-step git incantation with a known FETCH_HEAD race, no verification, and no diagnosis.

## Summary of Changes

`scripts/lake-cache.sh` — restore / status / seed / list / doctor /
restore-toolchain, with typed exit codes (0 hit, 1 miss, 2 env, 3 corrupt).

Found and fixed three real bugs while building it:

1. **CI Tier 2 was dead.** `.github/actions/lake-cache-restore` read a
   committed `.lake/` tree via `git archive`, but the branches carry split
   `lake-oleans.tgz.part*` tarballs. It found no `.lake` path and fell
   through on every run — and since Tier 3 is mathlib-only, CI silently did
   a full rebuild for every other package while looking healthy.
2. **`git ls-tree` is cwd-prefix-relative.** Run from the Lake root (the
   normal case) it listed a path the orphan branch does not contain and
   returned nothing, reporting a good cache as empty. Needs `--full-tree`.
   The documented recipe had this bug too.
3. **`FETCH_HEAD` race**, documented but unpreventable in a copy-paste
   recipe. Now fetches into a private ref.

Verified end-to-end on qou: 7268 oleans restored from
`lake-cache/qou-v4-24-0` in ~2 min; idempotent re-run; miss/corrupt paths
and all exit codes checked.

Also: zero-config package inference from the branch family (the roster
lives in folio-assistant while its paths belong to the content repo — see
8agu), `restore-toolchain` for the previously-unused
`lake-cache/toolchain-<slug>` branch, new `lean-cache-restore` skill, and
three copies of the racy incantation removed from `lean-environment-setup`.
