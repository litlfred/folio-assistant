---
# folio-assistant-0g7s
title: 'processes visualiser: 7 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-processes
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/processes/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **"Searchable" in the H1, but the page has no search or filter control.** The only search is the site-wide theme search. Finding one of 68 processes means scrolling or using the browser's find. (→ `folio-assistant-0fua`)
2. **The index is five long tables stacked on one page** (68 + 92 + 103 rows, plus three short ones). "On this page" (7 entries) is only in the opened sidebar. At rest (56 px strip) and on mobile (behind the theme's Menu), there is no visible way to jump between sections.
3. **The index's skill → process column is not linked.** `run by` lists `.bpmn` filenames as code text. The per-process pages exist, but a reader cannot follow "which process runs `adjudication`" to the page for that process. (→ `folio-assistant-qgjh`)
4. **At phone width the BPMN diagram is unreadable at rest.** A 1330 px-wide viewBox scaled to about 358 px is about 0.27×, so the diagram's text of about 12 px renders at about 3 px. The zoom and Full width controls exist, but the diagram offers nothing until they are used.
5. **The purpose is a single paragraph of about 330 words, above the diagram.** On mobile the diagram, which is what the page is for, begins more than a screen down. The lanes and steps cells hold 40 to 190 words each, and on mobile they scroll sideways inside the table wrapper. (→ `folio-assistant-2r2n`)
6. **The "undocumented steps" column mixes "—" with numbers.** "—" means zero, but a reader cannot tell it from "not computed". Now that 66 of 68 rows read "—", the column is almost all dashes.
7. **`nav_exclude: true` on all 69 pages.** The pages are reachable only through the Processes icon (a glyph with an accessible name but no visible label at rest), the Folders list, the C@T Harness divider's "processes" link, or search. The theme's own navigation never lists them.

When fixed, re-draw `cat-harness/docs/wireframes/processes/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
