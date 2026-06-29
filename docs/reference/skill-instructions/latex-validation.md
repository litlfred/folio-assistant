---
layout: default
title: LaTeX Validation
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/latex-validation.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/latex-validation.md) — do not edit here.

{% raw %}
# LaTeX Validation Skill

## Purpose

Validate LaTeX source files for syntactic correctness, structural
consistency, and adherence to project conventions defined in the
repository's `AGENTS.md` / contributor instructions.

## Checks

### 1. Syntax Correctness
- Every `\begin{env}` has a matching `\end{env}`.
- Braces `{}`, brackets `[]`, and parentheses `()` are balanced.
- No undefined control sequences (commands must be provided by a
  declared package or defined in the preamble).
- Math mode delimiters (`$...$`, `\(...\)`, `\[...\]`) are properly
  paired.

### 2. Environment Usage
- Theorem-like environments (`theorem`, `lemma`, `proposition`,
  `corollary`, `definition`, `example`, `remark`, `conjecture`) are
  used only as declared in `main.tex` and are never redeclared in
  chapter files.
- Display math uses `equation` or `align` environments — never
  `$$...$$`.

### 3. Label Conventions
- Every labeled item uses the correct prefix as specified in the
  project labeling convention:
  - `chap:` for chapters
  - `sec:` / `ssec:` for sections / subsections
  - `def:` / `thm:` / `lem:` / `prop:` / `cor:` / `ex:` / `rem:` /
    `conj:` for theorem-like environments
  - `eq:` for equations, `fig:` for figures, `tab:` for tables
- Every theorem-like environment and every numbered equation carries a
  `\label{...}`.

### 4. Cross-References
- `\ref` and `\eqref` targets correspond to existing `\label`
  commands within the changeset or the broader document.
- Non-breaking spaces (`~`) precede `\ref` and `\eqref`.

### 5. Bibliography
- Every `\cite{key}` key must resolve to an entry in `content/schema/references.ts`
  (the CSL-JSON source of truth; `references.bib` is auto-generated via `bun run export-bibtex`).
- Citation keys follow the `<firstauthorlastname><year>` convention.
- Validate with `bun run validate-refs`.
- Every new reference: add a `ref()` call in `content/schema/references.ts` with at minimum
  `author`, `title`, `issued`, and either `DOI` or `URL`.

### 6. Commutative Diagrams (Herrlich–Strecker style)
- Use `tikzcd` environments, **not** `CD` (amscd).  Both packages are
  loaded, but `tikzcd` is the project standard.
- Every definition must include commutative diagrams alongside equations.
  Diagrams come first; the equation they express follows.
- Standard spacings: `row sep=2.5em, column sep=3em` (or `3.5em` for
  wider labels).
- Arrow styles: `\ar[r, "label"]` for horizontal,
  `\ar[d, "label"']` for downward (label below), `two heads` for
  epimorphisms, `dashed` for induced/factored morphisms,
  `equal` for identity/equality arrows.
- Definitions of algebraic structures (Hopf, Frobenius, monoidal) must
  display the structure morphisms as a diagram before listing axioms.

### 7. Deformation / Parameter Convention
- If the paper introduces a deformation or specialization parameter, it
  must **not** appear in definitions, examples, lemmas, or theorems
  before the section that introduces it.
- Quantities that have an undeformed and a deformed form are written in
  the undeformed form in the pre-parameter material; the deformed form
  appears only after the parameter is introduced.
- This convention is project-specific — consult the project's `AGENTS.md`
  for the exact parameter, its introducing section, and the
  undeformed/deformed notation pairs.

### 8. LeanBlueprint Macros
- `\lean{<Paper>.Namespace.decl}` must reference a fully qualified Lean
  declaration that exists (or will exist after stub generation) in the
  paper's Lean source tree (`lean/<Paper>/`).
- `\leanok` may only appear when the corresponding Lean proof contains
  **no** `sorry`.  Never add `\leanok` speculatively.
- `\uses{label1, label2}` must reference labels that exist in the same
  document or in `blueprint/src/content.tex`.  Every dependency edge
  must be bidirectionally consistent: if B `\uses{A}`, then A must
  carry a `\label{}`.
