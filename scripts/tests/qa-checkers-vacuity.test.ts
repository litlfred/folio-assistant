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
  checkNoDefinitionalLaundering,
  checkDocstringHonesty,
  parseFieldAssigns,
  parseDecls,
  parseStructureDecls,
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

  test("parseStructureDecls reads a class's fields and their types", () => {
    const d = parseStructureDecls(SUBSTRATE_WIDTH_RULE);
    expect(d).toHaveLength(1);
    expect(d[0].kind).toBe("class");
    expect(d[0].name).toBe("SubstrateWidthRule");
    expect(d[0].fields.map((f) => f.name)).toEqual(["w", "is_color"]);
    expect(d[0].fields[1].type).toBe("∀ A, w A = cableWidthColor");
  });

  test("parseStructureDecls absorbs a field type that wraps onto later lines", () => {
    const d = parseStructureDecls(CRYSTAL_R_MATRIX);
    expect(d[0].fields.map((f) => f.name)).toEqual([
      "poleIndicator",
      "pole_indicator_correct",
    ]);
    expect(d[0].fields[1].type).toBe("∀ rho : ℤ, poleIndicator rho = decide (rho ≤ -1)");
  });

  test("parseStructureDecls skips the header binders, which precede `where`", () => {
    // `class C (R : Type u) [CommRing R] (q : R)` wraps onto a second line and
    // only then reaches `where`. Reading the binders as fields would invent a
    // field per binder group.
    const d = parseStructureDecls(CRYSTAL_R_MATRIX);
    expect(d[0].fields.map((f) => f.name)).not.toContain("R");
    expect(d[0].fields.map((f) => f.name)).not.toContain("C");
  });
});

/* ------------------------------------------------------------------ *
 * lean-no-definitional-laundering
 *
 * Every fixture below is a real qou declaration, quoted from the state it
 * was in when the 2026-08-24 hand audit read it (bean `folio-assistant-ilbh`).
 * Four of the eight have since been repaired, and the repaired form is pinned
 * NEGATIVELY beside the defect wherever the fix is quotable — a criterion that
 * still fires after the prescribed remedy is worse than no criterion.
 * ------------------------------------------------------------------ */

/** `QOU/QBeta/ToroidalHarmonicsBasis.lean` — `: Prop := True`, `let` discarded. */
const TOROIDAL_ODE = `
/-- **Opaque stub, not the ODE.** Intended: the toroidal-harmonic ODE. -/
def ToroidalHarmonicODE (n m : ℝ) (_F : ℝ → ℝ) (η : ℝ) : Prop :=
  -- _F'' - (n^2 - 1/4 + (m^2 - 1/4)/sinh^2(η)) _F = 0
  let V := n^2 - (1/4 : ℝ) + (m^2 - (1/4 : ℝ)) / (Real.sinh η)^2
  -- Scaffolding definition to capture the relation
  True -- Full differential operator formalism to be bridged to Mathlib

/-- **Opaque stub, not the ODE.** -/
def WeberODE (A B C : ℝ) (_F : ℝ → ℝ) (u : ℝ) : Prop :=
  True -- Full differential operator formalism to be bridged to Mathlib
`;

/** `QOU/Interactions/AlgebraicPrimality.lean` — `: Prop := False`, as it stood. */
const IN_TENSOR_SPAN_BEFORE = `
def InTensorSpan (_n : ℕ) (_q : ℝ)
    (_psi : SDPState _n _q) (_decomp : List ℕ) : Prop := False
`;

/** The 2026-08-24 repair: seal the body instead of pinning it to `False`. */
const IN_TENSOR_SPAN_AFTER = `
opaque InTensorSpan (_n : ℕ) (_q : ℝ)
    (_psi : SDPState _n _q) (_decomp : List ℕ) : Prop
`;

/** `QOU/Machinery/KashiwaraCrystalBasic.lean` — a constant behind one lambda. */
const DEMAZURE_SUBCRYSTAL = `
/-- **\`B(Λ₁)\` carries a genuine \`DemazureSubcrystal\`** at \`level = 1\`. -/
instance instSl2DemazureSubcrystal : DemazureSubcrystal standardSl2Crystal 1 where
  member := fun _ => True
  highest := false
  highest_mem := trivial
  highest_isHighest := fun _ => by simp [standardSl2Crystal]
  demazure_closure := fun _ _ _ _ _ _ => trivial
`;

