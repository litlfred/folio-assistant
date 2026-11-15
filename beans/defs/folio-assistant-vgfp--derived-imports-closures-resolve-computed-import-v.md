---
# folio-assistant-vgfp
$schema: bean/1.0.0
title: 'Derived imports closures: resolve computed-import verdicts (kind-validator, harness-config tables) from the declarations at fingerprint time, instead of static globs'
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:36:36Z
updated_at: 2026-11-08T07:20:00Z
parent: folio-assistant-x35i
---

From "CI speed 8" (litlfred/cat-harness-tools#1499): narrowing showed that the 142 gates sharing one closure are held there by real imports. Computed imports (the kind-validator and harness-config tables) are matched today by static globs, which pull in far more than they read.

Fix: work out the verdicts of those computed imports from the declarations at fingerprint time, so each gate's closure is exactly what it imports.

## Done when
- [x] the computed-import verdicts are resolved from the declarations at fingerprint time
- [x] the share of the 142 gates that fall out of the shared closure is measured (run IDs cited)

_2026-11-05T12:35:29Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk at the request of the analysis session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

*2026-11-05* — PR https://github.com/litlfred/cat-harness-tools/pull/1525. It is stacked on #1499 and must be retargeted to main once #1499 merges.

What the PR does:
- The three computed loads now carry `declared validator-refs` and `declared plugin-tables`, which `scripts/declared-imports.ts` resolves from the declarations at fingerprint time.
- The ci-cone (traced) fingerprint audits the targets of computed loads but does not hash them; the trace's read set covers the ones a run loaded.
- Gates do not declare which kinds they read. The trace gives that answer per gate, so no new declaration was added.

Measured with mbd8's method (a static closure walk over the 209 task-io tasks; 142 reach node-kind-index). All 142 shrink:
- untraced fingerprint: median 495 → 404 files (max 533 → 446);
- traced (ci-cone) base hash: median 66 files (range 28–222), with a median of 1 `src/` file (16 before).
- The 142 now have 67 distinct closure sizes, where before they shared one closure.

The CI-run criterion is still open: it needs a green main record under recipe 5. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T14:08:18Z_ — Overlap with litlfred/cat-harness-tools#1520 (CI speed 8, approved, merges first): both set `input-hash.ts` RECIPE_VERSION 4 → 5, and both edit `fingerprint()` / `trackedTreeDigest`. When #1525 is brought onto main after #1499, bump RECIPE_VERSION to 6 and resolve the conflict. #1527's test-gate fingerprint uses `treeReplayed: true`, so the computed-load change applies to it too; both sessions agree that is sound. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-05T17:59:05Z_ — litlfred/cat-harness-tools#1525 merged as fa13d2c (owner approved). It was rebased onto main with RECIPE_VERSION 6, because #1520 holds 5. The last box (skips counted on real PR runs) waits for a green main run that records under recipe 6. Session https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.

_2026-11-08T07:20:00Z_ — Verified and closed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3):
- **Share of the 142 gates falling out of the shared closure**: **142 / 142 (100%)** fell out of the single 494-file shared closure into **67 distinct untraced closure sizes** (median 495 → 404 files) and a traced (`ci-cone`, `treeReplayed: true`) base-hash median of **66 files** (range 28–222; 144 of 209 `task-io.ts` tasks today, median 67 files, range 28–229).
- **Live CI runs under `RECIPE_VERSION = 6` (`cat-harness-tools#1525` @ `fa13d2c`, re-pinned into `folio-assistant` via `#3012` @ `2808845b5236`, `#3029` @ `46a8ffbce4b9`, and `#2985` @ `da3ca528562a`)**:
  - **`litlfred/folio-assistant` `Code-quality gates` (`code-quality-gates.yml`)**: `main` push runs `42406566912` (`2808845b5236`) and `42412126727` (`46a8ffbce4b9`, `#3029`, 2026-11-07T20:39:49Z) recorded **36 `{tracked}` CQG gates** across jobs `128526554515` (15), `128526554628` (20), and `128526554570` (1), including **22 of the `node-kind-index` gates** with distinct traced path counts (`kg:audit:all:check` 346, `agent-memory:check` 566, `check:declared-dirs` 864, `check:voice-skills` 925, `library:readmes:check` 1591, `kg:detangle:direction` 1953, `check:skills` 2146, `folio:viz:check` 2178, `voices:viz:check` 2378, `upload-step:docs:check` 2454, `check:workflow-policy` 2782, `skill:commands:check` 2937, `check:workflow-refs` 3210, `translation:index:check` 4895, `check:tools` 4917, `translation:drift:check` 5330, `check:lane-documentation:check` 6057, `check:rendered-labels:check` 6635, `check:soft-hyphens` 7054, `lsi:viz:check` 17423). Subsequent PR run `42413770441` (PR `#3031` @ `131a43067c86`, 2026-11-07T21:00:42Z) skipped **23 of 36 recorded CQG gates** (`10` + `12` + `1` across jobs `128530655425`, `128530655463`, `128530655431`), including **14 of the `node-kind-index` gates**, while running the gates whose individual closures were touched.
  - **`layer-pr-checks.yml` (`PR checks` across the full ~296-gate derived set)**: `litlfred/smart-base` `main` push runs `42415774450` (`907c4cbe96`) and `42416920286` (`2944eebf7d`) recorded **105 gates** in `cone/records.json` under recipe 6 and skipped **79 of 296 gates** (`18/73` + `22/75` + `14/74` + `25/74`); `litlfred/smart-base` PR run `42417250994` (`9c5402cc1d`) skipped **60 of 296 gates** on base (`17/66` + `14/73` + `18/71` + `11/86`) and **54 of 296 gates** on head (`14/66` + `14/73` + `16/71` + `10/86`); `litlfred/folio-assistant-core` PR runs `42389441966` (`4621582fef`) and `42389452657` (`f2913941cd`) skipped **71 of 278 gates** (`0/1` + `24/101` + `17/53` + `10/57` + `20/66`).
