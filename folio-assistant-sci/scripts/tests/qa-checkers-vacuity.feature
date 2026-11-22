Feature: the Lean vacuity checkers — vacuous instance data, docstring honesty, definitional laundering and placeholder stubs

  Each Lean source below is written to a temporary .lean file and checked there. The motivating case is qou's
  ConfinementGradingCorrespondence.canonical: an instance over a variable carrier whose two data fields are 0,
  whose claim field filtrations_agree is discharged by rfl, and whose docstring says it carries the conjecture
  as a sorry while containing none.

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::vacuousDataFiresOnMotivatingCase
  Scenario: fires on the motivating case
    When lean-no-vacuous-instance-data checks the motivating case
    Then it fails with at least one hit
    And the first hit names filtrations_agree and "confLevel := 0"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::vacuousInstanceSaysResolvedEverywhere
  Scenario: says so when the vacuous decl is an `instance`, not a `def`
    When lean-no-vacuous-instance-data checks the motivating case
    Then the first hit says "resolved everywhere"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::vacuousDefFiresWithoutResolution
  Scenario: still fires on a `def`, but without the resolution warning
    When the motivating case is written as a def and checked
    Then it fails
    And the first hit does not say "resolved everywhere"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::dataReadingBinderPasses
  Scenario: does NOT fire when a data field reads its own binder
    Given sl3DemazureLevelOne, whose member is "fun v => v ≠ 2", with highest := 0 and highest_mem by decide
    When lean-no-vacuous-instance-data checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::wildcardBinderNotDependence
  Scenario: a WILDCARD binder is not argument-dependence
    Given the same shape with member "fun _ => True"
    When lean-no-vacuous-instance-data checks it
    Then it fails

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::pointFullBindersCount
  Scenario: point-full binders count too — `f x := g x`, not just lambdas
    Given a def with "weight n := n + 1", base := 0 and base_eq := rfl
    When lean-no-vacuous-instance-data checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::concreteCarrierNotSevere
  Scenario: an instance at a CONCRETE carrier is not the severe form
    Given an instance at the concrete carrier LightNucleus.helium3 with constant fields and a simp discharge
    When lean-no-vacuous-instance-data checks it
    Then if it fails, the first hit does not say "resolved everywhere"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::variableCarrierIsSevere
  Scenario: an instance over a VARIABLE carrier IS the severe form
    Given an instance over a variable ring R whose lhs and rhs are 0 and whose lhs_eq_rhs is rfl
    When lean-no-vacuous-instance-data checks it
    Then it fails, and the first hit says "resolved everywhere"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::degenerateDataAlonePasses
  Scenario: does NOT fire on degenerate data alone — a genuine zero object
    Given an instance with carrier := 0 and dim := 0 and no claim field
    When lean-no-vacuous-instance-data checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::rflAlonePasses
  Scenario: does NOT fire on a `rfl` discharge alone — real reflexivity
    Given an instance whose data fields compute T.degree + 1 and whose claim is rfl
    When lean-no-vacuous-instance-data checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::noClaimFieldPasses
  Scenario: does NOT fire on an instance with no claim field at all
    Given an instance with only a := 0 and b := 0
    When lean-no-vacuous-instance-data checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::punitAndDefaultDegenerate
  Scenario: catches PUnit and default as degenerate data
    Given an instance with cell := PUnit.unit, weight := default and cells_agree := rfl
    When lean-no-vacuous-instance-data checks it
    Then it fails

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::simpTrivialDecideDischarges
  Scenario: catches `by simp` and `trivial` as trivial discharges
    Given an instance with lhs and rhs 0 whose lhs_eq_rhs is "by simp", "trivial" or "by decide"
    When lean-no-vacuous-instance-data checks each
    Then each fails

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-vacuous-instance-data::vacuousDataNaWithoutFile
  Scenario: n/a when there is no lean file
    Then lean-no-vacuous-instance-data gives "n/a" for no path and for a file that does not exist

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::docstringClaimsAbsentSorryFires
  Scenario: fires when the docstring claims a sorry and there is none
    When lean-docstring-honesty checks the motivating case
    Then it fails, and the first hit names canonical

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::docstringWithRealSorryPasses
  Scenario: does NOT fire when the body really does carry a sorry
    Given a theorem documented as carrying the conjecture as a sorry, proved by sorry
    When lean-docstring-honesty checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::docstringWithoutClaimPasses
  Scenario: does NOT fire when the docstring makes no honesty claim
    Given an ordinary instance with an ordinary docstring
    When lean-docstring-honesty checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::docstringQuotingLiePasses
  Scenario: does NOT fire on a docstring that quotes the lie in order to correct it
    Given a docstring quoting "Carries the conjecture as a sorry." and saying that was false
    When lean-docstring-honesty checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::sorryFreeDocstringPasses
  Scenario: does NOT fire on `sorry-free` — a false positive found in the corpus
    Given a docstring saying both are "sorry-free"
    When lean-docstring-honesty checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::pastTenseSorryPasses
  Scenario: does NOT fire on a PAST-TENSE sorry that has since been removed
    Given a docstring saying a version "was carried here as a sorry until 2026-08-17" and was deleted
    When lean-docstring-honesty checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::presentTenseClaimStillFires
  Scenario: STILL fires on a present-tense claim with no sorry — the guard is not a hole
    Given a def whose docstring says it "Carries the explicit research-grade conjecture as a sorry" and has none
    When lean-docstring-honesty checks it
    Then it fails

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-docstring-honesty::sorryInCommentNotCarried
  Scenario: a `sorry` mentioned only in a comment does not count as carrying one
    Given a theorem documented as carrying a sorry, proved by rfl, with "sorry" only in a line comment
    When lean-docstring-honesty checks it
    Then it fails

  @test:scripts/tests/qa-checkers-vacuity.test.ts::parsers::fieldAssignsNameValueLine
  Scenario: parseFieldAssigns reads name and value, ignoring binders
    When parseFieldAssigns reads "confLevel _ := 0" and "agree _ := rfl" starting at line 10
    Then the names are confLevel and agree, the values 0 and rfl, and the first is on line 10

  @test:scripts/tests/qa-checkers-vacuity.test.ts::parsers::fieldAssignsIgnoresTypeColon
  Scenario: parseFieldAssigns is not fooled by `:` inside a type ascription
    When parseFieldAssigns reads "d : ∀ c, page c →ₗ[R] page c := 0"
    Then the name is d and the value is 0

  @test:scripts/tests/qa-checkers-vacuity.test.ts::parsers::parseDeclsAttachesDocstring
  Scenario: parseDecls attaches the preceding docstring
    When parseDecls reads an instance foo under "/-- Doc here. -/"
    Then there is one declaration, instance foo, whose docstring contains "Doc here"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::parsers::parseDeclsMultilineDocstring
  Scenario: parseDecls handles a multi-line docstring
    When parseDecls reads a def under a two-line docstring
    Then its docstring contains "line two"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::parsers::structureDeclsFieldsAndTypes
  Scenario: parseStructureDecls reads a class's fields and their types
    When parseStructureDecls reads the SubstrateWidthRule fixture
    Then there is one class SubstrateWidthRule with fields w and is_color
    And is_color's type is "∀ A, w A = cableWidthColor"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::parsers::structureDeclsWrappedFieldType
  Scenario: parseStructureDecls absorbs a field type that wraps onto later lines
    When parseStructureDecls reads the CrystalRMatrixSubLemma fixture
    Then its fields are poleIndicator and pole_indicator_correct
    And pole_indicator_correct's type is "∀ rho : ℤ, poleIndicator rho = decide (rho ≤ -1)"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::parsers::structureDeclsSkipsHeaderBinders
  Scenario: parseStructureDecls skips the header binders, which precede `where`
    When parseStructureDecls reads the CrystalRMatrixSubLemma fixture
    Then neither R nor C is a field

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_argument-ignoring_bodies::launderingPropTrueBehindLet
  Scenario: fires on `: Prop := True` behind a discarded `let`
    Given ToroidalHarmonicODE, which binds a let and returns True, and WeberODE, which returns True
    When lean-no-definitional-laundering checks them
    Then it fails, naming both
    And it counts 2 constant Prop defs

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_argument-ignoring_bodies::launderingPropFalseIgnoringArgs
  Scenario: fires on `: Prop := False` ignoring all four arguments
    Given InTensorSpan as it stood, a four-argument def returning False
    When lean-no-definitional-laundering checks it
    Then it fails, naming InTensorSpan and "constant `False`"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_argument-ignoring_bodies::opaqueRepairPasses
  Scenario: does NOT fire on the `opaque` repair of that same declaration
    Given InTensorSpan repaired as an opaque with no body
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_argument-ignoring_bodies::computingDefPasses
  Scenario: does NOT fire on a `def` that genuinely computes from its arguments
    Given a def returning A * w and a Prop def that uses its arguments
    When lean-no-definitional-laundering checks them
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_argument-ignoring_bodies::argumentFreePropTruePasses
  Scenario: does NOT fire on an argument-free `def X : Prop := True`
    Given "def beta3IsLChi4_3 : Prop := True"
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_argument-ignoring_bodies::countsTopLevelArgGroups
  Scenario: counts top-level argument groups, not parentheses
    Given "def Bogus (f : (ℕ → ℕ)) [Inhabited ℕ] : Prop := True"
    When lean-no-definitional-laundering checks it
    Then the hit says "takes 2 argument groups"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_argument-ignoring_bodies::returnedLetPasses
  Scenario: does NOT fire when the `let` result is actually returned
    Given a Prop def that binds V in a let and returns F η = V
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::lambdaConstantBesideRflReported
  Scenario: reports `member := fun _ => True` beside a reflexivity discharge
    Given instSl2DemazureSubcrystal, with member := fun _ => True and trivial claim fields
    When lean-no-definitional-laundering checks it
    Then the first hit names "member := fun _ => True" and highest_mem

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::lambdaConstantGradedWarn
  Scenario: grades detection 2 `warn`, not `fail` — the constant may be correct
    When lean-no-definitional-laundering checks instSl2DemazureSubcrystal
    Then the result is "warn" and the hit says "REVIEW (not a verdict)"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::propTautologyStillFails
  Scenario: detection 1 is still a verdict — a tautology is wrong either way
    Given "def Bogus (n : ℕ) : Prop := True"
    When lean-no-definitional-laundering checks it
    Then it fails

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::siblingMissesLambdaConstant
  Scenario: the sibling criterion misses it — that is why this one exists
    When lean-no-vacuous-instance-data checks instSl2DemazureSubcrystal
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::namedBinderConstantPasses
  Scenario: does NOT fire on a constant function with a NAMED binder
    Given an instance with weight := fun n => 0 and a rfl claim
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::realProofLawPasses
  Scenario: does NOT fire when some law needed a real proof
    Given verlindeData_two, with qDim := fun _ => 1 and laws D_sq and D_ne proved by real tactics
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::inhabitationWitnessPasses
  Scenario: does NOT fire on a declared inhabitation witness
    Given rtData_two, whose docstring says it is a non-vacuity model confirming the class is inhabited
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_a_constant_behind_a_lambda::noDoubleReportWithSibling
  Scenario: does NOT double-report what the sibling criterion already flags
    Given HasGeneratorAction_punit, with sigma_action := fun _ => 0 and trivial claim fields
    Then lean-no-vacuous-instance-data fails on it
    And lean-no-definitional-laundering passes it

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::poleIndicatorShapeInExact
  Scenario: fires on the `poleIndicator` shape, fields inside a tactic `exact { … }`
    When lean-no-definitional-laundering checks the CrystalRMatrixSubLemma fixture
    Then it warns with exactly one hit
    And the hit names "poleIndicator := fun rho => decide (rho ≤ -1)" and CrystalRMatrixSubLemma.pole_indicator_correct

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::siblingMissesPoleIndicator
  Scenario: neither sibling check sees the `poleIndicator` shape
    When lean-no-vacuous-instance-data checks the CrystalRMatrixSubLemma fixture
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::matchesUpToBinderRename
  Scenario: matches up to renaming of the instance's binder
    Given the fixture with the instance's binder renamed from rho to x
    When lean-no-definitional-laundering checks it
    Then it warns with exactly one hit

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::binderRenameNoNumeralCollision
  Scenario: the binder rename does not collide with a numeral in the body
    Given a class Shifted with shift : ∀ n, f n = g 0 n, and an instance with f := fun y => g 0 y
    When lean-no-definitional-laundering checks it
    Then it warns, quoting "`f n = g 0 n`"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::onlyNumeralLinesUpPasses
  Scenario: does NOT fire when only a numeral, not the binder, lines up
    Given the same class and an instance with f := fun y => g 1 y
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::classParameterRepairPasses
  Scenario: does NOT fire once the data is a class PARAMETER rather than a field
    Given SubstrateWidthRule repaired to take w as a class parameter, with an instance closing by rfl
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::preRepairWidthRuleWarns
  Scenario: fires on the pre-repair form of that same class
    When lean-no-definitional-laundering checks the SubstrateWidthRule fixture
    Then it warns, naming "w := fun _ => cableWidthColor"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::pointFreeNamedConstantWarns
  Scenario: fires on a point-free field pinned to a named constant
    Given ArchimedeanRealizationFunctor with q0_canonical : q0 = q_zero, and an instance with q0 := q_zero
    When lean-no-definitional-laundering checks it
    Then it warns, naming "q0 := q_zero"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::contestedCaseLowerSeverity
  Scenario: reports the contested case at lower severity and says the author disputes it
    When lean-no-definitional-laundering checks the BorromeanQuark fixture, whose docstring calls it genuine content
    Then it warns, saying "REVIEW (not a verdict)" and "docstring disputes this reading"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::dataDiffersFromRhsPasses
  Scenario: does NOT fire when the instance's data differs from the claim's RHS
    Given BorromeanQuark with topological_mass := fun q => knotVolume q, proved by a rewrite
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::hypothesisEqualsNotConclusion
  Scenario: does NOT read an `=` inside a hypothesis as the field's conclusion
    Given a DemazureSubcrystal class whose closure field has an = only in a hypothesis, and a real instance
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::theoremExhibitingWitnessPasses
  Scenario: does NOT fire on a `theorem` that exhibits a record to prove an `∃`
    Given markov_trace_product, a theorem proving an ∃ by exhibiting a record
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_data_defined_to_BE_the_claim::undeclaredClassPasses
  Scenario: does NOT fire when the class is not declared in this file
    Given an instance of a class that is not declared in the file
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_grading_and_plumbing::hardFailIdentityWarn
  Scenario: a hard finding grades `fail`; a definitional identity alone grades `warn`
    Then lean-no-definitional-laundering fails the ToroidalHarmonicODE fixture
    And it warns on the BorromeanQuark fixture

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_grading_and_plumbing::metricsCountEachDetection
  Scenario: counts each detection separately in `metrics`
    When lean-no-definitional-laundering checks the BorromeanQuark fixture
    Then its metrics are 0 constant Prop defs, 0 lambda-constant fields and 1 definitional identity

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_grading_and_plumbing::cleanFilePasses
  Scenario: a clean file passes
    Given an honest instance whose data fields compute T.degree + 1
    When lean-no-definitional-laundering checks it
    Then it passes

  @test:scripts/tests/qa-checkers-vacuity.test.ts::lean-no-definitional-laundering_—_grading_and_plumbing::launderingNaWithoutFile
  Scenario: n/a when there is no lean file
    Then lean-no-definitional-laundering gives "n/a" for no path and for a file that does not exist

  @test:scripts/tests/qa-checkers-vacuity.test.ts::proof-no-placeholder-stub::bareStubCommentFails
  Scenario: fails on a bare placeholder stub comment
    Given a file holding only "-- Manuscript.Chapter1.Theorem1 — placeholder stub"
    When proof-no-placeholder-stub checks it
    Then it fails with one hit on line 1 saying "bare placeholder stub"

  @test:scripts/tests/qa-checkers-vacuity.test.ts::proof-no-placeholder-stub::stubWithImportsDocstringFails
  Scenario: fails on a stub with imports and module docstring
    Given a file with "import Mathlib" and a module docstring saying "placeholder stub"
    When proof-no-placeholder-stub checks it, given as the block's lean file
    Then it fails with one hit on line 3

  @test:scripts/tests/qa-checkers-vacuity.test.ts::proof-no-placeholder-stub::realDeclarationsPass
  Scenario: passes on actual Lean mathematical declarations
    Given a file with "import Mathlib" and a theorem proved by rfl
    When proof-no-placeholder-stub checks it
    Then it passes with no hits

  @test:scripts/tests/qa-checkers-vacuity.test.ts::proof-no-placeholder-stub::stubMentionWithDeclsPasses
  Scenario: passes when placeholder stub is mentioned in comments but substantive declarations exist
    Given a file whose comment mentions the earlier placeholder stub, and a real theorem
    When proof-no-placeholder-stub checks it
    Then it passes with no hits

  @test:scripts/tests/qa-checkers-vacuity.test.ts::proof-no-placeholder-stub::stubNaWithoutContent
  Scenario: returns n/a when no file or empty file
    Then proof-no-placeholder-stub gives "n/a" for no path, for a file that does not exist, and for a file of only whitespace
