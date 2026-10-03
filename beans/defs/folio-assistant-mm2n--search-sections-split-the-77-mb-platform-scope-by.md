---
# folio-assistant-mm2n
title: 'SEARCH SECTIONS: split the 7.7 MB platform scope by section over a declared budget (#1972)'
status: in-progress
type: task
created_at: 2026-10-03T13:53:25Z
updated_at: 2026-10-03T13:53:25Z
parent: folio-assistant-whlc
---

Issue #1972, the owner's "1 2 3" of 2026-10-03: (1) give the 7.7 MB platform
scope's biggest part its own scope, (2) per-graph scopes, (3) remote graphs.
This bean is (1) and the platform half of (2).

## Measured (local build, 2026-10-03)

The `_platform` scope, 7.82 MB / 4,852 entries, by top-level section:
`reference` 3.85 MB (3,070), `glossary` 0.95, `uml` 0.91, top-level pages
0.65, `processes` 0.64, `proposals` 0.52, `architecture` 0.15, `guides`
0.13, `research-and-analysis` 0.02. First-search script cost measured at
~0.33 s per MB of scope (#1988's table).

The site's sections are pages rendered INSIDE the one declared `docs` graph,
not graph directories of their own — so they cannot be read off the
declarations. The rule is a declared BUDGET instead: a platform section whose
entries exceed 512 KiB becomes its own `section` scope. At 512 KiB: five
section scopes, platform remainder 0.95 MB.

## Done when
- [x] `search-split.ts`: platform entries in a section over the budget become a `section-<name>` scope; the budget declared with its basis; the manifest carries them (kind `section`)
- [x] the client loads a section page's own section scope; other platform pages the remainder; "Search everywhere" unchanged
- [x] tests: section rule at a small budget, partition still exact, client picks the section — mutation-checked
- [x] measured: first search on a `/reference/` page and on `/`
- [ ] green on CI, PR ready

## Measured with the change (2026-10-03, local build, median of 3)

`search-split.ts` at 512 KiB: five section scopes — `reference` 3.85 MB,
`glossary` 0.97, `uml` 0.91, `processes` 0.66, `proposals` 0.53 — and a
0.90 MB platform remainder. (`proposals` crosses only because a section's own
index page counts as part of it — `sectionOfPath`.)

| page | scope | first search | script | heap |
|---|---|---|---|---|
| `/` | `_platform` 0.90 MB | 0.68 s | 537 ms | 50 MB |
| `/reference/skills/…` | `section-reference` 3.85 MB | 1.88 s | 1,732 ms | 116 MB |
| `/smart-trust/` | `smart-trust` 1.50 MB | 0.57 s | 436 ms | 48 MB |

Before this bean `/` loaded the whole 7.8 MB platform scope: 3.65 s, 194 MB.
