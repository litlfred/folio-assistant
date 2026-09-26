/**
 * Scanner tests for the duplicate-declaration audit.
 *
 * The namespace stack is the part that goes wrong: an earlier scanner in this
 * family mis-attributed every declaration after the first named `section`,
 * which both invents collisions and hides real ones. That case and the rest of
 * the traps are pinned here, on this scanner too, because it repeats the stack
 * walk rather than sharing `check-mirror-drift`'s (the two answer different
 * questions).
 */
import { test, expect, describe } from "bun:test";
import { scanDecls } from "../check-duplicate-decls.ts";

const F = "/tmp/x.lean";
const fqns = (src: string) => scanDecls(F, src).map((d) => d.fqn);

describe("scanDecls", () => {
  test("every kind that occupies the flat namespace is scanned", () => {
    const src = [
      "abbrev a := 1",
      "def b := 1",
      "structure c where x : ℕ",
      "class d where y : ℕ",
      "instance e : Inhabited ℕ := ⟨0⟩",
      "theorem f : True := trivial",
      "lemma g : True := trivial",
      "inductive h | mk",
      "opaque i : ℕ",
      "axiom j : True",
    ].join("\n");
    expect(scanDecls(F, src).map((d) => d.kind).sort()).toEqual([
      "abbrev", "axiom", "class", "def", "inductive",
      "instance", "lemma", "opaque", "structure", "theorem",
    ]);
  });

  test("a named section does not corrupt the namespace of later declarations", () => {
    expect(
      fqns(`namespace QOU
section Helpers
abbrev inside := 1
end Helpers
abbrev after := 1
end QOU
`),
    ).toEqual(["QOU.inside", "QOU.after"]);
  });

  test("an anonymous section is popped too", () => {
    expect(
      fqns(`namespace QOU
section
def a := 1
end
def b := 1
end QOU
`),
    ).toEqual(["QOU.a", "QOU.b"]);
  });

  test("nested namespaces concatenate", () => {
    expect(
      fqns(`namespace QOU
namespace BraidKnot
abbrev R_q := 1
end BraidKnot
end QOU
`),
    ).toEqual(["QOU.BraidKnot.R_q"]);
  });

  test("two namespaces in one file each get their own prefix", () => {
    // `BraidKnot/CasimirShared.lean` does exactly this: it declares
    // `QOU.R_q := RatFunc ℚ` and, further down, `QOU.Braiding.R_q :=
    // LaurentPolynomial ℤ`.
    expect(
      fqns(`namespace QOU
abbrev R_q := RatFunc ℚ
end QOU
namespace QOU.Braiding
abbrev R_q := LaurentPolynomial ℤ
end QOU.Braiding
`),
    ).toEqual(["QOU.R_q", "QOU.Braiding.R_q"]);
  });

  test("block comments and line comments are skipped", () => {
    expect(
      fqns(`namespace QOU
/-
def commentedOut := 1
-/
-- def alsoCommented := 1
def real := 1
end QOU
`),
    ).toEqual(["QOU.real"]);
  });

  test("a single-line block comment does not open a comment region", () => {
    expect(
      fqns(`namespace QOU
/-- a docstring on one line -/
def kept := 1
end QOU
`),
    ).toEqual(["QOU.kept"]);
  });

  test("modifiers and attributes do not hide a declaration", () => {
    expect(
      fqns(`namespace QOU
@[simp] theorem a : True := trivial
noncomputable def b := 1
private abbrev c := 1
protected noncomputable def d := 1
end QOU
`),
    ).toEqual(["QOU.a", "QOU.b", "QOU.c", "QOU.d"]);
  });

  test("records the line so a finding can be clicked to source", () => {
    expect(scanDecls(F, "\n\n\ndef s := 1\n")[0].line).toBe(4);
  });

  test("a name that merely starts with a keyword is not a declaration", () => {
    // `defaultWeight` begins with `def`; the word boundary must hold.
    expect(fqns("defaultWeight := 1\n")).toEqual([]);
  });
});

describe("dotted declaration names", () => {
  // Capturing only up to the first dot manufactures collisions. The first run
  // of this checker reported QOU.AppendixSurreals.SurrealField as declared by a
  // class, a theorem and a def across three modules; the latter two were
  // `SurrealField.IsFinite.pow` and `SurrealField.finiteSubring`, which collide
  // with nothing.
  test("a dotted name is captured whole, not truncated at the first dot", () => {
    expect(
      fqns(`namespace QOU
class SurrealField where x : ℕ
theorem SurrealField.IsFinite.pow : True := trivial
def SurrealField.finiteSubring := 1
end QOU
`),
    ).toEqual([
      "QOU.SurrealField",
      "QOU.SurrealField.IsFinite.pow",
      "QOU.SurrealField.finiteSubring",
    ]);
  });

  test("a dotted name still picks up the enclosing namespace", () => {
    expect(
      fqns("namespace A.B\ntheorem C.d : True := trivial\nend A.B\n"),
    ).toEqual(["A.B.C.d"]);
  });
});
