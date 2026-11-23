Feature: the retired paper QA proof stubs stay retired

  @test:scripts/tests/qa-checkers-stub-sentinels.test.ts::Paper_QA_checkers:_the_retired_proof_stubs_stay_retired_(folio-assistant-89wq)::retiredProofStubsAreNotRegistered
  Scenario: proof-build-green and proof-no-axiom-growth are not registered
    Then EXTENDED_AUTOMATED_CHECKERS has no proof-build-green entry
    And EXTENDED_AUTOMATED_CHECKERS has no proof-no-axiom-growth entry

  @test:scripts/tests/qa-checkers-stub-sentinels.test.ts::Paper_QA_checkers:_the_retired_proof_stubs_stay_retired_(folio-assistant-89wq)::exposesAll21PaperCriteria
  Scenario: USES_AUTOMATED_CHECKERS and EXTENDED_AUTOMATED_CHECKERS expose all 21 paper criteria
    Then USES_AUTOMATED_CHECKERS has exactly lean-ref-owns-decl and uses-formal-coverage
    And EXTENDED_AUTOMATED_CHECKERS has 19 checkers
