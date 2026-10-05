---
# folio-assistant-tfqf
title: 'QA READERS F6: docs site, staging and preview publish QA from qa-reports — silent shrink of /assets/qa and a false 965 to 2 count'
status: in-progress
type: task
priority: high
created_at: 2026-10-01T08:47:14Z
updated_at: 2026-10-01T16:44:05Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, §5.3 family F6). **Refines and supersedes the docs-site and staging half of `2ae2`.** The audit found that `2ae2`'s three MCP sites are not readers (§5.4). Blocked on `16ei`. **CRITICAL: two false-cleans.**

## Readers
- `.github/workflows/docs-site.yml:149` `gen-docs-pages.ts` (write) → page badges and witnesses (C). Absent today: all **136** live badges become "not swept", and the build stays green. HIGH. Measured by a write-mode run, which was reverted.
- `docs-site.yml:612` `cp -rT cat-harness/test/results/witnesses` (C). It would crash on a missing directory, but line 149 recreates it first.
- **C10** `docs-site.yml:618` and `.github/workflows/feature-staging.yml:1089-1099` (`find … *.qa-results.json -exec cp`) (C). **FALSE-CLEAN.** Only what this build wrote is published; the rest of the 20 files vanish from `/assets/qa/` and the step stays green.
- **C9** `cat-harness/content/pipeline/qa-graph-index.ts:172` via `cat-harness/scripts/gen-docs-pages.ts:1489-1513` → `docs/assets/qa/index.json`, the tile, and `state-visualizer.ts:298,761,792` (C). **FALSE COUNT**: 965 documents → 2. `docs:pages:check` does not grade the projection. Measured.
- `gen-docs-pages.ts:260,350,981,1585` (`--check`) (A/C). Loud: 12 files stale.
- `cat-harness/content/pipeline/qa-witness.ts:304,326,342,565` (C). Correct unknown: "not swept".
- `cat-harness/scripts/preview-site.sh:184-188` (C). Correct unknown, but quiet.
- `cat-harness/docs/_includes/head_custom.html:282-283`, `cat-harness/docs/assets/js/docs-ui.js:9360,9516` (C, in the browser). Correct unknown on a 404.
- `cat-harness/scripts/publish-block-qa.ts:170` (`folio-staging.yml:315`) → `review-heat.ts`, `gen-review-page.ts:390` (C). Correct unknown: "unaudited".

## Migration action
- `qa:fetch --ref main/<sha>` (docs-site) or `--ref pr/<n>/<sha>` (staging) before `gen-docs-pages.ts`. The two copies read from the fetched tree.
- The copy step compares its count with the branch manifest's `verdict counts`, and fails on a shortfall.
- `readQaGraph` takes the fetched tree, and reports `unknown` on a miss rather than a count.
- `preview:site` runs `qa:fetch`, and says so when the fetch misses.

## Done when
- [ ] badges and the heat map render identically from the branch; before and after screenshots are sent (`rendered-verification`)
- [x] with no fetch, the docs build fails or labels its QA evidence `unknown`; it never publishes a smaller set silently
- [x] the `assets/qa/index.json` tile shows the branch's count, or `unknown`

## Summary of Changes

Branch `qa-readers-f5-f6-c8uq-tfqf` (commits `e0a45999`, `c5e6d011`, `6e178fb1`), not pushed.

- **New `cat-harness/scripts/qa-site-assets.ts`.** `fetch` (before the generator) reads the store entry into scratch; the checkout wins while `test/results/` is committed; otherwise a hit is materialised (`fetched`, or `fetched-fallback`, labelled); neither is `unavailable`, a stated `::warning`. Corpus presence = a verdict family (`kg-qa`/`block-qa`/`translation-qa`), never "any file" (a build's own `kg-export.qa-results.json` fooled the first version — found by the absent run). `verify` (after the copy) fails on a shortfall against the fetch-time counts and publishes `assets/qa/availability.json`.
- **Workflows.** `docs-site.yml` fetches `main/<sha>` (fallback `main`), `feature-staging.yml` `pr/<n>/<head>` (fallback `pr/<n>`); both copies are guarded and then verified (C10). `folio-staging.yml` fetches the folio's own `pr/<n>` before its sweep and reports hit/miss/unknown. `preview-site.sh` mirrors docs-site. `check:workflows` green (no raw push to `qa-reports`).
- **Readers.** `qa-witness.ts` `qaCorpusAvailability`; `gen-docs-pages.ts` asks it before writing: badges say "not available in this build" (`fa-qa-unavailable`), and `assets/qa/index.json` publishes `availability: unknown` with no tile count (C9: was 965 → 2). `qa-graph-index.ts`: `QaGraphIndex = census | unknown`. `state-visualizer.ts` renders the unknown. `publish-block-qa.ts` carries `corpus: present|absent`; `gen-review-page.ts` says "QA not available for this build".

Rendered (preview:site + Playwright, screenshots in the session scratchpad): absent+miss → 25/25 badges `not available`, /qa/ page "Not available in this build … unknown, not zero", 0 HTTP ≥400; absent+fetch `pr/1764/a4c54517…` → 163 witnesses + 17 results materialised byte-identical, `docs:pages:check` clean, 986 documents, badges paint verdicts and the panel opens. A planted 2-file shrink fails `verify` (exit 1).

**Open:** the heat-map half of the first box was not rendered (needs a folio staging build); `docs/qa/index.html` is a committed page `docs-site.yml` does not regenerate, so after `5hox` it shows the last committed census until `state:visualizer` runs.

