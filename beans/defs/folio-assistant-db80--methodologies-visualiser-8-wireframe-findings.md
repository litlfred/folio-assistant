---
# folio-assistant-db80
title: 'methodologies visualiser: 8 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-methodologies
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/methodologies/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **DIIG contradicts itself.** Its **Origin** says "Ingested at `smart-base/library/9789240010567-eng/`; every citation below resolves to a section there" (that directory exists), but its badge is "cited, not ingested" and its section ends "No ingested source … nothing in this checkout holds it". `smart-base/methodologies/diig.md` has no `evidence:` front-matter field, so the page's three-state rule reports the source as absent while the prose beside it says it is held.
2. **The column the page says to read first is cut on every row.** All ten `applies when` cells are truncated at 150 characters, often mid-word ("…the budget and the moni…", "…Contextu…", "…who answers for this, wh…"). The full text is several screens down in "Where each one came from".
3. **The MADR cell renders a stray backtick.** The cut falls inside inline code — "Not for the decision METHOD (see \`kepner-tregoe…" — leaving an unclosed backtick, which kramdown prints literally. (→ `folio-assistant-mylx`)
4. **Ingested sources are code text, not links.** `library/arxiv-2508.05192v2`, `library/dusengumuremyi-2026-ai-mediated-raci`, the two SWOT slugs and `library/arxiv-2312.07755v1` name library entries, but the reader cannot open them from here. "Source held" means "you can open it from this checkout", yet not from this page. (→ `folio-assistant-qgjh`)
5. **Section anchors sit below their headings.** The table's links go to `<a id>` elements placed after each `### title`, so a jump lands with the heading just above the viewport.
6. **Badges fail contrast on the default dark scheme.** The inline `<style>` fixes `.mv-ingested #0d6e5e`, `.mv-cited #8a6100`, `.mv-dangling #a8200f` on `#27262b`: 2.44, 2.71 and 2.06 to 1 at .72 rem. The words carry the state, but are hard to read. (→ `folio-assistant-rtuo`)
7. **Mobile: the "Choosing one" table is four columns in a 358 px column.** "origin held?" and "declared by", the evidence state the page is about, start off-screen, and nothing says the table scrolls.
8. **WireGen's origin points at nothing on this page.** It ends "Section numbers below are the paper's", written for the methodology file's own body; on this page nothing follows it but the sources list.

When fixed, re-draw `cat-harness/docs/wireframes/methodologies/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
