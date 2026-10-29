---
name: math-readability-editing
description: >-
  The math half of the harness's readability-editing: math-specific style
  checks, the blueprint and formal-proof index cross-checks, and the
  mandatory TeX snippet validation after editing a paper folio's blocks.
---

# Math readability editing

The harness skill `readability-editing` (`skill_fetch readability-editing`)
reviews any folio's prose for flow, definitions, forward references,
spelling, clarity and consistency. A paper folio carries math and a formal
layer, so a readability pass over it also runs these checks.

## Style

- Spelling checks include common LaTeX-adjacent typos.
- Technical terms may be introduced with `\emph{...}` on first use.
- Sentences do not begin with a mathematical symbol.
- Notation follows the project's notation register, for example bold vs.
  calligraphic for distinct kinds of object; deviations are flagged.
- Displayed equations ending a sentence include a period inside the
  environment.
- Forward-reference hygiene applies to lemmas, theorems and propositions:
  no example, remark or definition references one that has not been stated.

## Blueprint and formal-proof cross-checks

- Every `\label{def:foo}` / `\label{thm:foo}` in chapter files should have a
  corresponding entry in the project's blueprint or formal index where one
  exists. Flag missing entries as minor issues.
- If a theorem is described as "proved" or "established", verify that the
  corresponding formal-proof index marks it complete, or flag that it does
  not yet.

## Editing math in `.md` blocks

Content uses inline math `$...$`, display math `$$...$$` and cross-references
`[text](#label)`, which render as `\hyperref[label]{text}` in LaTeX. Preserve
these conventions when editing; do not convert to raw LaTeX. The rules are in
`math-md-authoring`.

## TeX snippet validation (mandatory after edits)

After editing any `.md` file, run the TeX snippet validator on changed files:

```bash
cd content && bun run pipeline/validate-tex.ts --file <path-to-changed.md>
```

This uses **remark + remark-math** to parse the markdown AST and extracts all
TeX snippets (`$...$`, `$$...$$`, ` ```tex ``` ` blocks), then validates each
via **unified-latex** AST parsing. Fix any errors before considering the edit
complete.

If TeX validation fails, fix the problematic snippet and re-validate before
proceeding. Common issues:

- Unbalanced braces in inline math
- Non-math environments inside `$$...$$` blocks
- Malformed macros in ` ```tex ``` ` fenced blocks

## Fallback participation

When the editor's content-change fallback runs a readability pass after
proof files or `.tex` files changed, this skill runs with it.
