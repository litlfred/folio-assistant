Feature: the paper QA stub checkers return a distinguishable sentinel

  @test:scripts/tests/qa-checkers-stub-sentinels.test.ts::Paper_QA_stub_checkers_return_distinguishable_sentinel_notes_(folio-assistant-89wq)::noAxiomGrowthReturnsSentinel
  Scenario: checkProofNoAxiomGrowth returns distinguishable stub sentinel
    When checkProofNoAxiomGrowth is called with no path, and with a .lean path
    Then each time it returns result "n/a", no hits and the note "not implemented: stub checker"

  @test:scripts/tests/qa-checkers-stub-sentinels.test.ts::Paper_QA_stub_checkers_return_distinguishable_sentinel_notes_(folio-assistant-89wq)::buildGreenReturnsSentinel
  Scenario: checkProofBuildGreen returns distinguishable stub sentinel
    When checkProofBuildGreen is called with no path, and with a .lean path
    Then each time it returns result "n/a", no hits and the note "not implemented: stub checker"

  @test:scripts/tests/qa-checkers-stub-sentinels.test.ts::Paper_QA_stub_checkers_return_distinguishable_sentinel_notes_(folio-assistant-89wq)::exposesAll23PaperCriteria
  Scenario: USES_AUTOMATED_CHECKERS and EXTENDED_AUTOMATED_CHECKERS expose all 23 paper criteria
    Then USES_AUTOMATED_CHECKERS has exactly lean-ref-owns-decl and uses-formal-coverage
    And EXTENDED_AUTOMATED_CHECKERS has 21 checkers