/** `QOU/BraidKnot/CrystalRMatrixSubLemma.lean` — the `poleIndicator` shape. */
const CRYSTAL_R_MATRIX = `
class CrystalRMatrixSubLemma (R : Type u) [CommRing R] (q : R)
    [C : CrystalGraphRealization R q] where
  /-- Pole-order indicator. -/
  poleIndicator : ℤ → Bool
  /-- **The proposition itself.** -/
  pole_indicator_correct : ∀ rho : ℤ,
    poleIndicator rho = decide (rho ≤ -1)

/-- **Consistency witness.** \`poleIndicator\` is the indicator, so
    \`pole_indicator_correct\` holds by \`rfl\` (the indicator IS the witness
    function) — this instance introduces no \`sorry\`. -/
instance canonical (R : Type u) [CommRing R] (q : R) :
    let C := CrystalGraphRealization.canonical R q
    @CrystalRMatrixSubLemma R _ q C := by
  intro C
  exact {
    poleIndicator := fun rho => decide (rho ≤ -1)
    pole_indicator_correct := fun _ => rfl
  }
`;

/** `QOU/MassTheory/CableWidthBraneTowerLift.lean` — the same shape, `where`-form. */
const SUBSTRATE_WIDTH_RULE = `
class SubstrateWidthRule where
  /-- Per-nucleon cable width as a function of nucleon count \`A\`. -/
  w : ℕ → ℕ
  /-- The derived width is the color count \`3\` for every \`A\`. -/
  is_color : ∀ A, w A = cableWidthColor

/-- The color rule is a genuine instance: \`w ≡ 3\`. -/
instance colorRule : SubstrateWidthRule where
  w := fun _ => cableWidthColor
  is_color := fun _ => rfl
`;

/** `QOU/Archimedean/BorromeanQuark.lean` — contested by its own docstring. */
const BORROMEAN_QUARK = `
class BorromeanQuark where
  /-- The baryon topological mass functional (depends on q). -/
  topological_mass : ℝ → ℝ
  /-- The mass functional evaluates to the volume formula at every q > 1. -/
  volume_calibrates_mass :
    ∀ q : ℝ, q > 1 → topological_mass q = borromean_volume / (1 - 1/q)^2

/-- **Faithful instance.**  Defines \`topological_mass\` literally as the
    topological-volume formula, so \`volume_calibrates_mass\` closes by \`rfl\`.
    This is genuine content — the mass-calibration identity holds
    definitionally — not a vacuous discharge. -/
instance canonical : BorromeanQuark where
  topological_mass := fun q => borromean_volume / (1 - 1/q)^2
  volume_calibrates_mass := fun _ _ => rfl
`;

