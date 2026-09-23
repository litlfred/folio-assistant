---
# folio-assistant-0rxe
title: 'DIFF RENDERER: visual (pixel) diff — before/after screenshots overlaid, for figures, diagrams and tables whose markup diff is meaningless'
status: completed
type: task
priority: normal
created_at: 2026-09-23T10:00:13Z
updated_at: 2026-09-23T16:28:23Z
parent: folio-assistant-q4jm
---

Child of d903 (renderer 5 of the five it listed).

Needs, before it can be built:
- screenshots of each changed block on both sides, taken in the staging job (Chromium is available there), cropped to the block's anchor;
- a pixel-compare library (pixelmatch or similar): a DEPENDENCY decision, with NOTICE / THIRD-PARTY-NOTICES to follow; the owner decides;
- a registry entry with a new `needs` input (`screenshots`), defaulting for figure and diagram.

Side by side (shipped in d903) covers most of the reviewer's need meanwhile.

## Done when
- [x] the dependency is approved or a no-dependency compare is chosen. **Owner, 2026-09-23: "Add as skill/tool and incorporate onto processes"**. No dependency: Playwright takes the pictures, and Chromium's canvas compares them (`comparePixels`, embedded with `toString()`).
- [x] the staging job publishes block screenshots: `folio-staging.yml` step "Picture changed figures, diagrams and tables", which runs the `folio-block-screenshots` Tool (`cat-harness/scripts/block-screenshots.ts`). Chromium is installed only when `--count` is above zero.
- [x] an overlay renderer is registered and tested in the browser: `visual` in `diff-renderers.ts`, with `renderVisual` in `review-renderers.ts`. It offers four radio views (Changed pixels, Before, After, Both), one click each and no slider, because a slider is a drag. Tests: `block-screenshots.test.ts`, `block-screenshots.e2e.ts` (the Tool in Chromium), and `review-visual.e2e.ts` (keyboard only).

## Summary of Changes

- **Tool:** `folio-block-screenshots` (`cat-harness/scripts/block-screenshots.ts`, declared in `cat-harness/tools/index.ts`) pictures each changed visual block on the published main site and on the staging build. A block's region runs from its anchor to the next anchor. It compares the pictures in Chromium's canvas and writes `visual-diff.json` (`folio-visual-diff/v1`) and `visual/*.png`. A side it cannot picture is recorded as `missing: page | anchor`.
- **Skill:** `visual-diff` (`cat-harness/skills/folio-core/visual-diff.md`), carried by the `reviewer` and `review-coordinator` roles.
- **Process:**
  - `content-change-review.bpmn` *Compare main vs staging* names the skill;
  - `folio-staging.yml` runs the Tool after the publish branch is checked out;
  - `staging-review` lists the renderer.
- **Review page:** the `visual` renderer is the default for figure, diagram, table, equation and simulator, with side by side second. A block opens on the first renderer that lists its kind and can run.
- **Also fixed:** `docOf` and `pageOf` now refuse `.` and `..` as a document segment, which the character class had let through. The page's help line now names `u`.
- **Verification:** unit tests, the Tool end to end in Chromium, the renderer keyboard-only, and a visual check in light and dark.