- `\proves{thm:label}` links a proof block to its statement; the label
  must match an existing theorem-like `\label{}`.
- Place blueprint macros **inside** the environment, immediately after
  `\label{}`:
  ```latex
  \begin{theorem}\label{thm:my-result}
    \lean{Paper.Chapter.my_result}
    \uses{def:prerequisite}
    Statement...
  \end{theorem}
  ```
- `blueprint/src/content.tex` is the single source of truth for the
  formalization dependency graph.  Every `\lean{}` macro in
  `chapters/*.tex` must have a corresponding entry there.

### 9. Blueprint-Bibliography Cross-References
- Every `-- Ref: [key]` annotation in Lean files must have a matching
  citation key in `content/schema/references.ts` (exact case-sensitive match).
- When adding a `sorry` to a Lean file, precede it with a
  `-- Ref: [key] url` comment linking to the foundational reference.
- `\cite{key}` keys in `blueprint/src/content.tex` must resolve against
  `references.bib` (auto-generated from `content/schema/references.ts`).
- Validate all citation keys with `bun run validate-refs`.

## Mechanical enforcement — the preflight linter (run this FIRST)

The "No undefined control sequences" / balanced-braces aspirations in
§1 are now **mechanically enforced** by a fast static gate that needs no
TeX install. The content pipeline's `validateLatexAst`
(`render-latex.ts`) uses unified-latex, which **never resolves macros**,
so three whole classes of fatal-pdflatex bug pass it silently and used
to land on `main` needing a manual `fix(latex)` commit each time.

**Always run before declaring LaTeX clean:**

```bash
cd content
bun run pipeline/build.ts <paper>.ts --generate-main --main-out ../main.tex \
  --preamble ../latex/preamble.tex   # regenerate the compile unit
bun run latex-preflight              # gate: exits 1 on any issue
```

It scans the *generated compile unit* (`main.tex` + every `\input`'d
`chapters/*.tex`) and catches:

| Check | Fatal pdflatex error it pre-empts | Fix |
|-------|-----------------------------------|-----|
| **A** duplicate-newcommand | `Command \X already defined` | Define the macro **once** — in `latex/preamble.tex` *or* the paper manifest `macros:` block, never both. Use `\providecommand`/`\renewcommand` for an intentional override. |
| **B** undefined-macro | `! Undefined control sequence` | Define it in the preamble/manifest, or use an existing command (e.g. `\mathrm{tr}`, not `\tr`). If it is a genuine standard/package command (and its package is loaded in the preamble), add it via re-seed: `bun run latex-preflight:seed`. |
| **C** fragile-accent-script | `! Missing { inserted` at a math accent | Never use a math accent (`\check`,`\hat`,`\tilde`,…) as a **bare** sub/superscript. Brace it: `X^{\check{q}}`, not `X^\check{q}`. |
| **D** missing-input | `File \`…' not found` | Make sure an unconditional `\input`/`\include` target exists; guard optional includes with `\IfFileExists`. |
| **E** math-delimiter-imbalance | `! Missing $ inserted` | Balance `$`…`$` within each file; use `\$` for a literal dollar. |
| **F** environment-mismatch | `\begin{X} … ended by \end{Y}` | Match every `\begin{env}` with its `\end{env}`; check nesting. |
| **H** unmapped-unicode | `Unicode character … not set up for use with LaTeX` | Add a `\newunicodechar{X}{…}` to `latex/preamble.tex`, use a LaTeX command, or re-seed if inputenc handles it. |

(Re-seed with `bun run latex-preflight:seed` after legitimately adding a
new standard command or inputenc-native glyph; commit the updated
`latex-known-macros.json`.)

`build.ts` also runs the preflight automatically after `--generate-main`,
and the always-run `content-pipeline` CI job gates on it — so a
PR fails fast on A/B/C even when the heavy `paper-pdf` job no-ops (Actions
billing block / `[skip-ci]`). When reviewing a content PR, **reproduce
the preflight locally** before APPROVE.

## Output Format

```
- **Summary**: One-paragraph assessment of LaTeX correctness.
- **Issues Found**: Numbered list (severity: critical / major / minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
```
{% endraw %}
