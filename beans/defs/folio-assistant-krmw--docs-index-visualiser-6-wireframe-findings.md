---
# folio-assistant-krmw
title: 'docs-index visualiser: 6 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-docs-index
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/docs-index/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **Most rows say nothing.** 187 of 217 rows read *no description in the artefact*, so the table is mostly a list of paths.
2. **Non-pages are indexed as "authored documentation pages".** The six `cat-harness/docs/_includes/*.html` layout partials still come first in the table, ahead of every real page. The index now also lists 99 generated UML overview pages, 33 wireframe files (candidates and intents) and two generated visualiser pages. Together these are 140 of the 217 rows.
3. **Names collide.** 17 rows are named `index`, 17 `intent`, 16 `as-is` and 6 `agent-onboarding`. The link text is identical, so the rows can be told apart only by the path under each name. The link list a screen reader announces is ambiguous.
4. **The YAML quotes are kept.** Twelve descriptions are shown wrapped in literal quotation marks, for example `"folio-assistant — 内容无关的智能体技能框架。"`.
5. **The table cannot be searched, filtered or grouped.** Locale copies (`ar`, `es`, `fr`, `ru`, `zh`) sit among the English pages by path order, and the 99 UML pages and 33 wireframe files sit between `translation-support` and `zh/index`. Both `docs` (217 rows) and `smart-trust-docs` (676 rows) are single pages.
6. **The phone layout favours the path.** At 390 px the first column (`width: 26rem`, capped by the viewport) takes about 220 px for the name and path. That leaves about 130 px for the description, so *no description in the artefact* wraps over several lines.

When fixed, re-draw `cat-harness/docs/wireframes/docs-index/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
