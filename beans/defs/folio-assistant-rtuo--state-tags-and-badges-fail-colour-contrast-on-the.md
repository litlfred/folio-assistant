---
# folio-assistant-rtuo
title: State tags and badges fail colour contrast on the dark theme
status: in-progress
type: bug
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-30T11:11:43Z
parent: folio-assistant-4ccr
---

Tag and badge colours are fixed hex values that measure about 2.0–2.7:1 on the dark ground, below the WCAG 4.5:1 minimum for small text. Move them onto theme tokens that are validated in both schemes.

Observed on: `external-schemas`, `fsh-guts`, `kg-viewer`, `methodologies`, `navbar`, `tools` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.

_2026-09-30T11:11:43Z_ — Claimed by claude/charming-curie-n04agq — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
