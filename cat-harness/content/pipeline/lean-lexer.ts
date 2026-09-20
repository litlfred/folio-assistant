/**
 * The Lean source LEXER — comment stripping and declaration splitting.
 *
 * @module content/pipeline/lean-lexer
 *
 * ## Why this is core and not the science layer
 *
 * Same test as `schemas/lean-packages.ts`, which holds the `lean.ref` grammar
 * for the same reason: would core function without the science layer
 * installed? It would not. `BlockBase` carries an optional `lean` field,
 * `QaCriterionDefinition` carries `lean_granularity: "statement"`, and
 * `qa-utils` consults the statement hash on EVERY freshness check — on a
 * document folio as much as a paper one, because the field is on shared block
 * kinds by design and the document profile forbids its USE rather than its
 * existence.
 *
 * So the grammar belongs wherever the field does. What is genuinely the
 * science layer's is what you DO with a parsed declaration — Atlas ingestion,
 * triviality probing, coverage tables — not how to find one in a file.
 *
 * ## Six copies of this existed
 *
 * `stripLeanComments` was reimplemented, independently, in
 * `qa-checkers-extended.ts`, `qa-checkers-vacuity.ts`,
 * `conditional-class-banner-audit.ts`, `qa-checkers-q-usage.ts` and
 * `scripts/lean-coverage.ts`, beside this canonical one. Six places to get
 * nested `/- … -/` wrong, and six that must independently remember the two
 * invariants stated below — that byte offsets are preserved, and that doc
 * comments are comments. A copy is unlikely to preserve either.
 *
 * This module is the one home they should converge on. Converging them is NOT
 * done here: each copy has to be read against this one first, because a
 * checker whose verdicts change means a corpus-wide re-sweep and some of the
 * differences may be deliberate. Tracked as its own bean.
 */

// ── Lean source lexing (comment-stripped) ───────────────────────

/**
 * Strip Lean comments: `--` to end of line, and nestable `/- … -/`.
 *
 * Replaces comment bodies with equal-length whitespace so byte offsets
 * are preserved — the declaration splitter below indexes into the
 * result and must stay aligned with the original source.
 *
 * Doc comments (`/-- … -/`) are comments too: a decl name mentioned
 * only in prose is not a dependency. Skipping this step is how a
 * scanner invents edges out of documentation.
 */
export function stripLeanComments(src: string): string {
  const out = src.split("");
  let i = 0;
  let depth = 0;
  while (i < src.length) {
    if (depth === 0 && src[i] === "-" && src[i + 1] === "-") {
      while (i < src.length && src[i] !== "\n") out[i++] = " ";
      continue;
    }
    if (src[i] === "/" && src[i + 1] === "-") {
      depth++;
      out[i++] = " ";
      out[i++] = " ";
      continue;
    }
    if (depth > 0 && src[i] === "-" && src[i + 1] === "/") {
      depth--;
      out[i++] = " ";
      out[i++] = " ";
      continue;
    }
    if (depth > 0) out[i] = " ";
    i++;
  }
  return out.join("");
}

/**
 * What a declaration LOOKS like, lexically.
 *
 * EXPORTED so that the one other regex in this repository asking the same
 * question — `LEAN_DECL_RE` in `qa-checkers-q-usage.ts` — can be compared
 * against it by a test rather than by eye.
 *
 * ## They disagree, measured 2026-09-20 (bean `bqrg`)
 *
 * `stripLeanComments` was converged onto this module and is gated by
 * `lean-lexer-is-the-only-stripper.test.ts`. The DECLARATION SPLITTER was the
 * half left over, and it is not one duplicate but two functions answering
 * different questions off two different regexes:
 *
 * - `splitDeclarations` here returns byte offsets and a signature/body split;
 * - `leanDeclSpans` there returns 1-indexed inclusive LINE ranges, so a caller
 *   can blank everything outside a declaration while preserving line numbers.
 *
 * Those are genuinely different projections and neither replaces the other.
 * What IS duplicated is the pattern below, and the two copies have drifted in
 * four ways — three of which are defects HERE:
 *
 * | source | `axiom` | `opaque` | `unsafe` | dotted name |
 * |---|---|---|---|---|
 * | this | ✗ missed | ✗ missed | ✗ missed | ✓ `Foo.bar` |
 * | `LEAN_DECL_RE` | ✓ | ✓ | ✓ | ✗ truncates to `Foo` |
 *
 * **`axiom` is the sharp one.** `splitDeclarations` feeds `lean-signature.ts`
 * and `lean-triviality-probe.ts`, and in a formal corpus an axiom is the
 * declaration whose presence most changes what a proof is worth. A triviality
 * probe that cannot see one is blind to exactly what it exists to find.
 *
 * ## Why this is not simply widened here and now
 *
 * The bean's own warning, and it is right: every copy feeds a QA checker, so a
 * behavioural change is a corpus-wide re-sweep and a changed verdict on merged
 * content — *"converging them blind is how a cleanup becomes a silent
 * re-scoring."* **This repository holds 0 `.lean` files**, so the sweep cannot
 * be run here at all; it has to happen in a folio that carries a Lean corpus.
 *
 * So the divergence is PINNED rather than blessed:
 * `lean-decl-regex-divergence.test.ts` asserts all four differences by name
 * and fails the moment either pattern changes. It does not approve of them —
 * it makes the next edit deliberate, and it is the place the sweep's results
 * land when somebody converges these onto one union pattern.
 */
