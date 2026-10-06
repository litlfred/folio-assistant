/**
 * `lean-decl-starts-are-shared` tests whose subject is folio-assistant-sci's
 * contribution — the `lean-lexer` pipeline plugin this instance contributes —
 * moved here from
 * `cat-harness/scripts/tests/lean-decl-starts-are-shared.test.ts` (bean
 * `ho66`). The code under test is cat-harness's, imported DOWN; what it is
 * held against is this instance's, so standing alone cat-harness has nothing
 * for these to read. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";

import {
  splitDeclarations,
  stripLeanComments,
} from "../../../cat-harness/content/pipeline/lean-lexer.js";
import { leanDeclSpans, scopeLeanToDecl } from "../../../cat-harness/content/pipeline/qa-checkers-q-usage.js";

/** One declaration of each shape the two patterns disagreed about. */
const DIVERGENT = `theorem alpha : True := by trivial

axiom choice_ax : Nonempty Nat

unsafe def beta (n : Nat) : Nat := n + 1

opaque gamma : Nat := 7

def Ns.delta : Nat := 3
`;

describe("the two projections share the detection", () => {
  test("character spans and line spans report the SAME names, in order", () => {
    // THE anti-re-divergence assertion. A second pattern anywhere makes these
    // two lists disagree, which is exactly how the pair drifted apart before.
    const stripped = stripLeanComments(DIVERGENT);
    expect(leanDeclSpans(stripped).map((s) => s.name)).toEqual(
      splitDeclarations(stripped).map((s) => s.name),
    );
  });

  test("offsets convert to STRIPPED-text line numbers exactly", () => {
    // Legitimate because `stripLeanComments` blanks comments to equal length
    // rather than deleting them, so an offset into the stripped text indexes
    // the same character position.
    //
    // "STRIPPED-text" used to be doing real work in that sentence, and as of
    // bean `vrfx` (2026-09-27) it no longer is: a stripped-text line number IS
    // a source line number, because `stripLeanComments` now writes the newline
    // inside a block comment back rather than blanking it. Length survives, and
    // so does line count.
    //
    // **THIS TEST PINNED THE DEFECT, deliberately and with its reasons.** It
    // asserted `b` on line **4** — the collapsed number — because
    // `stripLeanComments` blanked the newline too: measured over 3,971 corpus
    // files, 3,931 (99.0%) shifted, losing 281,234 lines. The author filed
    // `vrfx` rather than fixing it here, on the ground that moving a
    // reader-facing line number on almost every file in a corpus is its own
    // change with its own before/after, and asserted the real behaviour so the
    // two beans stayed separable. That was right, and it is why the expectation
    // below moved from 4 to 5 in the commit that fixed `vrfx` rather than
    // drifting unnoticed.
    //
    // `leanDeclSpans` is self-consistent either way — it has always numbered
    // the stripped text, which is also what `scopeLeanToDecl` returns — so the
    // convergence neither caused nor cured it.
    const src = `-- a line comment\ndef a := 1\n/- block\n   comment -/\ndef b := 2\n`;
    const stripped = stripLeanComments(src);
    expect(stripped.length).toBe(src.length);
    expect(leanDeclSpans(stripped).map((s) => [s.name, s.start])).toEqual([
      ["a", 2],
      // 5, not 4: `b` is on source line 5 and now reports it (bean `vrfx`).
      ["b", 5],
    ]);
  });

  test("a line span indexes the stripped text it will be sliced from", () => {
    // The contract that actually matters to `scopeLeanToDecl`: whatever the
    // numbers are, slicing the stripped text by them yields the declaration.
    // True today and stays true once `vrfx` is fixed, which is why it is
    // asserted alongside the raw numbers above rather than instead of them.
    const src = `/-! module header\n   spanning lines -/\ndef a := 1\n\ndef b := 2\n`;
    const stripped = stripLeanComments(src);
    const lines = stripped.split("\n");
    for (const s of leanDeclSpans(stripped)) {
      expect(lines.slice(s.start - 1, s.end).join("\n")).toContain(`def ${s.name}`);
    }
  });

  test("a match cannot begin on a blank line above its declaration", () => {
    // Why the pattern uses `[^\S\n]*` and not `\s*`: `\s` matches a newline,
    // so under /m a match could start on an earlier blank line. Harmless for
    // byte spans, a wrong answer for line spans.
    const stripped = stripLeanComments(`def a := 1\n\n\ndef b := 2\n`);
    expect(leanDeclSpans(stripped).map((s) => [s.name, s.start])).toEqual([
      ["a", 1],
      ["b", 4],
    ]);
  });
});

describe("truncated names collided, and the collision chose an arbitrary span", () => {
  // Reduced from `qou/test.lean`, where this was found: five declarations
  // whose names all began `AlgElement`.
  const NS = `abbrev Monomial (G : Type u) := List G

structure AlgElement (G : Type u) (k : Type v) [Ring k] where
  coeff : Monomial G → k

def AlgElement.add {G} {k} [Ring k] (f g : AlgElement G k) : AlgElement G k :=
  f

def AlgElement.sub {G} {k} [Ring k] (f g : AlgElement G k) : AlgElement G k :=
  AlgElement.add f g
`;

  test("the namespace members are distinct keys, not one", () => {
    // Truncated, all four `AlgElement*` spans shared the key `AlgElement`, so
    // `new Map(...)` kept the LAST while `find` returned the FIRST — one name
    // meaning two different spans inside one function.
    const names = leanDeclSpans(stripLeanComments(NS)).map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(["Monomial", "AlgElement", "AlgElement.add", "AlgElement.sub"]);
  });

  test("a scope reaches what it references, not its namespace siblings", () => {
    // `structure AlgElement` references `Monomial` and nothing else here.
    // Before: it pulled in `AlgElement.sub`, the last colliding key, which it
    // does not reference.
    const scoped = scopeLeanToDecl(stripLeanComments(NS), "AlgElement");
    expect(scoped).toBeDefined();
    const kept = scoped!.split("\n").filter((l) => l.trim() !== "");
    expect(kept.some((l) => l.includes("abbrev Monomial"))).toBe(true);
    expect(kept.some((l) => l.includes("structure AlgElement"))).toBe(true);
    expect(kept.some((l) => l.includes("AlgElement.sub"))).toBe(false);
  });
});
