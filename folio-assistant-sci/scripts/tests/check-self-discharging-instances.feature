Feature: check-self-discharging-instances — an instance that supplies a class's claim for free

  @test:scripts/tests/check-self-discharging-instances.test.ts::splitInstanceHead_—_binder_colons::splitsAtColonOutsideBinders
  Scenario: splits at the colon OUTSIDE the binders
    When splitInstanceHead splits "canonical (R : Type u) : GBFiltrationCollapsesAtE2 R"
    Then the name is canonical and the class is GBFiltrationCollapsesAtE2

  @test:scripts/tests/check-self-discharging-instances.test.ts::splitInstanceHead_—_binder_colons::handlesImplicitBinders
  Scenario: handles instance-implicit and implicit binders
    When splitInstanceHead splits "foo {α : Type*} [CommRing α] (n : ℕ) : MyClass α n"
    Then the name is foo, the class is MyClass, and the binders include "[CommRing α]"

  @test:scripts/tests/check-self-discharging-instances.test.ts::splitInstanceHead_—_binder_colons::anonymousInstanceName
  Scenario: anonymous instance has no leading name
    When splitInstanceHead splits "(R : Type u) : HasThing R"
    Then the name is «anonymous» and the class is HasThing

  @test:scripts/tests/check-self-discharging-instances.test.ts::splitInstanceHead_—_binder_colons::noTopLevelColonNull
  Scenario: no top-level colon yields null rather than a wrong answer
    Then splitInstanceHead of "mangled (R : Type u)" is null

  @test:scripts/tests/check-self-discharging-instances.test.ts::propDeclNames_—_result_colon,_not_binder_colon::findsPropDefWithBinderColons
  Scenario: finds a Prop-valued def whose binders contain colons
    Given "def CollapsesAt {R : Type u} (S : Foo R) (r₀ : ℕ) : Prop"
    Then propDeclNames includes CollapsesAt

  @test:scripts/tests/check-self-discharging-instances.test.ts::propDeclNames_—_result_colon,_not_binder_colon::findsAbbrevIgnoresNonProp
  Scenario: finds abbrev and ignores non-Prop defs
    Given a Prop-valued abbrev CollapsesAtE2 and a Type-valued def notAClaim
    Then propDeclNames includes CollapsesAtE2 and not notAClaim

  @test:scripts/tests/check-self-discharging-instances.test.ts::looksPropositional::inlinePropositions
  Scenario: inline propositions
    Then "q0 > 1" and "∀ A, w A = 3" look propositional

  @test:scripts/tests/check-self-discharging-instances.test.ts::looksPropositional::namedPredicateNeedsPropSet
  Scenario: a NAMED predicate needs the package's Prop set
    Then "CollapsesAtE2 ss" does not look propositional on its own
    And it does with CollapsesAtE2 in the Prop set

  @test:scripts/tests/check-self-discharging-instances.test.ts::looksPropositional::dataFieldsNotClaims
  Scenario: data fields are not claims
    Then "Type u" and "M → ℝ" do not look propositional

  @test:scripts/tests/check-self-discharging-instances.test.ts::isUnconditional::typeAndInstanceBindersUnconditional
  Scenario: type and instance binders only
    Then "(R : Type u)" and "{α : Type*} [CommRing α]" are unconditional

  @test:scripts/tests/check-self-discharging-instances.test.ts::isUnconditional::proofObligationMakesConditional
  Scenario: an explicit PROOF OBLIGATION makes it conditional, and fine
    Then "(R : Type u) (hq : q ≠ 1)" is conditional
    And "(h : MyClaim R)" is unconditional without a Prop set, and conditional with MyClaim in it

  @test:scripts/tests/check-self-discharging-instances.test.ts::isUnconditional::dataParameterStaysUnconditional
  Scenario: a DATA parameter does not make it conditional
    Then "(R : Type u) (n : ℕ)" is unconditional

  @test:scripts/tests/check-self-discharging-instances.test.ts::isUnconditional::nestedParensInBinder
  Scenario: nested parens in a binder type are handled
    Then "(h : MyClaim (bar R))" is conditional with MyClaim in the Prop set

  @test:scripts/tests/check-self-discharging-instances.test.ts::isTrivialDischarge::byConstructionProofsTrivial
  Scenario: by-construction proofs
    Then "rfl", "fun _ => rfl", "fun _ _ _ => rfl" and "hf.out" are trivial discharges

  @test:scripts/tests/check-self-discharging-instances.test.ts::isTrivialDischarge::realProofTermNotTrivial
  Scenario: a real proof term is not trivial
    Then "q_zero_gt_one" and "lt_of_lt_of_le zero_lt_one h" are not trivial discharges

  @test:scripts/tests/check-self-discharging-instances.test.ts::end-to-end::catchesUnconditionalClaimInstance
  Scenario: catches the unconditional instance of a claim-carrying class
    Given a class GBFiltrationCollapsesAtE2 with a Prop field, an instance canonical with only a type binder, and an instance conditional taking a proof
    When the source is parsed and instances of claim-carrying classes with unconditional binders are kept
    Then only canonical is caught

  @test:scripts/tests/check-self-discharging-instances.test.ts::end-to-end::conditionalInstanceNotFlagged
  Scenario: does NOT flag the conditional instance beside it
    When the same source is parsed
    Then the instance conditional is found
    And its binders are conditional
