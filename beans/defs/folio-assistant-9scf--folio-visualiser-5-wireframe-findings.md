---
# folio-assistant-9scf
title: 'folio visualiser: 5 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-folio
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/folio/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **Horizontal scroll at phone width.** At 390 px the document is 769 px wide (`scrollWidth` 769). The node table's *declared in*, *links* and *prose* columns start off-screen, and the whole page pans sideways instead of just the table. (→ `folio-assistant-2r2n`)
2. **The mount handle covers the heading.** The `▾ Folio` button sits over the top centre at both widths. At 390 px it hides "graph" in "folio — the graph", and at 1280 px it overlaps the space above the title. (→ `folio-assistant-015u`)
3. **Links are not links.** The projection gives every link an `href`, for example "RTFM — the cat-harness docs" → `/agentic-harness.html`. The page renders only `esc(l.label)` joined with `<br>`, so none can be followed or reached by keyboard. The generator header says the page shows "whether the links it carries resolve", but no resolution state is shown. (→ `folio-assistant-qgjh`)
4. **Long cells stretch the rows.** `cat-harness` has six link labels in one cell, which makes that row several times taller than the others. At 390 px it becomes a column of wrapped fragments.
5. **Tables have no caption or heading.** Two unlabelled tables follow each other, and only the column headers say which table is which (`declared directory` vs `id`).

Related: `folio-assistant-7ofc`, `folio-assistant-6lb8`

When fixed, re-draw `cat-harness/docs/wireframes/folio/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