describe("lean-no-definitional-laundering — argument-ignoring bodies", () => {
  test("fires on `: Prop := True` behind a discarded `let`", () => {
    const r = withLean(TOROIDAL_ODE, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("fail");
    expect(r.hits.map((h) => h.text).join("\n")).toContain("ToroidalHarmonicODE");
    expect(r.hits.map((h) => h.text).join("\n")).toContain("WeberODE");
    expect(r.metrics?.constant_prop_defs).toBe(2);
  });

  test("fires on `: Prop := False` ignoring all four arguments", () => {
    const r = withLean(IN_TENSOR_SPAN_BEFORE, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("fail");
    expect(r.hits[0].text).toContain("InTensorSpan");
    expect(r.hits[0].text).toContain("constant `False`");
  });

  test("does NOT fire on the `opaque` repair of that same declaration", () => {
    // Sealing the body is the fix the criterion asks for. Firing on it would
    // make the criterion unfixable.
    const r = withLean(IN_TENSOR_SPAN_AFTER, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on a `def` that genuinely computes from its arguments", () => {
    const src = `
def jointTraceStrands (A w : ℕ) : ℕ := A * w

def ToroidalWellPosed (n m : ℝ) (F : ℝ → ℝ) (η : ℝ) : Prop :=
  F η = n ^ 2 - m ^ 2 ∧ η > 0
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on an argument-free `def X : Prop := True`", () => {
    // `QOU/Infra/DirichletL.lean` `beta3IsLChi4_3` is exactly this, and it is
    // a real defect — but it is `proof-no-trivial-true`'s `def-disguised-true`
    // pattern, already in the registry. Reporting it twice adds noise, not
    // signal. The boundary of THIS criterion is argument-ignoring bodies.
    const src = `
/-- Placeholder for the axiomatic class. -/
def beta3IsLChi4_3 : Prop := True
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("counts top-level argument groups, not parentheses", () => {
    // The arity is quoted back to the reader, so `(f : (ℕ → ℕ))` must read as
    // one group.
    const src = `
def Bogus (f : (ℕ → ℕ)) [Inhabited ℕ] : Prop := True
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.hits[0].text).toContain("takes 2 argument groups");
  });

  test("does NOT fire when the `let` result is actually returned", () => {
    const src = `
def RealODE (n : ℝ) (F : ℝ → ℝ) (η : ℝ) : Prop :=
  let V := n ^ 2 - (1 / 4 : ℝ)
  F η = V
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });
});

describe("lean-no-definitional-laundering — a constant behind a lambda", () => {
  test("fires on `member := fun _ => True` beside a reflexivity discharge", () => {
    const r = withLean(DEMAZURE_SUBCRYSTAL, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("fail");
    expect(r.hits[0].text).toContain("member := fun _ => True");
    expect(r.hits[0].text).toContain("highest_mem");
  });

  test("the sibling criterion misses it — that is why this one exists", () => {
    // `DEGENERATE_VALUE` is anchored `^…$`, so one `fun _ =>` defeats it.
    // If this ever starts failing, the two criteria have stopped partitioning
    // the defect and one of them is now redundant.
    const r = withLean(DEMAZURE_SUBCRYSTAL, (p) => checkNoVacuousInstanceData(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on a constant function with a NAMED binder", () => {
    // `fun n => 0` may well be the intended function. The wildcard is the
    // signal: it says the author is not looking at the argument.
    const src = `
instance zeroWeight : MyStructure where
  weight := fun n => 0
  weight_eq_zero := fun _ => rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire when some law needed a real proof", () => {
    // `verlindeData_two` in `KeystoneVerlindeSMatrixBridge.lean`: a small model
    // exhibited to show the class is inhabited. `qDim := fun _ => 1` is its
    // degenerate corner, not a laundering — `D_sq` and `D_ne` are proved.
    const src = `
/-- The n = 2 modular category over ℝ. -/
instance verlindeData_two : VerlindeModularData ℝ where
  conj_mem := by decide
  qDim := fun _ => 1
  D := Real.sqrt 2
  D_sq := by
    rw [Real.sq_sqrt (by norm_num : (0:ℝ) ≤ 2)]
    rw [Finset.sum_pair (by decide : (false : Bool) ≠ true)]; norm_num
  D_ne := by positivity
  S0_eq := fun _ _ => rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on a declared inhabitation witness", () => {
    // `rtData_two` in `KeystoneRTSurgeryConstruction.lean`. Every field is a
    // one-liner, so no structural signal separates it from a laundering — only
    // the stated intent does. The registry's own remedy for the sibling
    // criterion asks authors to write exactly this declaration.
    const src = `
/-- **Non-vacuity model — the n = 2 modular category over ℚ.** Confirms
\`RTSurgeryData\` is inhabited, so \`partitionSum\` is not vacuous. -/
def rtData_two : RTSurgeryData Bool ℚ where
  d := fun _ => 1
  D := 2
  d_vac := rfl
  D_ne := by norm_num
  colInv := fun _ => 1
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT double-report what the sibling criterion already flags", () => {
    // `HasGeneratorAction_punit` has BOTH a bare degenerate field and a
    // lambda-wrapped one. One report, from the criterion whose model fits.
    const src = `
def HasGeneratorAction_punit : S where
  sigma_action := fun _ => 0
  hecke_holds_witness := trivial
  far_commute_witness := trivial
`;
    expect(withLean(src, (p) => checkNoVacuousInstanceData(p)).result).toBe("fail");
    expect(withLean(src, (p) => checkNoDefinitionalLaundering(p)).result).toBe("pass");
  });
});

describe("lean-no-definitional-laundering — data defined to BE the claim", () => {
  test("fires on the `poleIndicator` shape, fields inside a tactic `exact { … }`", () => {
    const r = withLean(CRYSTAL_R_MATRIX, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("warn");
    expect(r.hits).toHaveLength(1);
    expect(r.hits[0].text).toContain("poleIndicator := fun rho => decide (rho ≤ -1)");
    expect(r.hits[0].text).toContain("CrystalRMatrixSubLemma.pole_indicator_correct");
  });

  test("neither sibling check sees the `poleIndicator` shape", () => {
    expect(withLean(CRYSTAL_R_MATRIX, (p) => checkNoVacuousInstanceData(p)).result).toBe("pass");
  });

  test("matches up to renaming of the instance's binder", () => {
    const renamed = CRYSTAL_R_MATRIX.replace(
      "poleIndicator := fun rho => decide (rho ≤ -1)",
      "poleIndicator := fun x => decide (x ≤ -1)",
    );
    const r = withLean(renamed, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("warn");
    expect(r.hits).toHaveLength(1);
  });

  test("the binder rename does not collide with a numeral in the body", () => {
    // The rename routes each binder through a placeholder. A printable one
    // collides: sending `y → n` via `" 0 "` rewrites `g 0 y` to `g n n` and
    // manufactures a match. Pinned because the failure mode is a false
    // POSITIVE that looks exactly like a true one.
    const src = `
class Shifted where
  f : ℕ → ℕ
  shift : ∀ n, f n = g 0 n

instance shiftedCanonical : Shifted where
  f := fun y => g 0 y
  shift := fun _ => rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("warn");
    expect(r.hits[0].text).toContain("`f n = g 0 n`");
  });

  test("does NOT fire when only a numeral, not the binder, lines up", () => {
    const src = `
class Shifted where
  f : ℕ → ℕ
  shift : ∀ n, f n = g 0 n

instance shiftedOther : Shifted where
  f := fun y => g 1 y
  shift := fun _ => rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire once the data is a class PARAMETER rather than a field", () => {
    // The 2026-08-24 repair (bean `qou-2y13`): take the width as a parameter so
    // the class can no longer choose its own datum. The instance still closes
    // by `rfl` and must no longer be reported — the class now has models it
    // fails on.
    const src = `
class SubstrateWidthRule (w : ℕ → ℕ) : Prop where
  /-- The width is the colour count \`3\` for every nucleon count \`A\`. -/
  is_color : ∀ A, w A = cableWidthColor

instance colorRule : SubstrateWidthRule (fun _ => cableWidthColor) where
  is_color := fun _ => rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("fires on the pre-repair form of that same class", () => {
    const r = withLean(SUBSTRATE_WIDTH_RULE, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("warn");
    expect(r.hits[0].text).toContain("w := fun _ => cableWidthColor");
  });

  test("fires on a point-free field pinned to a named constant", () => {
    // `ArchimedeanRealizationFunctor.q0 := q_zero` with `q0_canonical : q0 =
    // q_zero`. No lambda, no arguments, and `q0_canonical` matches no
    // claim-name heuristic — the CLASS is what identifies the claim here.
    const src = `
class ArchimedeanRealizationFunctor where
  /-- The substrate value \`q₀\` at which evaluation occurs. -/
  q0 : ℝ
  /-- \`q₀ > 1\`. -/
  q0_gt_one : q0 > 1
  /-- The substrate \`q₀\` matches the QOU canonical value. -/
  q0_canonical : q0 = q_zero

/-- Canonical instance: pin \`q₀\` to the QOU substrate value. -/
noncomputable instance canonical : ArchimedeanRealizationFunctor where
  q0 := q_zero
  q0_gt_one := q_zero_gt_one
  q0_canonical := rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("warn");
    expect(r.hits[0].text).toContain("q0 := q_zero");
  });

  test("reports the contested case at lower severity and says the author disputes it", () => {
    const r = withLean(BORROMEAN_QUARK, (p) => checkNoDefinitionalLaundering(p));
    // `warn`, not `fail` — the schema's "borderline; flags but does not block".
    expect(r.result).toBe("warn");
    expect(r.hits[0].text).toContain("REVIEW (not a verdict)");
    expect(r.hits[0].text).toContain("docstring disputes this reading");
  });

  test("does NOT fire when the instance's data differs from the claim's RHS", () => {
    const src = `
class BorromeanQuark where
  topological_mass : ℝ → ℝ
  volume_calibrates_mass :
    ∀ q : ℝ, q > 1 → topological_mass q = borromean_volume / (1 - 1/q)^2

instance canonical : BorromeanQuark where
  topological_mass := fun q => knotVolume q
  volume_calibrates_mass := fun q hq => by
    rw [knotVolume_eq_borromean q hq]
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT read an `=` inside a hypothesis as the field's conclusion", () => {
    // `demazure_closure : ∀ i, i < level → ∀ v w, member v → G.f i v = some w
    // → member w` contains an `=`. Matching it would invent an RHS the author
    // never wrote and compare the instance against a fiction.
    const src = `
class DemazureSubcrystal (G : CrystalGraph) (level : ℕ) where
  member : G.V → Prop
  demazure_closure :
    ∀ (i : ℕ), i < level → ∀ (v w : G.V),
      member v → G.f i v = some w → member w

instance realSubcrystal : DemazureSubcrystal standardSl2Crystal 1 where
  member := fun v => v.weight ≤ 1
  demazure_closure := fun _ _ _ _ h _ => le_trans h (by norm_num)
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire on a `theorem` that exhibits a record to prove an `∃`", () => {
    // `markov_trace_product`. Building a witness IS how one proves an
    // existential; theorem-shaped vacuity belongs to `proof-no-trivial-true`.
    const src = `
theorem markov_trace_product (z : R_q) (n : ℕ) (q : R_q) :
    ∃ (mtp : MarkovTraceProduct), mtp.traceValue = Finset.univ.prod f :=
  ⟨{
    traceValue := Finset.univ.prod f
    factorization := rfl
  }, rfl⟩
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("does NOT fire when the class is not declared in this file", () => {
    // Detection 3 needs the `class … where` block. Guessing across an import
    // would produce a confident report about a declaration never read.
    const src = `
instance canonical : SomeImportedClass where
  topological_mass := fun q => borromean_volume / (1 - 1/q)^2
  volume_calibrates_mass := fun _ _ => rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });
});

describe("lean-no-definitional-laundering — grading and plumbing", () => {
  test("a hard finding grades `fail`; a definitional identity alone grades `warn`", () => {
    expect(withLean(TOROIDAL_ODE, (p) => checkNoDefinitionalLaundering(p)).result).toBe("fail");
    expect(withLean(BORROMEAN_QUARK, (p) => checkNoDefinitionalLaundering(p)).result).toBe("warn");
  });

  test("counts each detection separately in `metrics`", () => {
    const r = withLean(BORROMEAN_QUARK, (p) => checkNoDefinitionalLaundering(p));
    expect(r.metrics).toEqual({
      constant_prop_defs: 0,
      lambda_constant_fields: 0,
      definitional_identities: 1,
    });
  });

  test("a clean file passes", () => {
    const src = `
/-- An honest instance. -/
instance realThing : MyStructure where
  confLevel T := T.degree + 1
  klrTopDegree T := T.degree + 1
  filtrations_agree _ := rfl
`;
    const r = withLean(src, (p) => checkNoDefinitionalLaundering(p));
    expect(r.result).toBe("pass");
  });

  test("n/a when there is no lean file", () => {
    expect(checkNoDefinitionalLaundering(undefined).result).toBe("n/a");
    expect(checkNoDefinitionalLaundering("/nonexistent/X.lean").result).toBe("n/a");
  });
});
