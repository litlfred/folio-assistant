/**
 * Two regexes answer "where does a Lean declaration start", and they disagree.
 * Bean `bqrg`, second half.
 *
 * ## What is already done, and what this is for
 *
 * `stripLeanComments` had six independent implementations. They are converged
 * onto `content/pipeline/lean-lexer.ts` and held there by
 * `lean-lexer-is-the-only-stripper.test.ts`, which fails if a second one
 * appears. That half of the bean is finished.
 *
 * The DECLARATION SPLITTER is the half that was left, and it turned out not to
 * be one duplicate:
 *
 * - `splitDeclarations` (lean-lexer) returns byte offsets and splits each
 *   declaration into signature and body at the first top-level `:=`/`where`.
 * - `leanDeclSpans` (qa-checkers-q-usage) returns 1-indexed inclusive LINE
 *   ranges, so a caller can blank every line outside a declaration while
 *   preserving line numbers.
 *
 * Those are different projections of the same fact and neither replaces the
 * other. What IS duplicated is the pattern each uses to find a declaration
 * start — and the two copies have drifted.
 *
 * ## Why a test rather than a fix
 *
 * The bean's warning, and it is correct: each copy feeds a QA checker, so
 * changing one is a corpus-wide re-sweep and a changed verdict on already
 * merged content. *"Converging them blind is how a cleanup becomes a silent
 * re-scoring."*
 *
 * And it cannot be swept here: **this repository holds 0 `.lean` files.** The
 * platform carries no folio, so there is no corpus to re-score against. That
 * makes "just widen it" not a judgement call but an unmeasurable one.
 *
 * So this PINS the divergence. It does not bless it — three of the four
 * differences are defects, and the comments say which. It makes the next edit
 * to either pattern deliberate and visible, and it is where the sweep's
 * results land when somebody converges them onto one union pattern in a repo
 * that can measure the change.
 *
 * The patterns are IMPORTED, never restated. A test that re-types the regex it
 * tests stops testing it the first time either is edited — which is the exact
 * failure this bean is made of.
 */
import { describe, expect, test } from "bun:test";
import { Glob } from "bun";

import { DECL_RE } from "../../content/pipeline/lean-lexer.js";
import { LEAN_DECL_RE } from "../../content/pipeline/qa-checkers-q-usage.js";

/** Names `lean-lexer`'s global pattern finds in `src`. */
function lexerNames(src: string): string[] {
  DECL_RE.lastIndex = 0; // `g` flag: state carries between calls
  return [...src.matchAll(DECL_RE)].map((m) => m[2]!);
}

/** The name `qa-checkers-q-usage`'s per-line pattern finds, if any. */
function qUsageNames(src: string): string[] {
  const m = LEAN_DECL_RE.exec(src);
  return m ? [m[1]!] : [];
}

describe("the two declaration patterns agree on ordinary Lean", () => {
  // The floor. Without these the divergence table below could be produced by
  // one pattern matching nothing at all, and every assertion would still pass.
  test.each([
    ["theorem plain : True := trivial", "plain"],
    ["lemma helper : True := trivial", "helper"],
    ["def value : Nat := 0", "value"],
    ["noncomputable def x : Nat := 0", "x"],
    ["private theorem hidden : True := trivial", "hidden"],
    ["@[simp] theorem tagged : True := trivial", "tagged"],
    ["structure Point where\n  x : Nat", "Point"],
  ])("%s", (src, name) => {
    expect(lexerNames(src)).toEqual([name]);
    expect(qUsageNames(src)).toEqual([name]);
  });
});

describe("...and disagree in exactly four ways, three of them defects in lean-lexer", () => {
  /**
   * `axiom` is the sharp one. `splitDeclarations` feeds `lean-signature.ts`
   * and `lean-triviality-probe.ts`; in a formal corpus an axiom is the
   * declaration whose presence most changes what a proof is worth, and a
   * triviality probe that cannot see one is blind to what it exists to find.
   */
  test("`axiom` — lean-lexer misses it entirely", () => {
    const src = "axiom choice : True";
    expect(lexerNames(src)).toEqual([]);
    expect(qUsageNames(src)).toEqual(["choice"]);
  });

  test("`opaque` — lean-lexer misses it", () => {
    const src = "opaque secret : Nat";
    expect(lexerNames(src)).toEqual([]);
    expect(qUsageNames(src)).toEqual(["secret"]);
  });

  test("the `unsafe` modifier — lean-lexer misses the whole declaration", () => {
    // Not just the modifier: the modifier list is `*`-repeated, so an
    // unrecognised one makes the keyword fail to match at that position and
    // the declaration is not seen at all.
    const src = "unsafe def loop : Nat := 0";
    expect(lexerNames(src)).toEqual([]);
    expect(qUsageNames(src)).toEqual(["loop"]);
  });

  test("a dotted name — q-usage truncates it, which is the defect on ITS side", () => {
    // `leanDeclSpans`' callers look a declaration up by name and fall back to
    // scanning the whole file when it is absent. A span named `Foo` for
    // `Foo.bar` is exactly that fallback, silently.
    const src = "theorem Foo.bar : True := trivial";
    expect(lexerNames(src)).toEqual(["Foo.bar"]);
    expect(qUsageNames(src)).toEqual(["Foo"]);
  });
});

describe("the pinning is honest about what it is", () => {
  test("this repository has no Lean corpus to re-sweep against", () => {
    // The reason the divergence is pinned rather than fixed, asserted rather
    // than claimed in prose. If a `.lean` file ever lands here, this fails —
    // and at that point the sweep the bean asks for becomes possible and
    // these tests should be replaced by one union pattern plus its results.
    const root = new URL("../../..", import.meta.url).pathname;
    const found = [...new Glob("**/*.lean").scanSync({ cwd: root, onlyFiles: true })]
      .filter((p) => !p.includes("node_modules"));
    expect(found, `Lean files appeared: ${found.slice(0, 5).join(", ")}`).toEqual([]);
  });
});
