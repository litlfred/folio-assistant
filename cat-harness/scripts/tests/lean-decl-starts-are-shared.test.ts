/**
 * One answer to *where does a Lean declaration begin*, and it is
 * `lean-lexer`'s `declarationStarts`.
 *
 * Bean `bqrg`, second half. The first half converged six `stripLeanComments`
 * implementations onto one module and is gated by
 * `lean-lexer-is-the-only-stripper.test.ts`. The declaration splitter was what
 * was left, and it was not one duplicate but two functions answering different
 * questions off two different regexes.
 *
 * ## This file replaced `lean-decl-regex-divergence.test.ts`
 *
 * That file PINNED the divergence, on a stated reason:
 *
 * > this repository has no Lean corpus to re-sweep against
 *
 * The assertion was true and is kept below. The conclusion drawn from it was
 * not: the corpus is a SIBLING CHECKOUT rather than a file in this tree, and
 * `lean-lexer-is-the-only-stripper.test.ts` in this same directory already
 * recorded a 3,954-file sweep run from a container exactly like this one. Its
 * own instruction for that case was to replace it with "one union pattern plus
 * its results", which is what this is.
 *
 * ## The sweep — 3,971 files, 52,144 declarations, 2026-09-25
 *
 *     union (DECL_RE now)    52,144
 *     DECL_RE, before        51,901   missed 243 in 105 files
 *                                     axiom 113, opaque 130; no `unsafe` in this corpus
 *     LEAN_DECL_RE           52,144   every name, 990 (1.9%) truncated at the dot
 *
 * **A missed keyword is not a skipped declaration.** `splitDeclarations`
 * slices from one start to the NEXT, so unrecognised text is absorbed into the
 * body of whatever precedes it. Those 243 were reported as part of another
 * declaration's body, in authored content — `vertex-algebra-relations.lean`
 * absorbed 9 on its own — and the triviality probe splices bodies.
 *
 * @module cat-harness/scripts/tests/lean-decl-starts-are-shared.test
 */
import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";
import {
  declarationStarts,
  splitDeclarations,
  stripLeanComments,
} from "../../content/pipeline/lean-lexer.js";
import { leanDeclSpans, scopeLeanToDecl } from "../../content/pipeline/qa-checkers-q-usage.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const ROOT = repoRootFor(INSTANCE);
const CANONICAL = "cat-harness/content/pipeline/lean-lexer.ts";

/** One declaration of each shape the two patterns disagreed about. */
const DIVERGENT = `theorem alpha : True := by trivial

axiom choice_ax : Nonempty Nat

unsafe def beta (n : Nat) : Nat := n + 1

opaque gamma : Nat := 7

def Ns.delta : Nat := 3
`;

describe("every shape the two patterns disagreed about is found", () => {
  const names = declarationStarts(stripLeanComments(DIVERGENT)).map((d) => d.name);

  test("all five, in source order", () => {
    expect(names).toEqual(["alpha", "choice_ax", "beta", "gamma", "Ns.delta"]);
  });

  test.each([["axiom", "choice_ax"], ["opaque", "gamma"], ["the unsafe modifier", "beta"]])(
    "%s — was missed by DECL_RE, absorbed into alpha's body",
    (_shape, name) => {
      expect(names).toContain(name);
    },
  );

  test("a dotted name is NOT truncated at the dot", () => {
    // 990 of the corpus's 52,144. `LEAN_DECL_RE` returned `Ns`, so a lookup by
    // name missed every one of them.
    expect(names).toContain("Ns.delta");
    expect(names).not.toContain("Ns");
  });
});

