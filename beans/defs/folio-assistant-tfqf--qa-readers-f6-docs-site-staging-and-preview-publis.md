---
# folio-assistant-tfqf
title: 'QA READERS F6: docs site, staging and preview publish QA from qa-reports — silent shrink of /assets/qa and a false 965 to 2 count'
status: todo
type: task
priority: high
created_at: 2026-10-01T08:47:14Z
updated_at: 2026-10-01T08:47:14Z
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
- [ ] with no fetch, the docs build fails or labels its QA evidence `unknown`; it never publishes a smaller set silently
- [ ] the `assets/qa/index.json` tile shows the branch's count, or `unknown`
