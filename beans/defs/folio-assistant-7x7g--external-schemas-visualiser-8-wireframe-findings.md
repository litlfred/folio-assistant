---
# folio-assistant-7x7g
title: 'external-schemas visualiser: 8 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-external-schemas
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/external-schemas/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **44 of the 53 operative terms say nothing.** Every DCMI term (22) and every BPMN term (22) reads "derived from the corpus; what this repository does with it is not yet described". The page's third question — "which of its terms this repository branches on" — is answered by 44 rows of the same sentence; only SKOS's 9 terms carry a meaning. The stat box counts them as "operative terms in the graph" without saying so.
2. **The "0 dependents that no longer resolve" box covers 8 of 14.** Six dependents are "not a path" and were not checked, including all three for BPMN and both for DD. The stat grid shows 0 with no hint that the two specifications this repository `conforms` to most directly have no checkable dependent at all; that is only in the prose of region 7.
3. **The namespace check reports DCMI and SKOS as "declared and not in use" by construction.** The in-use set is "read from the BPMN and DMN files themselves", so a namespace used only in `.dc.json` records or JSON-LD exports can never be in use. Three of the page's five declared-namespace findings are this artefact, while the one real gap (`…/folio-assistant/bpmn`, used and undeclared) is a list item mid-page, not in the stat grid.
4. **"Resolves" dependents cannot be opened.** The generator defines *resolves* as "a path in this checkout, openable", but each is rendered as `code` text in a table cell. The reader copies the path to follow it. (→ `folio-assistant-qgjh`)
5. **Section anchors sit below their headings.** The spec table links to `#dcmi-terms` etc., which are `<a id>` elements placed *after* each `### title`. A jump lands with the heading scrolled just above the viewport (and under the fixed "▾ Folio" handle on top of that). (→ `folio-assistant-015u`)
6. **State tags fail contrast on the default dark scheme.** The page's inline `<style>` fixes `.xs-ok #0d6e5e`, `.xs-na #5b5f66`, `.xs-missing #a8200f` on just-the-docs' dark body `#27262b`: 2.44, 2.34 and 2.06 to 1 at .72 rem. The words carry the state, so colour is not the only channel, but the words are hard to read. (→ `folio-assistant-rtuo`)
7. **Mobile: the spec table is four columns in a 358 px column.** "edition" and "how it is used" start off-screen, and nothing says the table scrolls. The 22-row term tables are two columns and fit, but each row repeats the same sentence at 390 px, making the DCMI and BPMN sections several screens of it.
8. **The notes are single long paragraphs in capitals for emphasis** ("THE TRANSCRIPTION CAME FIRST AND THAT WAS THE DEFECT", "NO XSD IS HELD"). The DCMI note is about 900 characters in one block.

When fixed, re-draw `cat-harness/docs/wireframes/external-schemas/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
