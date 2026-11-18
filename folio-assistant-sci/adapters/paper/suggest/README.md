# ✍ suggest — the paper profile's LaTeX checks

Bean `4dx7`. The ✍ suggest editor lives in the shared edit-links runtime
(`cat-harness-tools/src/core/edit-links.ts`); what is here is what a **paper**
needs from it and no other profile does.

| | |
|---|---|
| [`latex-check.ts`](latex-check.ts) | Pure checks over a block's Markdown: syntax (braces, `\begin`/`\end`, macro arity, `$$`), and references against the KG. |
| [`latex-check.test.ts`](latex-check.test.ts) | Held against a real block of this library — LeanArchitect §3.4, `prose-sec-006`. |
| [`crepe-latex.ts`](crepe-latex.ts) | The paper's settings for Crepe's math editor, and two repairs Crepe 7.22.2 needs for paper math. |
| [`latex-tokens.ts`](latex-tokens.ts) | The LaTeX references the runtime keeps intact and checks while this profile's module is not loaded: the token rules the shared runtime used to hold itself. |
| [`latex-tokens.test.ts`](latex-tokens.test.ts) | The same verdicts the runtime gave before the move. |
| [`crepe-latex.test.ts`](crepe-latex.test.ts) | Real Crepe 7.22.2 (KaTeX 0.18), headless under happy-dom, over every library section with math. |

## Crepe's math editor on paper blocks

Run headless over this library, unrepaired Crepe 7.22.2 has three faults:

1. **Inline math ignores the paper's macros.** `katexOptions.macros` reaches
   only the `$$…$$` preview, so `$\LM(x)$` renders as a KaTeX error.
   `inlineMathNodeView(katex, macros)` replaces the `math_inline` node view.
2. **LaTeX outside math is escaped into broken LaTeX.** `\begin{theorem}[Fermat]`
   becomes `\begin{theorem}\[Fermat]`, and `\cite[p.~3]{k}` becomes
   `\cite\[p.\~3]{k}`. Wrapping in ⟦ ⟧ does not stop this. `latexAtoms` turns
   each span `latexSpans` finds into a raw `html` atom, which Crepe writes back
   byte for byte. It must be the first remark transformer, so register it with
   `ctx.update(remarkPluginsCtx, useLatexAtoms(macros))` after `InitReady`.
   Without the line-break handling, an atom joined `% Statement` and
   `\begin{theorem}` into one comment line. The syntax check caught that.
3. **Inline `$$x$$` comes back as `$x$`.** remark-math reads both as inline
   math, so the meaning is the same. Left as Crepe writes it.

With the repairs:
- every math span in the library comes back unchanged;
- LeanArchitect §3.4 round-trips byte for byte;
- Crepe's output passes the syntax checks.

Two things the runtime must do itself:
- **Front matter:** strip a block's YAML front matter before editing. Crepe
  rewrites it as `***` and a setext heading.
- **Diffing:** Crepe escapes `[` and `|` in prose (Lean attributes, citation
  brackets), so an untouched paragraph can differ from its source. Diff the
  edit against Crepe's round-trip of the original, not the raw source.

## The rule it keeps

Owner, 2026-10-14: *"I only want that the syntax is valid."* A reader may
change, add or delete any macro, reference or environment.

- **error** — not well-formed LaTeX: an unbalanced brace, an `\end` closing
  nothing or the wrong environment, an environment left open, a macro short of
  its arguments, an unclosed `$$`.
- **warning** — a `\ref`/`\eqref`/`\cref`/`\uses` label no block node carries,
  a `\cite` key the bibliography lacks. Never an error.

`checkSuggestion(before, after)` reports only what the edit **introduces**, so
an untouched block reports nothing and an ingested block's own OCR defects are
not blamed on the reader.

## Where the pieces come from

- **Macro arity**: built-ins, then the paper preamble's `\newcommand`s
  ([`../latex/paper-preamble.tex`](../latex/paper-preamble.tex)), then the
  paper's `manifest.macros` — counted the way `blueprint-layout.ts`'s
  `macroArity` counts them. A macro with no known shape is not checked.
- **Labels**: the `label` of each block node, as `gen-block-jsonld` writes it.
- **KaTeX rendering** is not here: the editor should get the same table the
  site renderer does, `katexMacros(manifest.macros)` in folio-assistant-core's
  `build-document-site.ts`, published with the page config.

## Editing surface (owner decision, 2026-10-14)

**Both.** Crepe's math node edits `$…$` / `$$…$$` in place, and a "raw LaTeX"
toggle opens the whole block in a CodeMirror LaTeX pane. For equation, proof
and theorem-family blocks, the toggle is offered up front. The runtime builds
both. The same checks run on either surface, because they read the block's
Markdown, not the editor's document.

## How the runtime uses it

The shared runtime knows no LaTeX (owner: *"cat-harness should not know
about LaTeX"*, *"latex should be in f-a-sci"*). Everything LaTeX it does, it
does through this profile.

cat-harness-tools `pipeline/editor-profiles.ts` finds
[`editor-checkers/paper-latex.json`](../../../editor-checkers/paper-latex.json)
through this instance's declaration. It bundles the code that node names into
one browser module, `assets/suggest/paper-latex.js`, under the roles the
runtime calls:

| role | here | the runtime calls |
|---|---|---|
| `check` | `checkSuggestion` | `check(before, after, { macros, kg })` live, and before submit; an error blocks it |
| `macros` | `macroTableFromKatex` | `macros(katexMacros)`, with the page's KaTeX table |
| `featureConfigs` | `crepeFeatureConfigs` | `featureConfigs(Crepe.Feature, katexMacros)`: Crepe's latex feature config, under the feature name the runtime hands in |
| `nodeViews.math_inline` | `inlineMathNodeView` | `(katex, katexMacros)` |
| `remarkFirst` | `useLatexAtoms` | `remarkFirst(macros)`, after Crepe's own `InitReady` |

The site builders (folio-assistant-core `build-folio-site.ts` and
`build-document-site.ts`) publish the bundle and name it in the page config.
The runtime then chooses this profile for every block of a paper. It offers
the raw pane first for the kinds in `rawFirstFor`, and the visual one
beside it. It reads labels and citation keys from the page's `graph.jsonld`
when the site publishes one.

Two fields are data in the page config rather than module roles, so they hold
even when the bundle fails to load: `rawFirstFor`, and `tokens`. The bundler
calls `latexReferenceTokens()` at build time and writes each pattern as its
`/source/flags` string. The runtime shields and checks those LaTeX references
only while this profile's module is not loaded. Once it is, `useLatexAtoms`
keeps the LaTeX verbatim and `checkSuggestion` checks it.
