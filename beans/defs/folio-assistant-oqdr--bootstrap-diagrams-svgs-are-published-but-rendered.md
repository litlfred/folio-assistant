---
# folio-assistant-oqdr
title: Bootstrap diagrams' SVGs are published but rendered by nothing since the split
status: completed
type: bug
priority: normal
created_at: 2026-09-24T17:52:19Z
updated_at: 2026-09-26T09:54:12Z
parent: folio-assistant-vke6
---

## What
`cat-harness/docs/assets/img/workflows/` holds `initialize-harness.svg`, `log-message.svg` and `discussion.svg`, whose sources are `bootstrap/processes/*.bpmn`. `render-bpmn.ts` renders `workflowFiles(cat-harness)`, which does not reach bootstrap, so these three are never re-rendered and `render:bpmn:check` cannot see them drift. The generated process pages (`docs/processes/initialize-harness.md`, `log-message.md`) embed them.

Seen 2026-09-24 while deriving subprocess links (bean `xl55`): `initialize-harness.svg` still carries the pre-`xl55` fallback link `assets/img/workflows/log-message.svg`, which resolves to nothing from the SVG's own location.

`bootstrap.svg` in the same directory has no diagram at all — possibly an orphan. Per deletion-requires-confirmation, it is reported, not removed.

## Done when
Bootstrap's diagrams are rendered and checked (by render-bpmn over every instance, as gen-processes-viz already does with `instanceRoots`), or their SVGs move to bootstrap's own site layer; and the owner has decided about `bootstrap.svg`.



## Re-measured 2026-09-26 (session_01ERf1yH3k69x37rXCrb6GYt, while salvaging #1340/#1040)

Still true, and now visibly wrong. `cat-harness/docs/assets/img/workflows/initialize-harness.svg` was last written by `cf04dd6e9b6` (2026-09-20); `bootstrap/processes/initialize-harness.bpmn` has had **10 commits** since, including the Initiator → Bootstrapping Agent rename (`ad278cb23a5`). `cat-harness/docs/processes/initialize-harness.md` embeds it, so the published page shows a pre-rename diagram.

Found because a repo-wide fix could not reach it: the gateway-marker salvage set `isMarkerVisible="true"` on 46 exclusive-gateway shapes in 25 diagrams. `render:bpmn` re-rendered 24 SVGs (X-marker paths 3 → 46), and the 3 shapes in `initialize-harness.bpmn` changed nothing in its SVG. `render:bpmn:check` still exits 0, because it checks only what `workflowFiles(ROOT)` returns for the cat-harness instance. **A stale SVG from a dependency instance is invisible to the only gate that checks SVG staleness.**

_2026-09-26T09:51:47Z_ — Claimed by claude/oqdr-render-bootstrap-diagrams — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).



## Summary of Changes — 2026-09-26 (branch claude/oqdr-render-bootstrap-diagrams)

**Done when, both halves:**
- [x] Bootstrap's diagrams are rendered and checked — by `render-bpmn` over every instance (`instanceRootsIn`), the first of the two options this bean offered.
- [x] The owner decided about `bootstrap.svg`: **delete** (2026-09-26, selected). Its source `bootstrap.bpmn` was deleted in `7d57e2d2790` ("bootstrap: one process…"); its element ids (`Start_Pointed`, `Gate_IsInstance`) exist in no current `.bpmn`, and nothing links to it. The two apparent references are to `/assets/img/uml/overview/bootstrap.svg`, a different file.

**What changed.** `bpmnSources()` walks `workflowFiles` for every instance root instead of cat-harness's alone. Measured first: the union is exactly the 74 committed `.bpmn`, and the only additions are bootstrap's three (`folio-assistant-core` and `smart-base` were already reached through cat-harness's overlay). The basename collision the old docblock called latent is now **refused**: two same-named diagrams in different instances throw, naming both.

**Verified, both directions, with a control:**
- the re-render changed exactly the three bootstrap SVGs and no other — nothing outside the widened source set moved;
- `initialize-harness.svg`: `Initiator` 2 → 0, `Bootstrapping Agent` 0 → 1; its sub-process link `assets/img/workflows/log-message.svg` (resolved to nothing, per this bean) → `../../../processes/log-message.html`;
- a bootstrap label mutated without re-rendering: this branch's `render:bpmn:check` exits **1** naming `log-message.svg`; main's script on the same mutation exits **0**;
- a same-named `activity-log.bpmn` added to `bootstrap/processes/`: exits 1 naming both paths; removed: 0.

**Not done:** moving the SVGs to bootstrap's own site layer (the bean's alternative — a publishing-layout change nobody asked for). The bootstrap declaration says `initialize-harness` *calls* `discussion`, but it holds one call activity (`A_LogFailure` → `log-message`); whatever `discussion` is reached by, it is not a BPMN call, so no second link is expected.
