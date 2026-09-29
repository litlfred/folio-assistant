---
# folio-assistant-mylx
title: Raw Markdown backticks show in rendered text
status: in-progress
type: bug
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-29T22:51:20Z
parent: folio-assistant-4ccr
---

Descriptions carried from Markdown front matter or prose are rendered as plain text, so the backticks show. Render inline code (or strip the markers) in the shared text path.

Observed on: `fsh-guts`, `glossary`, `methodologies`, `navbar`, `skills-index`, `voices` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.

_2026-09-29T22:51:20Z_ — Claimed by claude/charming-curie-n04agq — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
