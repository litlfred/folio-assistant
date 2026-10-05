---
# folio-assistant-m7mn
title: 'SEARCH SCOPES: split the site index per harness and per locale, with a manifest (#1972 A1)'
status: completed
type: task
created_at: 2026-10-03T09:50:04Z
updated_at: 2026-10-03T09:50:04Z
parent: folio-assistant-whlc
---

Issue #1972 step A, first half (A1). The owner chose "Both, lazy first" on
2026-10-03; lazy is bean `2tfy` (#1975), and #1972's plan makes step A — one
index per harness and per locale — the "shrink" half.

## Measured (local build, 2026-10-03)

`search-split.ts` over the built site's `search-data.json` (12,040 entries,
13.74 MB) in 0.5 s: 11 scopes — `_platform` 4,822 entries / 7.73 MB,
`smart-immunizations` 3,003 / 2.10 MB, `smart-trust` 2,707 / 1.50 MB,
`smart-base` 905 / 0.57 MB, five locales 0.21–0.37 MB each, `bootstrap` and
`cat-harness` 9 entries. Scope entry counts sum to the source's exactly.

## Done when
- [x] `search-split.ts` derives scopes from declared instance names and target locales (no hand list), writes one theme-shaped index per scope plus `manifest.json`, deterministic, `--check`
- [x] unit tests: scope rule (instance route, kind route, locale, platform), partition sums, determinism
- [x] `publish-verify` verifier `search-scopes`: manifest present when the index is, every scope parses, counts partition the source, `sha256` matches it
- [x] declared as a Tool node with that downstream verifier
- [x] wired into `docs-site.yml` after the build and `feature-staging.yml` after the published index is borrowed
- [x] green on CI, PR ready — #1981 merged (`ready: baefb0e76`, 21/23 success + 2 skips); on its staging preview `search-scopes` passed on the borrowed published index, 12 documents checked

A2 (the client reading the manifest, with a "search everywhere" fallback) waits on #1975, which edits the same theme file.

## Summary of Changes

`cat-harness/scripts/search-split.ts` cuts the theme's `search-data.json`
into one index per scope — each declared instance (`/<instance>/` and the
`/<kind>/<instance>/` route), each declared target locale, and the
platform — plus `assets/js/search/manifest.json`. Scopes are derived from
declarations, every entry lands in exactly one, and output is deterministic.
Run after the build in `docs-site.yml` and after the borrow in
`feature-staging.yml`; `search-data.json` itself is unchanged.

`publish-verify` gained `search-scopes` (manifest hash matches the tree's own
index, every scope parses to its count, the scopes partition the index),
declared as Tool `site-search-scopes`. The gates required classifying the
step `ci-only`, assigning the script to the harness partition, and
regenerating term-mapping and the glossary — all done in the PR.

The client that reads the manifest is #1988 (bean `2tfy`).
