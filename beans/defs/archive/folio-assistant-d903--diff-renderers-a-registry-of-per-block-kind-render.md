---
# folio-assistant-d903
title: 'DIFF RENDERERS: a registry of per-block-kind renderers the reviewer selects — word, inline, side-by-side, DAK-structural, visual'
status: completed
type: task
priority: normal
created_at: 2026-09-22T21:02:54Z
updated_at: 2026-09-23T10:00:24Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
---

Owner: *"select different diff rednerers/viz"*.

**What.** A renderer registry, declared as DATA: `{ id, label, appliesTo:
block kinds, input: ChangeSet entry }`. The review page offers a selector per
block, plus a default per kind. Candidate renderers, cheapest first:

1. **word diff of the source prose**: `<ins>`/`<del>`, no rendering needed.
2. **inline rendered diff**: the rendered HTML of both sides, with changes
   highlighted in place.
3. **side-by-side**: MAIN and STAGING in two synced panes, scrolled to the block.
4. **structural diff for DAK artefacts**: a decision-table row, a data element,
   an indicator or a FHIR profile element compared as fields, not as text.
5. **visual/pixel diff**: screenshots overlaid, for figures, diagrams and
   tables whose markup diff is meaningless.

**Measured.** The repo has **no** diff library today (no htmldiff,
diff-match-patch or pixelmatch). Adding one is a dependency decision, and
NOTICE / THIRD-PARTY-NOTICES must follow.

**Why a registry.** A single "the diff" gets it wrong for at least one block
kind. The DAK structural case is the proof: a text diff of a decision table is
unreadable.

## Done when
- [x] the registry schema is in folio-assistant-core/schemas, and renderers are chosen per block kind
- [x] renderers 1–3 are shipped; 4 and 5 are each a child bean or scrapped with reasons
- [x] the choice persists per viewer (localStorage, wrapped in try/catch) and the page works without it


## Roast correction 2026-09-22 (epic q4jm, R5)

The registry describes rendering tools, so its schema goes in **cat-harness/schemas**, not folio-assistant-core (core AGENTS.md: skills, workflows, roles and tools schemas belong in the harness). The review page JS is its own module, **not** added to docs-ui.js (R8).

## Built 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE)

The first box's wording says "core"; the schema is in
`cat-harness/schemas/diff-renderers.ts`, as the roast's R5 correction
required.

- **Registry** `cat-harness/schemas/diff-renderers.ts`: word (the `*`
  fallback), inline (prose, remark, definition, example), side-by-side
  (table, figure, diagram, equation, simulator). Each declares what it
  `needs`. A test holds every default kind to `BLOCK_KINDS`, which caught
  five fictional kinds in my first draft.
- **Data** `changeset-text.json` (`--text-out` on the ChangeSet, same
  materialised trees): source and rendered prose of each listed block, per
  side. A renamed block's base is read under its old label.
- **No diff dependency**: `cat-harness/scripts/word-diff.ts`, an LCS over
  word tokens with prefix/suffix trimming and a size cap that is SAID, not a
  frozen tab.
- **Renderers** `cat-harness/scripts/review-renderers.ts`, embedded in the
  page with `toString()`, so the tested functions are the ones that run.
  Inline maps the word diff back onto the head's rendered text nodes and
  keeps its markup. Rendered HTML is parsed with DOMParser and cleaned
  (scripts, embeds, `on*`, `javascript:`).
- **Page**: a per-block selector plus a page-level one, remembered in
  localStorage under try/catch. An unavailable renderer is listed disabled
  with its reason. Typing in a selector is not j/k navigation.
- **Verified**: 7 Playwright tests in CI (`review-diff.e2e.ts`, including
  the `onerror` stripping), plus a real scaffolded folio built twice (main
  and edit), driven in Chromium in light and dark.

**Renderers 4 and 5 are child beans:** `f327` (DAK structural) and `0rxe`
(pixel diff).
