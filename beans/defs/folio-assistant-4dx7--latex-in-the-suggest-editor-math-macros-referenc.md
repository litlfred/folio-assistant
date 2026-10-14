---
# folio-assistant-4dx7
$schema: bean/1.0.0
title: "LaTeX in the ✍ suggest editor: math macros, references, environments, validated against the KG"
status: in-progress
type: feature
priority: normal
created_at: 2026-10-14T16:30:00Z
updated_at: 2026-10-14T19:00:00Z
---

Owner, 2026-10-14 (session https://claude.ai/code/session_0147GQWs8akum21vSh5XYURR): *"How does it handle latex? Don't implement now but add a bean to folio assistant sci."*

## Context

The ✍ suggest action (a WYSIWYG Markdown editor beside ✎ edit on every Markdown block of every harness site, Milkdown Crepe loaded on first use, the change submitted as a prefilled GitHub issue) lives in the shared edit-links runtime (`cat-harness-tools/src/core/edit-links.ts`). Its owner rule for embedded syntax: **check that the syntax is valid; never forbid a change** — a reader may edit, add or delete a variable, reference or directive.

What it does with LaTeX today (prototype, dth-hrh):
- **Inline and display math** (`$…$`, `$$…$$`): Crepe's latex feature renders with KaTeX, edits in a CodeMirror popover, and serialises the `$…$` back unchanged. The folio's KaTeX macros (`manifest.macros`, as `build-document-site`'s `katexMacros`) are NOT passed in, so macro-using math shows a KaTeX error in the editor (the source survives).
- **Commands with one argument** (`\cite{…}`, `\ref{…}`, `\eqref{…}`): kept as text so Markdown escaping cannot corrupt them; checked for well-formed syntax only.
- **Not handled:** `\begin{…}…\end{…}` environments, multi-argument or optional-argument macros, `equation` / `proof` / theorem-family blocks whose body is LaTeX-heavy, and whether a `\ref` / `\cite` / `\eqref` target exists.

## Todo
- [ ] (runtime; sibling suggest-editor session) Pass the folio's KaTeX macros to the editor (published with the page config, as the site renderer already computes them)
- [x] Syntax check for LaTeX inside a suggestion: balanced braces, matched `\begin`/`\end`, known macro arity (from the macro table)
- [x] Reference check against the KG, as a WARNING not a block: `\ref`/`\eqref` labels against the paper's block nodes (`gen-block-jsonld` labels), `\cite` keys against the bibliography
- [x] Decide the editing surface for LaTeX-heavy kinds (equation, proof, theorem family): Crepe's math node, a raw CodeMirror LaTeX mode, or both
- [x] A test over a real folio-assistant-sci paper block with macros, references and an environment: round-trip unchanged when untouched, a valid edit accepted, an unbalanced one reported

## Decisions (owner, 2026-10-14)
- **Editing surface: both.** Crepe's math node for `$…$` / `$$…$$`, plus a "raw LaTeX" toggle that opens the whole block in a CodeMirror LaTeX pane. For equation, proof and theorem-family blocks the toggle is offered up front.
- **Runtime work stays with the sibling suggest-editor session** (cat-harness-tools): the checker hook, passing `katexMacros(manifest.macros)` in the page config, and the raw-LaTeX toggle. This session does not take push access to cat-harness-tools.

## Done
- litlfred/folio-assistant-sci#25: `adapters/paper/suggest/latex-check.ts`. Syntax errors (braces, `\begin`/`\end`, macro arity from preamble + `manifest.macros`, unclosed `$$`) and KG reference warnings; `checkSuggestion(before, after)` reports only what an edit introduces; `latexSpans`/`protectLatex` for the ⟦ ⟧ convention. Tested over LeanArchitect §3.4 (`prose-sec-006`).

## Related
- dth-hrh session: block JSON-LD (litlfred/cat-harness-tools#194, #197; litlfred/folio-assistant-core part B), the suggest editor (queued in cat-harness-tools), and variable values published to the KG (`values.jsonld`, proposed).
