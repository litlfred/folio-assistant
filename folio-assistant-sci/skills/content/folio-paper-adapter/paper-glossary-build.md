---
name: paper-glossary-build
description: >-
  The paper half of core's glossary-build: the typeset glossary chapter, the
  defined-term markers in `.tex`, and the formal synonyms module a paper with
  a Lean pipeline regenerates from `glossary.json`.
---

# Paper glossary build

Core's [`glossary-build`](../../../../folio-assistant-core/skills/library/cataloguing/glossary-build.md)
builds `glossary.json` and the SKOS scheme from every block's `defines: [...]`,
states the Markdown markers, and runs the validation rules. A paper folio adds
three things, and they are this skill.

## The glossary chapter

For a paper, `build-glossary.ts <paper-dir>` also generates
`chapters/glossary.tex`, the typeset glossary chapter. `--check` covers it
with the JSON: a stale chapter fails the gate like a stale index.

## The markers in `.tex`

The same two occurrences core states for `.md`, in LaTeX:

- **Defining occurrence** (exactly one block): `\defterm{slug}[{Visible}]`.
- **Reference occurrences** (every other mention): `\refterm{slug}[{Visible}]`.

Plain text and `\emph{}` are not permitted for a defined term once its slug
appears in any `defines[]` list.

## The formal synonyms module

If the paper has a formal-proof pipeline (Lean), the glossary build can
regenerate a synonyms module from `glossary.json`, emitting `abbrev`s to
library synonyms:

```lean
-- Auto-generated from glossary.json — do not edit by hand.
namespace Project.Glossary
open CategoryTheory
abbrev MonoidalCategory := CategoryTheory.MonoidalCategory
abbrev BraidedMonoidalCategory := CategoryTheory.BraidedMonoidalCategory
-- For non-library synonyms, emit a `def ... := sorry` stub
-- with a `-- Ref: [manuscript]` comment.
end Project.Glossary
```

`abbrev` is preferred over `def` so that elaboration sees the library type
definitionally. The formal-proof CI re-runs `--check` after this file is
regenerated.

## See also

- core's `glossary-build` — the index, the SKOS scheme, the Markdown markers
  and the validation rules this skill refines
- `latex-validation` — LaTeX-side checks the chapter must also pass
