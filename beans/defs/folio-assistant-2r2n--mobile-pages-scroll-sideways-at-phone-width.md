---
# folio-assistant-2r2n
title: 'Mobile: pages scroll sideways at phone width'
status: todo
type: bug
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-23T10:36:13Z
parent: folio-assistant-4ccr
---

A page wider than a 390 px viewport makes the reader pan sideways to reach columns or actions. Fix in the shared table/grid CSS: wrap, stack or collapse columns at narrow widths, and let only a table's own container scroll, with a visible cue.

Observed on: `catalogue`, `folio`, `fsh-guts`, `kg-viewer`, `library`, `navbar`, `processes`, `skills-index`, `tools`, `translation-status`, `uploads` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.
