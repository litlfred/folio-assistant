---
# folio-assistant-n5be
title: 'glossary visualiser: 6 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-glossary
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/glossary/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **There is no way to find a term** except scrolling or the browser's find. The page has no search, no filter and no A–Z jump, and its 46 rows run to about 8,000 px at desktop width and 16,000 px at phone width. (→ `folio-assistant-0fua`)
2. **The order is not alphabetical by the displayed name.** Rows follow the role id, so **Activity log** (`role/log`) comes after **Librarian**, and **Human translator** (`role/translator`) comes after **Translation coordinator**. A reader scanning by title will miss them.
3. **Markdown shows through.** The descriptions are escaped plain text, so inline code appears with literal backticks, for example "Inherits \`reviewer\`" and "\`adjudication\` permission". (→ `folio-assistant-mylx`) (→ `folio-assistant-qgjh`)
4. **The term column is wide and dominated by the path.** Each term is followed by the full `cat-harness/glossary/glossary-ledger.json#role/…` path, which breaks mid-token (`…#role/adjudi / cator`). At 390 px this leaves about 200 px for the definition, the part the reader came for.
5. **The heading is repetitive.** "Glossary `glossary`", the sub-graph path in the lede and the single sibling row all state the same scope three times before the first term.
6. **The count differs from the declaration.** The `glossary` declaration's comment says "44 terms", but the page shows 46.

When fixed, re-draw `cat-harness/docs/wireframes/glossary/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
