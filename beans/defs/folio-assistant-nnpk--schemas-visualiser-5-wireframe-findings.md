---
# folio-assistant-nnpk
title: 'schemas visualiser: 5 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-schemas
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/schemas/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **On a phone, picking a declaration shows nothing.** The detail pane is below the 560 px list box, and selecting an item leaves the page where it is (`scrollY` stays 0). The reader sees the highlight move and has to know to scroll past the list to find the result.
2. **Nested scrolling on a phone.** The 812-item list is a 560 px scroll box inside a scrolling page. At 390×844 the box takes about two-thirds of the screen height, so most swipes over the page land in the list.
3. **The diagram's instruction points the wrong way.** Opened with no module chosen, the panel says "Pick a **module** in the filter above", but the module filter is *below* the diagram. The panel also keeps about 200 px of empty height.
4. **The field table breaks identifiers mid-token at 390 px.** "n_entrie / s", "uncompre / ssed_byt / es", "z.literal(ARC / HIVE_CONTENTS / _SCHEMA_ID)". Names and types become hard to read or copy.
5. **The UML box truncates field types** at a fixed width, even at 1280 px ("$schema: literal(ARCHIVE_CONTENTS_SCH", "n_directories: number().int().nonnegative("). The full types appear only in the Fields table below.

Related: `folio-assistant-xgd8`

When fixed, re-draw `cat-harness/docs/wireframes/schemas/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
