/**
 * Tests for the vacuity-by-construction axis.
 *
 * The motivating case is reproduced verbatim as a fixture: qou's
 * `ConfinementGradingCorrespondence.canonical` set both filtrations to `0` so
 * that `filtrations_agree := rfl` discharged the conjecture, and advertised
 * itself in its docstring as carrying "the explicit research-grade conjecture
 * as a sorry" while containing no `sorry`.
 *
 * Both halves of the conjunction are pinned negatively as well as positively:
 * degenerate data alone must NOT fire, and a `rfl` discharge alone must NOT
 * fire. That is the whole reason this axis is more specific than
 * `check-self-discharging-instances.ts`, and a regression that loosened it
 * would show up as noise rather than as a failure.
 *
 *     ./scripts/tests/run-tests.sh
 *     cd scripts/tests && bun test qa-checkers-vacuity.test.ts
 */

import { describe, test, expect } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  checkNoVacuousInstanceData,
  checkDocstringHonesty,
  parseFieldAssigns,
  parseDecls,
} from "../../content/pipeline/qa-checkers-vacuity";

function withLean<T>(src: string, fn: (p: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "qa-vacuity-"));
  try {
    const p = join(dir, "Fixture.lean");
    writeFileSync(p, src);
    return fn(p);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** The real defect, as it stood in qou. */
const MOTIVATING_CASE = `
namespace QOU.BraidKnot

/-- **Faithful instance.** Carries the explicit research-grade conjecture as a sorry. -/
instance canonical (R : Type u) [CommRing R] (q : R)
    [C : CrystalGraphRealization R q] :
    ConfinementGradingCorrespondence R q where
  confLevel _ := 0
  klrTopDegree _ := 0
  filtrations_agree _ := rfl

end QOU.BraidKnot
`;

describe("lean-no-vacuous-instance-data", () => {
  test("fires on the motivating case", () => {
    const r = withLean(MOTIVATING_CASE, (p) => checkNoVacuousInstanceData(p));
    expect(r.result).toBe("fail");
    expect(r.hits.length).toBeGreaterThan(0);
    expect(r.hits[0].text).toContain("filtrations_agree");
    expect(r.hits[0].text).toContain("confLevel := 0");
  });

  test("says so when the vacuous decl is an `instance`, not a `def`", () => {
    const r = withLean(MOTIVATING_CASE, (p) => checkNoVacuousInstanceData(p));
    expect(r.hits[0].text).toContain("resolved everywhere");
  });

  test("still fires on a `def`, but without the resolution warning", () => {
    const r = withLean(MOTIVATING_CASE.replace("instance canonical", "def canonical"), (p) =>
      checkNoVacuousInstanceData(p),
    );
    expect(r.result).toBe("fail");
    expect(r.hits[0].text).not.toContain("resolved everywhere");
  });

  test("an instance at a CONCRETE carrier is not the severe form", () => {
    // `instance foo : C SomeObject where …` binds nothing, so resolution
    // supplies it for that one object. Its degenerate fields are a claim about
    // that object, not about every carrier. Both survivors of the 2026-08-24
    // demotion sweep were this shape and both had been cleared by hand.
    const src = `
/-- Witness at a specific nucleus. -/
instance instR5FullWitness_helium3 : R5FullWitness LightNucleus.helium3 where
  primal_obj := 1
  dual_obj := 1
  duality_gap_le := by simp
`;
    const r = withLean(src, (p) => checkNoVacuousInstanceData(p));
    if (r.result === "fail") {
      expect(r.hits[0].text).not.toContain("resolved everywhere");
    }
  });

  test("an instance over a VARIABLE carrier IS the severe form", () => {
    const src = `
instance canonical (R : Type u) [CommRing R] (q : R) : S R q where
  lhs _ := 0
  rhs _ := 0
  lhs_eq_rhs _ := rfl
`;
    const r = withLean(src, (p) => checkNoVacuousInstanceData(p));
    expect(r.result).toBe("fail");
    expect(r.hits[0].text).toContain("resolved everywhere");
  });

  test("does NOT fire on degenerate data alone — a genuine zero object", () => {
    const src = `
/-- The zero module is a legitimate object. -/
instance zeroModel : MyStructure where
  carrier := 0
  dim := 0
`;
    const r = withLean(src, (p) => checkNoVacuousInstanceData(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on a `rfl` discharge alone — real reflexivity", () => {
    const src = `
/-- A real instance whose one law happens to be reflexivity. -/
instance realThing : MyStructure where
  confLevel T := T.degree + 1
  klrTopDegree T := T.degree + 1
  filtrations_agree _ := rfl
`;
    const r = withLean(src, (p) => checkNoVacuousInstanceData(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on an instance with no claim field at all", () => {
    const src = `
instance dataOnly : MyStructure where
  a := 0
  b := 0
`;
    const r = withLean(src, (p) => checkNoVacuousInstanceData(p));
    expect(r.result).toBe("pass");
  });

  test("catches PUnit and default as degenerate data", () => {
    const src = `
instance punitModel : MyStructure where
  cell _ := PUnit.unit
  weight _ := default
  cells_agree _ := rfl
`;
    const r = withLean(src, (p) => checkNoVacuousInstanceData(p));
    expect(r.result).toBe("fail");
  });

  test("catches `by simp` and `trivial` as trivial discharges", () => {
    for (const discharge of ["by simp", "trivial", "by decide"]) {
      const src = `
instance m : S where
  lhs _ := 0
  rhs _ := 0
  lhs_eq_rhs _ := ${discharge}
`;
      const r = withLean(src, (p) => checkNoVacuousInstanceData(p));
      expect(r.result).toBe("fail");
    }
  });

  test("n/a when there is no lean file", () => {
    expect(checkNoVacuousInstanceData(undefined).result).toBe("n/a");
    expect(checkNoVacuousInstanceData("/nonexistent/X.lean").result).toBe("n/a");
  });
});

describe("lean-docstring-honesty", () => {
  test("fires when the docstring claims a sorry and there is none", () => {
    const r = withLean(MOTIVATING_CASE, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("fail");
    expect(r.hits[0].text).toContain("canonical");
  });

  test("does NOT fire when the body really does carry a sorry", () => {
    const src = `
/-- Carries the conjecture as a sorry. -/
theorem open_claim : P = Q := by
  sorry
`;
    const r = withLean(src, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire when the docstring makes no honesty claim", () => {
    const src = `
/-- An ordinary instance. -/
instance ordinary : S where
  a := 0
  b := 0
  a_eq_b _ := rfl
`;
    const r = withLean(src, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on a docstring that quotes the lie in order to correct it", () => {
    // The remedy for this criterion is to rewrite the docstring explaining what
    // really discharges the term, which means quoting the false claim. Firing
    // on the fix would punish exactly the change the criterion asks for.
    const src = `
/-- The trivial model. Its docstring said "Carries the conjecture as a sorry."
    That was false: there is no \`sorry\`, it sets both fields to zero. -/
def canonical : S where
  a := 0
  b := 0
  a_eq_b _ := rfl
`;
    const r = withLean(src, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on `sorry-free` — a false positive found in the corpus", () => {
    // QOU/SchurWeyl/QJucysMurphy.lean `barSymJMSum_central` and
    // QOU/AlgebraicSubstrate/qou_obstruction_reduction.lean
    // `kappa_vanishes_iff_chi` both say "sorry-free" and were both flagged.
    const src = `
/-- Both are sorry-free; the fields carry the domain gap as explicit
    hypotheses rather than as a \`sorry\`. -/
theorem kappa_vanishes_iff_chi : P ↔ Q := by
  exact h
`;
    const r = withLean(src, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on a PAST-TENSE sorry that has since been removed", () => {
    // Recording the history is the docstring doing its job; reading it as a
    // present claim flags the note precisely because it is thorough.
    const src = `
/-- A hypothesis-free version of this statement was carried here as a
    \`sorry\` until 2026-08-17 (bean \`qou-gjg6\`); it is not provable by this
    route, and it was deleted rather than left standing as proof debt. -/
theorem barSymJMSum_central : P := by
  exact h
`;
    const r = withLean(src, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("pass");
  });

  test("STILL fires on a present-tense claim with no sorry — the guard is not a hole", () => {
    const src = `
/-- **Faithful instance.** Carries the explicit research-grade conjecture as a sorry. -/
def canonical : S where
  a := 0
  b := 0
  a_eq_b _ := rfl
`;
    const r = withLean(src, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("fail");
  });

  test("a `sorry` mentioned only in a comment does not count as carrying one", () => {
    const src = `
/-- Carries the conjecture as a sorry. -/
theorem fake : P = Q := by
  -- we could sorry here but we did not
  rfl
`;
    const r = withLean(src, (p) => checkDocstringHonesty(p));
    expect(r.result).toBe("fail");
  });
});

describe("parsers", () => {
  test("parseFieldAssigns reads name and value, ignoring binders", () => {
    const f = parseFieldAssigns("  confLevel _ := 0\n  agree _ := rfl\n", 10);
    expect(f.map((x) => x.name)).toEqual(["confLevel", "agree"]);
    expect(f.map((x) => x.value)).toEqual(["0", "rfl"]);
    expect(f[0].line).toBe(10);
  });

  test("parseFieldAssigns is not fooled by `:` inside a type ascription", () => {
    const f = parseFieldAssigns("  d : ∀ c, page c →ₗ[R] page c := 0\n", 1);
    expect(f[0].name).toBe("d");
    expect(f[0].value).toBe("0");
  });

  test("parseDecls attaches the preceding docstring", () => {
    const d = parseDecls("/-- Doc here. -/\ninstance foo : S where\n  a := 0\n");
    expect(d).toHaveLength(1);
    expect(d[0].name).toBe("foo");
    expect(d[0].kind).toBe("instance");
    expect(d[0].docstring).toContain("Doc here");
  });

  test("parseDecls handles a multi-line docstring", () => {
    const d = parseDecls("/-- Line one\n    line two. -/\ndef bar : S where\n  a := 0\n");
    expect(d[0].docstring).toContain("line two");
  });
});
