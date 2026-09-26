---
# folio-assistant-oqdr
title: Bootstrap diagrams' SVGs are published but rendered by nothing since the split
status: in-progress
type: bug
priority: normal
created_at: 2026-09-24T17:52:19Z
updated_at: 2026-09-26T09:51:47Z
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
