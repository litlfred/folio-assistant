---
# folio-assistant-0fua
title: Long flat lists with no search or filter
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

Pages of 46 to 240+ rows are one flat list with no search, filter or grouping, so finding an entry means scrolling tens of thousands of pixels on a phone. Add a filter and grouping in the shared list component.

Observed on: `glossary`, `processes`, `skills-index`, `tools` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 4 still present, 0 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — Long flat list, no search/filter/grouping — glossary: One table, 48 rows (was 46), 0 search/filter inputs, 0 A–Z jump links, 0 h2. docH 8,909px at 1280 and 18,908px at 390. (lists.mjs)
- **STILL-PRESENT** — Long flat list, no search/filter/grouping — processes: 7 tables (4/74/99/105/3/2/14 rows = 301). The only input is the theme site search, with no in-page filter. docH 15,255px at 1280 and 16,299px at 390. (lists.mjs)
- **STILL-PRESENT** — Long flat list, no search/filter/grouping — skills-index: One table, 270 rows, 0 filter inputs, 0 folder headings. docH 22,417px at 1280 and 67,046px at 390. (lists.mjs)
- **STILL-PRESENT** — Long flat list, no search/filter/grouping — tools: The main table has 104 rows (tool|what it does|invoked|satisfies|i/o). The only input is site search. docH 11,690px at 1280 and 22,497px at 390. (lists.mjs)
