---
# folio-assistant-m7mn
title: 'SEARCH SCOPES: split the site index per harness and per locale, with a manifest (#1972 A1)'
status: in-progress
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
- [ ] green on CI, PR ready

A2 (the client reading the manifest, with a "search everywhere" fallback) waits on #1975, which edits the same theme file.
