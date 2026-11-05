---
# folio-assistant-vgfp
$schema: bean/1.0.0
title: 'Derived imports closures: resolve computed-import verdicts (kind-validator, harness-config tables) from the declarations at fingerprint time, instead of static globs'
status: in-progress
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T12:36:36Z
updated_at: 2026-11-05T14:00:35Z
parent: folio-assistant-x35i
---

From "CI speed 8" (litlfred/cat-harness-tools#1499): narrowing showed that the 142 gates sharing one closure are held there by real imports. Computed imports (the kind-validator and harness-config tables) are matched today by static globs, which pull in far more than they read.

Fix: work out the verdicts of those computed imports from the declarations at fingerprint time, so each gate's closure is exactly what it imports.

## Done when
- [ ] the computed-import verdicts are resolved from the declarations at fingerprint time
- [ ] the share of the 142 gates that fall out of the shared closure is measured (run IDs cited)

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
