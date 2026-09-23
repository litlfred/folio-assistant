---
# folio-assistant-qbfm
title: 'tools visualiser: 6 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-tools
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/tools/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **No way to find one tool among 71 except page search.** The only way in is a flat alphabetical table. It has no filter by invocation or by skill, and the stat boxes and invocation counts are not links into the rows they count. (→ `folio-assistant-qgjh`) (→ `folio-assistant-0fua`)
2. **Skills and tool ids are not links.** `satisfies` is rendered as `code` text. A reader who wants the skill has to copy the name and search for it. This is the very join the page exists to show. (→ `folio-assistant-qgjh`)
3. **Invocation tags fail contrast on the default dark scheme.** The page's inline `<style>` sets fixed hex colours: `.tg-shell #0d6e5e`, `.tg-mcp #6b5b95`, `.tg-inproc #1d5fa8`, `.tg-manual #a8430f`. On just-the-docs' dark body (`#27262b`, and `color_scheme: dark` in `_config.yml`), I computed 2.44, 2.54, 2.33 and 2.48 to 1, all at 11.5 px. That is below the 4.5:1 floor. The tag text carries the meaning, so colour is not the only channel, but the text itself is hard to read. (→ `folio-assistant-rtuo`)
4. **Mobile: the main table is 5 columns wide in a 358 px column.** Below 800 px, "invoked", "satisfies" and "i/o" are off-screen until the reader scrolls the table sideways. Nothing on screen says the table scrolls, and each row is several screens tall because the description column wraps to about 20 characters. (→ `folio-assistant-2r2n`)
5. **The "▾ Folio" handle overlaps the top of the content column at both widths.** It is fixed at top centre (`.fa-glass-handle`, `min-height: 3.25rem`). At 390 px it sits over the theme's top bar. (→ `folio-assistant-015u`)
6. **"On this page" (4 entries) exists only in the opened sidebar.** At rest the strip hides the page index, so on a page this long the section list is two interactions away.

When fixed, re-draw `cat-harness/docs/wireframes/tools/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
