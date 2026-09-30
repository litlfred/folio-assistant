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

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 6 still present, 0 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — 1. Most rows say nothing: 258 of 296 rows read 'no description in the artefact' (was 187/217).
- **STILL-PRESENT** — 2. Non-pages indexed as authored documentation pages: The first 4 rows are still cat-harness/docs/_includes/{footer_custom,harness_details,head_custom,landing}.html (6 _includes rows in all). There are also 124 uml/overview rows and 44 wireframes/ rows.
- **STILL-PRESENT** — 3. Names collide: Duplicate link texts: intent ×21, index ×20, as-is ×19, qa ×15, skills ×8, accessibility ×6.
- **STILL-PRESENT** — 4. YAML quotes kept: 13 descriptions are wrapped in literal quotes, e.g. '"folio-assistant — إطار عمل مهارات وكيل مستقل عن المحتوى."'.
- **STILL-PRESENT** — 5. Table cannot be searched, filtered or grouped: 296 rows in one table with 0 filter inputs and 0 h2/h3 grouping. 40 locale (ar/es/fr/ru/zh) rows are interleaved by path. docH 22,424px at 1280 and 39,202px at 390.
- **STILL-PRESENT** — 6. Phone layout favours the path: 390x844, first body row: name+path cell 164px, description cell 132px, so 'no description in the artefact' still wraps over several lines. There is no page-level horizontal scroll (scrollWidth 390).
