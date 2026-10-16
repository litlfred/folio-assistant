---
# folio-assistant-runj
title: 'SEMANTIC SUBGRAPHS slices 1–2: site-chrome/ (PR1) and themes/ (PR2) in cat-harness'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-12T18:40:00Z
updated_at: 2026-10-12T18:40:00Z
parent: folio-assistant-0mpw
---

Proposal: `cat-harness/docs/proposals/semantic-subgraphs-2026-10-09.md` (ruled 2026-10-09). Owner: *"go ahead with the cat-harness chrome subgraph"*; *"put the themes (beyond light and dark) as their own seperate subgraph"*. Rulings used: **D1** *"parse-equal"*, **D2** *"y (or better a docs/ css package)"*, **D3** *"y"* (base light/dark + high-contrast in `site-chrome/`). Stages 3+ are bean `mo75`. Before this bean, no bean carried stages 1–2. Checked: no bean names `site-chrome` or the proposal on this branch, on core main, or on cat-harness-tools main.

## PR1 — `site-chrome/` (stage 1)

- cat-harness#183 (merged 2026-10-12)
- cat-harness-tools#171 (readers)

- [x] `site-chrome/` is declared in `cat-harness.json` with graph typology `docs`, BEFORE `docs`, so it is the base layer of `compose-docs`.
- [x] The chrome moved with its history:
  - 4 includes, 7 CSS files, 7 JS files;
  - the qrcode and wasm-graphviz vendor files;
  - `Gemfile` and `Gemfile.lock`.
- [x] The D2 assets stay in `docs/`: `work-plan.*`, `process-index.js`, `slice-sqlite*`, `kg-render.js`, `vendor/sqlite-wasm`.
- [x] `_config.yml` is cut in two. Merged, the two halves parse to exactly the original (D1). This is asserted in cat-harness `schemas/site-chrome.test.ts` and in the cat-harness-tools `compose-docs` real-tree test.
- [x] Empty `_includes/generated/{navbar-footer,todo-listing}.html` stand-ins are in place.
- [x] `siteLayersFor`, `siteFileFor` and `siteChromeDirFor` are in `schemas/cat-harness.ts`, and the tools readers and writers go through them.
- [x] `baseDocsDir` and `publishedDocsPrefix` pick the PAGES layer (`siteDirFor`), not the first `docs` entry.
- [ ] The generated artefacts that list or hash the moved files are left to the next regen sweep: `docs/payload`, the auto-docs index and the glossary jsonld.
- [ ] folio-assistant needs a repin to pick this up.

## PR2 — `themes/` (stage 2): NOT STARTED, open owner decisions

1. **Where cat-harness's non-base themes go.**
   - (a) `cat-harness/themes/themes.ts` exporting `INSTANCE_THEMES`. This reuses the existing `themes` graph typology and its `instanceThemes()` resolver (who-iris is the precedent). The registry's "NOT the platform's themes" line would be amended. **Recommended**, per "reuse schemas and processes".
   - (b) One node file per theme, which is the proposal's wording. That needs a new node schema and validator, i.e. a parallel mechanism.
2. **The form of the base pair under D3.** `site-chrome/` is composed verbatim into the Jekyll source, so a `.ts` file there would be published.
   - (a) A data file, `site-chrome/_data/base-themes.json`, read by `schemas/themes.ts`. **Recommended.**
   - (b) Keep the base pair as code in `schemas/`. This revisits D3.
3. **The default theme when `themes/` is not mounted.** This is the proposal's own "open point" and is not in the answer tables.
   - (a) The `themes` subgraph declares the default (`pale-sage`), falling back to the base light/dark. **Recommended**, as the proposal proposed.
   - (b) Keep `DEFAULT_THEME_ID = "pale-sage"` hard-coded, so `themes/` must be mounted.
