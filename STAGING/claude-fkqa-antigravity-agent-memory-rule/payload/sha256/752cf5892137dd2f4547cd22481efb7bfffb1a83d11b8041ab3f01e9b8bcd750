---
# folio-assistant-nnpk
title: 'schemas visualiser: 5 wireframe findings'
status: todo
type: task
priority: normal
tags:
    - wireframe-findings
    - ui
    - visualiser-schemas
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-30T16:12:47Z
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

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 0 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — On a phone, picking a declaration shows nothing (detail below list, scrollY stays 0): 390x844: selecting ArchiveContentsSchema leaves scrollY at 0. #detail top is 822 px in an 844 px viewport, so only 22 px shows. Focus is not moved into #detail.
- **STILL-PRESENT** — Nested scrolling on a phone (list scroll box ~2/3 screen): #items overflow-y auto, max-height 590.8 px at 390x844 (70% of height; 560 px at 1280). 400 li rendered of 1036 declarations (was 812).
- **STILL-PRESENT** — Diagram instruction says 'filter above' but module filter is below; empty height: details#overview opened: #ov-cap says 'Pick a module in the filter above...'. The caption is at y 335 and select#mod at y 723 (390); at 1280 they are at 187 and 473. #ov-svg is 150 px tall with 0 children; .ov-body is 287 px (390) and 228 px (1280).
- **STILL-PRESENT** — Field table breaks identifiers mid-token at 390 px: At 390, 10 space-free cells wrap onto more than one line, incl. 'n_entries', 'z.literal(ARCHIVE_CONTENTS_SCHEMA_ID)', '$schema', 'archive', 'entries'. At 1280, 7 still wrap, incl. 'uncompressed_bytes'.
- **STILL-PRESENT** — UML box truncates field types at fixed width even at 1280: #detail svg text at 1280 includes '$schema: literal(ARCHIVE_CONTENTS_SCH' and 'archive: record(z.string(), z.unknown'. The full types appear only in the table.

## Re-verified 2026-09-30 on `main` 3779d5d27

Each finding re-measured on a local build of that commit (`preview-site.sh`, served at `/folio-assistant/`), at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 0 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — On a phone, picking a declaration shows nothing (detail below list, scrollY stays 0): 390×844: selecting ArchiveContents or ArchiveContentsSchema leaves scrollY at 0. #detail top is at 822px in an 844px viewport, and focus is not moved into #detail. (C_sch.mjs, C_sch2.mjs)
- **STILL-PRESENT** — Nested scrolling on a phone (list scroll box ~2/3 screen): #items is overflow-y auto with max-height 590.8px at 390×844 (560px at 1280). 400 li are rendered of 1042 declarations (was 1036). (C_sch.mjs)
- **STILL-PRESENT** — Diagram instruction says 'filter above' but module filter is below; empty height: #ov-cap says 'Pick a module in the filter above…'. The caption is at y 335 and select#mod at y 723 at 390 (187 and 473 at 1280). #ov-svg is 150px tall with 0 children. .ov-body is 287px (390) and 228px (1280). (C_sch.mjs)
- **STILL-PRESENT** — Field table breaks identifiers mid-token at 390 px: ArchiveContentsSchema at 390: 10 space-free cells wrap onto more than one line, including '$schema', 'archive', 'entries', 'n_entries' and 'z.literal(ARCHIVE_CONTENTS_SCHEMA_ID)'. At 1280, 7 still wrap, including 'uncompressed_bytes'. (C_sch2.mjs)
- **STILL-PRESENT** — UML box truncates field types at fixed width even at 1280: #detail svg text at 1280 still includes '$schema: literal(ARCHIVE_CONTENTS_SCH' and 'archive: record(z.string(), z.unknown'. (C_sch2.mjs)
