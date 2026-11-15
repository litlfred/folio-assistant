---
# note on folio-assistant-4475 from claude/bold-brahmagupta-c8eoku
$schema: folio-bean-note/v1
bean: folio-assistant-4475
branch: "claude/bold-brahmagupta-c8eoku"
created: "2026-10-06"
---
## Publisher-only fragments, measured on the published sites 2026-10-06

Measured on the PUBLISHED sites after the 2026-10-06 pin bump to folio-assistant 9a5682b (smart-trust#13, smart-base#5, smart-immunizations#8, `folio site` dispatched):

- `list-structuremaps.xhtml` is no longer a marker: #2294 (9hfi) renders `list-(simple-)?<type>.xhtml` from the artefact index. smart-trust maps.html shows none.
- Publisher-only fragments still rendered as "⟦not rendered⟧":
  - smart-trust dependencies.html: `dependency-table.xhtml`, `dependency-table-short.xhtml`, `cross-version-analysis.xhtml`, `globals-table.xhtml`
  - smart-base index.html: `dependency-table-short.xhtml`, `cross-version-analysis.xhtml`, `globals-table.xhtml`, `ip-statements.xhtml`
  - smart-immunizations index.html: `ip-statements.xhtml`; functional-requirements.html: `fragment-functionalrequirements.liquid`; system-requirements.html: the same kind
- Heading ✎/📣 links (#2292, x78e) are live on all three: every content heading links to its own `input/pagecontent/*.md#L<n>`.
