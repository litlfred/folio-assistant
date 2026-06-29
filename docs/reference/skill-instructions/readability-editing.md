---
layout: default
title: Readability Editing
parent: Skill instructions
---

{: .note }
> Generated from [`src/skills/readability-editing.md`](https://github.com/litlfred/folio-assistant/blob/main/src/skills/readability-editing.md) — do not edit here.

# Readability Editing Skill

## Purpose

Review LaTeX manuscripts for narrative clarity, prose quality, and
editorial polish.  This skill is less concerned with mathematical
correctness and more concerned with how well the text communicates
ideas to a graduate-level reader.

## Checks

### 1. Narrative Flow
- Sections and subsections follow a logical progression.
- Transitions between paragraphs and sections are smooth.
- The reader is never left wondering *why* a topic is introduced.

### 2. Definition Hygiene
- Definitions are concise and self-contained.
- Each definition introduces exactly one concept.
- Technical terms are introduced with `\emph{...}` on first use and
  are not re-defined later.
- Every non-trivial definition is followed by at least one example.
- **Witnessed-value drift check**: in any block (definition, example,
  remark, prose), a numerical literal derived from the substrate
  (`q_0`, `\hbar_q`, `Vol(4_1)`, `m_μ/m_e`, binding energies, etc.)
  must be cited via `:val[name]`, not hard-coded.  This applies to
  propositions, theorems, lemmas, conjectures, and proofs as well.
  See [`witnessed-values.md`](./witnessed-values.md) for the
  registry, directive syntax, and codemod that rewrites legacy
  literals.

### 2a. Forward-Reference Hygiene
- An example, remark, or definition must **not** reference a lemma,
  theorem, or proposition that has not yet been stated.
- **Fix pattern**: remove the forward reference from the earlier
  environment; add a remark immediately after the later result's proof
  that back-references the earlier environment and explains the
  connection.
- *Example*: Example 1.6 referenced Lemma 1.8 ("This is the content of
  Lemma …"). Fix: trim the forward reference, add
  `\begin{remark}[…via the lemma]` after Lemma 1.8's proof that ties
  the two together.

### 3. Spelling and Grammar
- Identify misspelled words (including common LaTeX-adjacent typos).
- Flag grammatical errors: subject-verb agreement, dangling modifiers,
  comma splices, run-on sentences.
- Enforce the project prose style: formal academic English, no
  contractions, no first-person singular ("I"), Oxford comma.

### 4. Sentence-Level Clarity
- Flag overly long or convoluted sentences.
- Suggest simpler alternatives where meaning is preserved.
- Ensure that sentences do not begin with a mathematical symbol.

### 5. Consistency
- Notation introduced in one section is used consistently throughout.
- Categories use bold ($\mathbf{C}$, $\mathbf{Rep}$), never calligraphic
  $\mathcal{C}$. Calligraphic is reserved for sheaves, sites, algebras.
- The fibre functor is $\tau$ throughout; minimise its appearance where the
  QOU datum $(\mathbf{C}, A)$ suffices.
- Acronyms are expanded on first use and used bare thereafter.
- Displayed equations ending a sentence include a period inside the
  environment.

### 6. Blueprint and Citation Consistency
- Every `\label{def:foo}` / `\label{thm:foo}` in chapter files should
  have a corresponding entry in `blueprint/src/content.tex` with a
  `\lean{}` macro.  Flag missing blueprint entries as minor issues.
- Verify that `\cite{key}` keys are consistent with `content/schema/references.ts`
  naming convention (`<firstauthorlastname><year>`).
- When narrative text introduces a definition that appears in the
  glossary, the first use should reference it with `\emph{}` and the
  term should match the glossary entry name in `Glossary.lean`.
- Cross-check: if a theorem is described as "proved" or "established",
  verify that the blueprint entry carries `\leanok` (or flag that it
  does not yet).

## Content Object Integration

Narrative content lives in `.md` files that are part of content object
triples (`.ts` manifest + `.md` content + optional `.lean` formalization).
Readability edits target the `.md` files but may require `.ts` updates.

**Editing `.md` files.** Content uses markdown conventions: inline math
`$...$`, display math `$$...$$`, cross-references `[text](#label)` (which
render as `\hyperref[label]{text}` in LaTeX). When editing, preserve these
conventions — do not convert to raw LaTeX.

**Metadata consistency.** If an edit changes the block's label, title, or
introduces/removes dependencies, update the sibling `.ts` manifest:
- Renamed labels must be updated in `label` and in all `uses[]` arrays
  that reference them.
- Adding a cross-reference `[text](#def:foo)` in `.md` means `def:foo`
  should appear in `uses[]` of the `.ts` manifest.

**Kind-aware editing.** The `.ts` `kind` determines what content is
expected: `prose` blocks have no formal requirements; `definition` blocks
must have self-contained definitions; `theorem` blocks should state the
result clearly. Respect these expectations when restructuring content.

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

## Glossary terms (`:defterm` / `:refterm`)

When polishing prose, do **not** convert `:refterm[…]` directives to
plain text or `\emph{}`. The directives are the canonical link from
every mention of a defined term back to its `defines: [...]` block;
the viewer renders them as a subtle dotted underline, the PDF renders
them as plain text with an invisible hyperlink, and the validator
enforces resolution. Plain rephrasing is fine — just keep the wrapper
intact, e.g. `:refterm[rigid monoidal category]` may move within the
sentence but should not be unwrapped. New term mentions in edited
prose should be wrapped via `bun run pipeline/codemod-refterm.ts`
after editing. See `local/glossary-build` skill.

## Mandatory fallback participation

This skill is invoked automatically by the editor's **content-change fallback**
(see `editor.md § Content-change fallback`). Whenever any content is modified
during a session — `.md`, `.ts`, `.lean`, `.tex`, or supporting files — the
editor triggers a readability pass before the task is considered complete. When
invoked as a fallback, focus on the changed blocks: prose quality, notation
consistency, and forward-reference hygiene.

## Output Format

```
- **Summary**: One-paragraph assessment of readability.
- **Issues Found**: Numbered list (severity: critical / major / minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
```
