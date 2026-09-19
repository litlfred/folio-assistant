---
$schema: folio-memory/v1
id: the-stages-in-order
label: stable
summary: "the stages, in order"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
```
.ts manifests + .md content
  → Zod schema validation (shape + types)          schemas/constraints.ts
  → constraint rules (file existence, cross-refs, lean requirements)
  → profile check (kind-within-profile)            content/pipeline/profile-check.ts
  → render (LaTeX or Markdown)                     render-latex.ts / render-markdown.ts
  → AST validation of the rendered output
  → chapters/*.tex  or  one assembled .md
```