export const DECL_RE =
  /^\s*(?:@\[[^\]]*\]\s*)?(?:private\s+|protected\s+|noncomputable\s+|partial\s+)*(theorem|lemma|def|abbrev|structure|inductive|instance|class|example)\s+([A-Za-z_][A-Za-z0-9_'.!?]*)/gm;

export interface DeclSpan {
  name: string;
  /** Signature text (before `:=` / `where`). */
  signature: string;
  /** Body text (after `:=` / `where`), empty when there is none. */
  body: string;
  /**
   * Absolute offset of `body` within the stripped source, or -1 when the
   * declaration has no body.
   *
   * Callers that need to splice the body (the triviality probe) must not
   * re-find it with `indexOf`: bodies repeat verbatim across a file
   * (`:= by rfl` is not distinctive), so a search can land on the wrong
   * one and rewrite a different declaration than the one requested.
   */
  bodyAt: number;
}

/** Bracket pairs that can nest a `:=` inside a statement. */
const OPEN = "([{⟨⦃";
const CLOSE = ")]}⟩⦄";
/** Lean identifier characters, for the `where` word boundary. */
const IDENT = /[A-Za-z0-9_'.!?]/;

/**
 * Offset of the first **top-level** `:=` or `where` in `text`, or -1.
 *
 * Top-level means outside every bracket pair and outside string
 * literals. A theorem *statement* may legitimately contain `:=` — a
 * `let` (`(let x := 5; x) = 5`), a structure instance (`{ a := 1 }`), an
 * anonymous constructor — and cutting at the first one anywhere puts
 * statement text into the body. Measured consequences of getting this
 * wrong, all three of which read as a clean result rather than an error:
 *
 * - `lean-signature` hashes only the truncated signature, so
 *   `(let x := 5; x) = 5` and `... = 6` hash identically and a changed
 *   statement never invalidates its QA sidecar;
 * - `lean-triviality-probe` splices its tactic over the tail of the
 *   statement, the file stops elaborating, every ladder rung fails, and
 *   the declaration is recorded `closed: false` — "not machine-trivial";
 * - scan mode files the statement's own text under `value_deps`.
 *
 * Char literals are deliberately NOT tracked: `'` is far more often a
 * prime in an identifier (`h'`, `ih'`) than a delimiter, so treating it
 * as a quote would miscut far more declarations than it rescues.
 */
export function topLevelCut(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      i++;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === "\\") i++;
        i++;
      }
      continue;
    }
    if (OPEN.includes(c)) {
      depth++;
      continue;
    }
    if (CLOSE.includes(c)) {
      // Clamp: a stray closer (the span boundary can chop mid-term) must
      // not drive depth negative and mask every later top-level cut.
      if (depth > 0) depth--;
      continue;
    }
    if (depth !== 0) continue;
    if (c === ":" && text[i + 1] === "=") return i;
    if (
      c === "w" &&
      text.startsWith("where", i) &&
      !IDENT.test(text[i - 1] ?? " ") &&
      !IDENT.test(text[i + 5] ?? " ")
    ) {
      return i;
    }
  }
  return -1;
}

/**
 * Split comment-stripped Lean source into per-declaration spans, each
 * separated into signature and body at the first top-level `:=` or
 * `where`.
 *
 * This is what lets scan mode emit a type/value split at all. It is a
 * lexical approximation — no elaboration, no scope tracking — hence
 * `source: "scan"` on everything it produces.
 */
export function splitDeclarations(stripped: string): DeclSpan[] {
  const starts: Array<{ name: string; at: number }> = [];
  for (const m of stripped.matchAll(DECL_RE)) {
    starts.push({ name: m[2], at: m.index ?? 0 });
  }
  const spans: DeclSpan[] = [];
  for (let i = 0; i < starts.length; i++) {
    const from = starts[i].at;
    const to = i + 1 < starts.length ? starts[i + 1].at : stripped.length;
    const text = stripped.slice(from, to);
    const cut = topLevelCut(text);
    spans.push({
      name: starts[i].name,
      signature: cut === -1 ? text : text.slice(0, cut),
      body: cut === -1 ? "" : text.slice(cut),
      bodyAt: cut === -1 ? -1 : from + cut,
    });
  }
  return spans;
}
