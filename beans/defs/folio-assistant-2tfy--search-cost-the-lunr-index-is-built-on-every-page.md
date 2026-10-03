---
# folio-assistant-2tfy
title: 'SEARCH COST: the lunr index is built on every page view — ~4.7 s CPU, ~315 MB heap before anyone searches'
status: in-progress
type: task
created_at: 2026-10-03T09:04:02Z
updated_at: 2026-10-03T09:04:02Z
parent: folio-assistant-whlc
---

Owner, 2026-10-03, choosing among measured options: **"Both, lazy first"** —
PR 1 builds the search index on first focus of the search box; PR 2 shrinks
the index.

## Measured (local `preview:site` build, headless Chromium, median of 3)

| page | search index | main-thread script | task | JS heap |
|---|---|---|---|---|
| `/` | loaded on load (theme default) | 4,796 ms | 5,234 ms | 314 MB |
| `/` | withheld | 42 ms | 282 ms | 1 MB |
| `/cat-harness/` | loaded on load | 4,662 ms | 5,058 ms | 321 MB |
| `/cat-harness/` | withheld | 42 ms | 295 ms | 1 MB |

`search-data.json`: 12,040 entries, 13.7 MB raw, 2.8 MB gzip. By bytes:
`/reference/` 3.9 MB, `/smart-immunizations/` 2.2, `/smart-trust/` 1.5,
`/glossary/` 1.0, `/uml/` 0.9, `/ru/` 0.9, `/ar/` 0.7. Largest single entries
are whole translated workflow pages (203 kB) and Mermaid source (139 kB).

just-the-docs 0.12.0 calls `initSearch()` unconditionally in `jtd.onReady`;
there is no configuration for lazy loading, so the change is a site copy of
the theme's `assets/js/just-the-docs.js` with two marked hunks.

Related, not this bean: `eof6` (index as a release artefact; staging uses the
last published one), `4pm8` (Pagefind, large-datasets only; the docs pipeline
is "no extensions, no fancy, no js (if possible)").

## Done when
- [x] PR 1 (#1975, merged): the index is fetched and built on first focus of the search box, never on load; a reader who focused or typed before it was ready gets results without re-typing — `search-lazy.e2e.ts`, mutation-checked
- [x] PR 1 measured on the built site: on load 4,796 → 41 ms script, 314 → 2 MB heap, no index fetched
- [x] PR 2: the index shrunk — as step A of issue #1972 (one index per harness and per locale, behind a manifest), which shrinks what any one page loads (a smart-trust page: 1.5 MB, not 13.7 MB) and replaces a separate `search_exclude` pass — the split is #1981 (bean `m7mn`), the client that loads one scope with a "Search everywhere" widening is this bean's third PR
- [ ] green on CI, PRs ready

## Measured: first search, scoped vs whole (2026-10-03)

Local `preview:site` build, split by `search-split.ts`, headless Chromium,
median of 3, opening search and typing "trust":

| page | index loaded | first search | script | heap |
|---|---|---|---|---|
| `/smart-trust/` scoped | manifest + `smart-trust.json` | 0.64 s | 504 ms | 48 MB |
| `/smart-trust/` whole (no manifest) | `search-data.json` | 5.16 s | 4,898 ms | 319 MB |
| `/` scoped | manifest + `_platform.json` | 3.65 s | 3,450 ms | 194 MB |

The platform scope (7.7 MB) is now the largest single cost — #1972's open
question about giving `/reference/` its own scope.
