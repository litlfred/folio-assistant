---
name: readability-editing
---

# Readability Editing Skill

## Purpose

Review manuscripts for narrative clarity, prose quality, and editorial
polish.  This skill is less concerned with subject-matter correctness
and more concerned with how well the text communicates ideas to its
intended reader.

**A content type adds its own checks.** For a paper folio, with math and a TeX
pipeline, they are the science layer's `math-readability-editing`
(`skill_fetch math-readability-editing`): math-specific style, the blueprint
and formal-proof index cross-checks, and the mandatory TeX snippet validation
after an edit.

## Checks

### 1. Narrative Flow
- Sections and subsections follow a logical progression.
- Transitions between paragraphs and sections are smooth.
- The reader is never left wondering *why* a topic is introduced.

### 2. Definition Hygiene
- Definitions are concise and self-contained.
- Each definition introduces exactly one concept.
- Technical terms are marked on first use (the glossary directive below,
  or emphasis) and are not re-defined later.
- Every non-trivial definition is followed by at least one example.
- **Computed-value drift check**: in any block (definition, example,
  remark, prose), a value that is derived elsewhere in the project
  should be cited via a value directive (e.g. `:val[name]`), not
  hard-coded.  This applies to every block kind, formal statements
  included, so that a single source of truth governs the value.

### 2a. Forward-Reference Hygiene
- An example, remark, or definition must **not** reference a result,
  rule or definition that has not yet been stated.
- **Fix pattern**: remove the forward reference from the earlier
  environment; add a remark immediately after the later result that
  back-references the earlier environment and explains the connection.

### 3. Spelling and Grammar
- Identify misspelled words.
- Flag grammatical errors: subject-verb agreement, dangling modifiers,
  comma splices, run-on sentences.
- Enforce the project prose style: formal academic English, no
  contractions, no first-person singular ("I"), Oxford comma.

### 4. Sentence-Level Clarity
- Flag overly long or convoluted sentences.
- Suggest simpler alternatives where meaning is preserved.

### 5. Consistency
- Notation introduced in one section is used consistently throughout.
- Notation and naming conventions follow the project's register, where
  it has one; deviations are flagged.
- Acronyms are expanded on first use and used bare thereafter.

### 6. Citation and Glossary Consistency
- Verify that `\cite{key}` keys are consistent with
  `content/schema/references.ts` naming convention
  (`<firstauthorlastname><year>`).
- When narrative text introduces a definition that appears in the
  glossary, the first use should reference it and the term should match
  the glossary entry name.

## Content Object Integration

Narrative content lives in `.md` files that are part of content object
triples (`.ts` manifest + `.md` content + whatever sibling file the
content type adds).  Readability edits target the `.md` files but may require `.ts`
updates.

**Editing `.md` files.** Content uses the markdown conventions of
`md-authoring`, such as cross-references `[text](#label)`. When editing,
preserve them; do not convert to a renderer's own syntax.

**Metadata consistency.** If an edit changes the block's label, title, or
introduces/removes dependencies, update the sibling `.ts` manifest:
- Renamed labels must be updated in `label` and in all `uses[]` arrays
  that reference them.
- Adding a cross-reference `[text](#def:foo)` in `.md` means `def:foo`
  should appear in `uses[]` of the `.ts` manifest.

**Kind-aware editing.** The `.ts` `kind` determines what content is
expected: `prose` blocks have no formal requirements; `definition` blocks
must have self-contained definitions; a kind that states a result or a
rule should state it clearly. Respect these expectations when restructuring content.

## Glossary terms (`:defterm` / `:refterm`)

When polishing prose, do **not** convert `:refterm[…]` directives to
plain text or `\emph{}`. The directives are the canonical link from
every mention of a defined term back to its `defines: [...]` block;
the viewer renders them as a subtle dotted underline, the PDF renders
them as plain text with an invisible hyperlink, and the validator
enforces resolution. Plain rephrasing is fine — just keep the wrapper
intact, e.g. `:refterm[care plan]` may move within the
sentence but should not be unwrapped. New term mentions in edited
prose should be wrapped via `bun run pipeline/codemod-refterm.ts`
after editing. See `glossary-build` skill.

## Mandatory fallback participation

This skill is invoked automatically by the editor's **content-change fallback**.
Whenever any content is modified during a session — `.md`, `.ts`,
the content type's sibling files, or supporting files — the editor triggers a
readability pass before the task is considered complete. When invoked
as a fallback, focus on the changed blocks: prose quality, notation
consistency, and forward-reference hygiene.

## Output Format

```
- **Summary**: One-paragraph assessment of readability.
- **Issues Found**: Numbered list (severity: critical / major / minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
```
