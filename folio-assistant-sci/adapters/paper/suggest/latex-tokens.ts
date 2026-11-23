/**
 * The paper profile's token rules for the ✍ suggest editor: the LaTeX the
 * shared edit-links runtime used to know itself, moved here by the owner's
 * ruling "cat-harness should not know about LaTeX" / "latex should be in
 * f-a-sci".
 *
 * The runtime keeps a token intact by wrapping it in ⟦ ⟧ (`shield`), so the
 * editor's Markdown escaping cannot corrupt it, and checks that each `find`
 * match, less `trim`, is well-formed (`valid`). It knows only the harness's own
 * tokens, Liquid and directives; a content profile adds its syntax through
 * the `tokens` field of its `folio-editor-checker/v1` node. cat-harness-tools'
 * `pipeline/editor-profiles.ts` calls this function at build time and puts
 * each pattern into the page config as its `/source/flags` string.
 *
 * These rules are the runtime's own fallback for a paper block: they apply
 * only while the profile's module is not loaded. Once it is, `useLatexAtoms`
 * (`remarkFirst`) keeps LaTeX verbatim and `checkSuggestion` (`check`) reads
 * it far more closely, so the runtime neither shields nor checks them again.
 *
 * @module folio-assistant-sci/adapters/paper/suggest/latex-tokens
 */

/** One rule, in the shape cat-harness-tools' editor-profiles bundler reads. */
export interface TokenRule {
  id: string;
  /** Wrapped in ⟦ ⟧ while the block is in the visual editor. */
  shield?: RegExp;
  /** Candidates to check: each must match `valid`, once `trim` is removed. */
  find?: RegExp;
  /** Not global: a global RegExp's `test()` is stateful. */
  valid?: RegExp;
  trim?: RegExp;
}

/**
 * A LaTeX command with one braced argument, `\name{…}`, kept intact; and a
 * reference (`\cite`, `\ref`, `\eqref`, `\autoref`, `\cref`) that must be one
 * command and one non-empty, unnested argument, trailing punctuation aside.
 */
export function latexReferenceTokens(): TokenRule[] {
  return [
    {
      id: "latex-reference",
      shield: /\\[A-Za-z]+\{[^}\n]*\}/,
      find: /\\(?:cite|ref|eqref|autoref|cref)\b[^\s]*/g,
      valid: /^\\[A-Za-z]+\{[^{}\n]+\}$/,
      trim: /[.,;:)]+$/,
    },
  ];
}
