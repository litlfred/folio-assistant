---
# folio-assistant-oqdr
title: Bootstrap diagrams' SVGs are published but rendered by nothing since the split
status: todo
type: bug
priority: normal
created_at: 2026-09-24T17:52:19Z
updated_at: 2026-09-24T17:52:19Z
parent: folio-assistant-vke6
---

## What
`cat-harness/docs/assets/img/workflows/` holds `initialize-harness.svg`, `log-message.svg` and `discussion.svg`, whose sources are `bootstrap/processes/*.bpmn`. `render-bpmn.ts` renders `workflowFiles(cat-harness)`, which does not reach bootstrap, so these three are never re-rendered and `render:bpmn:check` cannot see them drift. The generated process pages (`docs/processes/initialize-harness.md`, `log-message.md`) embed them.

Seen 2026-09-24 while deriving subprocess links (bean `xl55`): `initialize-harness.svg` still carries the pre-`xl55` fallback link `assets/img/workflows/log-message.svg`, which resolves to nothing from the SVG's own location.

`bootstrap.svg` in the same directory has no diagram at all — possibly an orphan. Per deletion-requires-confirmation, it is reported, not removed.

## Done when
Bootstrap's diagrams are rendered and checked (by render-bpmn over every instance, as gen-processes-viz already does with `instanceRoots`), or their SVGs move to bootstrap's own site layer; and the owner has decided about `bootstrap.svg`.
