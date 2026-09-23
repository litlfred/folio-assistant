---
# folio-assistant-dc64
title: Dashboards are dark-only and ignore the colour-scheme setting
status: todo
type: bug
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

The state dashboards (beans, todos, translation status) render dark regardless of the reader's scheme, because the attribute that switches them is set only by a script those pages do not load.

Observed on: `beans`, `todos`, `translation-status` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.
