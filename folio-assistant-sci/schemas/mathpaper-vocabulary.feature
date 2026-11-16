Feature: the mathpaper vocabulary module keeps the harness's vocabulary contract

  @test:schemas/mathpaper-vocabulary.test.ts::the_mathpaper_vocabulary_module::isModuleAdapterNames
  Scenario: is the module the adapter node names
    Given the content-adapter node content-adapters/mathpaper.json
    Then its vocabulary is "schemas/mathpaper-vocabulary.ts"

  @test:schemas/mathpaper-vocabulary.test.ts::the_mathpaper_vocabulary_module::typesDeclaredKindsKeepsContract
  Scenario: types exactly the kinds this layer declares, and keeps the contract
    Given the kinds of the block-kind nodes whose adapter is mathpaper
    When readVocabulary reads the mathpaper module
    Then its schemas are exactly those kinds
    And its constraint rules are lean-file-exists, lean-stub-conjecture-kind-check, mathpaper-md-exists and provable-lean-warning

  @test:schemas/mathpaper-vocabulary.test.ts::the_mathpaper_vocabulary_module::buildersBuildAcceptedRefuseWrongLabel
  Scenario: each builder builds a block its schema accepts, and a label of the wrong kind is refused
    Then theorem({label "thm:x"}) has kind "theorem"
    And proof({of "thm:x"}) is of "thm:x"
    And definition({label "def:widget"}) has the lean ref "qou:QOU.Widget"
    And lemma({label "thm:x"}) throws
    And every builder's name is a declared kind

  @test:schemas/mathpaper-vocabulary.test.ts::the_mathpaper_vocabulary_module::conjectureClassificationRejectsConflicts
  Scenario: conjecture() supports formal | identification classification and rejects conflicts
    Then a bare conjecture has kind "conjecture" and no conjectureKind
    And a conjecture with conjectureKind "formal" keeps it
    And a conjecture with formality "identification" gets conjectureKind "identification" and keeps the formality
    And conjectureKind "formal" with formality "identification" throws "conflicting conjectureKind"
    And conjectureKind "speculative" throws

  @test:schemas/mathpaper-vocabulary.test.ts::the_mathpaper_vocabulary_module::contributesLeanConstraintContext
  Scenario: contributes the Lean constraint context its rules read (bean saqd)
    Given a temporary repo with ch/def-a.lean and lake/Pkg/Deep/Widget.lean
    When constraintContext is built for the repo and asked for block def-a in ch
    Then its leanContent is the content of def-a.lean
    And for block def-b, which has no .lean, leanContent is undefined
    And lakeTreeContainsBasename finds Widget.lean under lake
    And it finds neither Gadget.lean under lake nor Widget.lean under a root that does not exist