describe("a missed keyword is ABSORBED, which is why the gap mattered", () => {
  const spans = splitDeclarations(stripLeanComments(DIVERGENT));

  test("no declaration's body contains another declaration", () => {
    // Asserted as a property over every span rather than on one example, so a
    // keyword this lexer does not yet know fails HERE rather than being
    // quietly attributed to its predecessor.
    for (const s of spans) {
      for (const kw of ["axiom ", "opaque ", "theorem ", "unsafe def ", "def "]) {
        expect(s.body.includes(kw), `${s.name}'s body absorbed a \`${kw.trim()}\``).toBe(false);
      }
    }
  });

  test("alpha's body is its own and nothing else", () => {
    expect(spans.find((s) => s.name === "alpha")?.body.trim()).toBe(":= by trivial");
  });

  test("a body-less declaration reports bodyAt -1, which the probe checks", () => {
    // An `axiom` has no `:=`. `lean-triviality-probe` skips on `bodyAt < 0`
    // rather than splicing, so admitting axioms cannot make it rewrite
    // something it has no cut for.
    const ax = spans.find((s) => s.name === "choice_ax");
    expect(ax?.body).toBe("");
    expect(ax?.bodyAt).toBe(-1);
  });
});

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
    // "STRIPPED-text" is doing real work in that sentence, and the first draft
    // of this test got it wrong — it expected `b` on line 5 and asserted a
    // property the codebase does not have. `b` reports line **4**, because
    // `stripLeanComments` writes a space over the NEWLINE inside a block
    // comment as well as over its text: length survives, line count does not.
    // Measured over 3,971 corpus files, 3,931 of them (99.0%) shift, losing
    // 281,234 lines in total. That is bean `vrfx`, filed rather than fixed
    // here: it moves a reader-facing line number on almost every file in a
    // corpus, which is its own change with its own before/after.
    //
    // `leanDeclSpans` is self-consistent either way — it has always numbered
    // the stripped text, which is also what `scopeLeanToDecl` returns — so
    // this convergence neither causes nor cures that. Asserting the real
    // behaviour keeps the two beans separable.
    const src = `-- a line comment\ndef a := 1\n/- block\n   comment -/\ndef b := 2\n`;
    const stripped = stripLeanComments(src);
    expect(stripped.length).toBe(src.length);
    expect(leanDeclSpans(stripped).map((s) => [s.name, s.start])).toEqual([
      ["a", 2],
      ["b", 4],
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

describe("there is exactly one declaration pattern", () => {
  const files = [...new Glob("**/*.ts").scanSync({ cwd: INSTANCE, absolute: true })]
    .filter((f) => !f.includes("/node_modules/") && !f.endsWith(".test.ts"))
    .sort();

  test("the scan found files — otherwise nothing below proves anything", () => {
    expect(files.length).toBeGreaterThan(200);
  });

  /** Files carrying a `theorem|lemma|def`-style alternation, excluding comments. */
  function patternFiles(): string[] {
    const LEAN_KEYWORDS = /theorem\|lemma\|def\b/;
    const hits = new Set<string>();
    for (const f of files) {
      const rel = relative(ROOT, f);
      for (const line of readFileSync(f, "utf-8").split("\n")) {
        if (/^\s*(\*|\/\/|#)/.test(line)) continue; // describing one is not being one
        if (LEAN_KEYWORDS.test(line)) hits.add(rel);
      }
    }
    return [...hits].sort();
  }

  test("neither converged module carries a local pattern any more", () => {
    // The scoped claim, and the only one this change earns. `DECL_RE` lives in
    // the canonical module; `qa-checkers-q-usage` reads it through
    // `declarationStarts` and defines nothing.
    expect(patternFiles()).not.toContain("cat-harness/content/pipeline/qa-checkers-q-usage.ts");
  });

  test("FIVE other modules still carry their own, and the list may only shrink", () => {
    // FOUND BY THIS TEST, not by the bean: `bqrg` said the declaration
    // splitter had "at least two" implementations. It has EIGHT sites across
    // seven files, and every extra one is missing a keyword the union has:
    //
    //   conjectural-propagation-audit   misses example, inductive
    //   generate-lean-stubs            misses axiom, example, opaque
    //   proof-narrative-lean-equiv-sweep misses example, opaque
    //   qa-utils                       misses example
    //   lean-coverage                  misses axiom, example, inductive, opaque
    //
    // `axiom` and `opaque` are the two that cost 243 declarations in the
    // corpus sweep, and three of the five miss one or both.
    //
    // NOT converged here, for the bean's own reason: each feeds a different
    // consumer, so each is its own corpus re-sweep and its own changed verdict
    // on merged content. Converging five more on the strength of one sweep is
    // exactly the "cleanup becomes a silent re-scoring" the bean warns about.
    //
    // Asserted by FILE rather than by line, so an unrelated edit above a
    // pattern does not fail this. The list may only shrink: a sixth file fails
    // here, and converging one lets somebody delete a row.
    expect(patternFiles()).toEqual([
      "cat-harness/content/pipeline/conjectural-propagation-audit.ts",
      "cat-harness/content/pipeline/generate-lean-stubs.ts",
      "cat-harness/content/pipeline/lean-lexer.ts",
      "cat-harness/content/pipeline/proof-narrative-lean-equiv-sweep.ts",
      "cat-harness/content/pipeline/qa-utils.ts",
      "cat-harness/scripts/lean-coverage.ts",
    ]);
  });

  test("...and it is used from outside, so the rule is not vacuous", () => {
    const callers = files.filter(
      (f) => relative(ROOT, f) !== CANONICAL && /declarationStarts/.test(readFileSync(f, "utf-8")),
    );
    expect(callers.length).toBeGreaterThanOrEqual(1);
  });
});

describe("the corpus this was swept against is not in this repository", () => {
  test("no `.lean` file is tracked here", () => {
    // KEPT from the file this replaced, because the assertion was always true
    // and is worth holding: this is the platform, and Lean content belongs to
    // a folio. What changed is the inference — a sibling checkout is where the
    // corpus lives, and `lean-lexer-is-the-only-stripper.test.ts` had already
    // swept one from a container like this.
    const found = [...new Glob("**/*.lean").scanSync({ cwd: ROOT, onlyFiles: true })].filter(
      (p) => !p.includes("node_modules"),
    );
    expect(found, `Lean files appeared: ${found.slice(0, 5).join(", ")}`).toEqual([]);
  });

  test("so the sweep's results are recorded rather than re-run in CI", () => {
    // A test cannot re-derive 52,144 from a repository holding zero files. The
    // numbers live in `declarationStarts`' comment and this module's header,
    // and what CI checks is the behaviour they justified — every assertion
    // above. This test pins that the claim is written down somewhere a reader
    // will find it, so converging without recording a sweep fails here.
    const lexer = readFileSync(resolve(ROOT, CANONICAL), "utf-8");
    expect(lexer).toContain("52,144");
    expect(lexer).toContain("3,971");
  });
});
