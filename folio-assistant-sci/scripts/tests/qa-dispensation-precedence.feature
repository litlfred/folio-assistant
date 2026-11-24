Feature: an author's human dispensation outranks script entries while the sources it was granted against are unchanged

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::survivesLaterScriptEntry
  Scenario: survives a LATER script entry — the whole point
    Given a sidecar with a human pass and a later script fail for the criterion, both on the current hashes
    Then hasHumanDispensation is true

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::survivesManyLaterScriptEntries
  Scenario: survives many later script entries
    Given a sidecar with a human pass followed by six later script fails
    Then hasHumanDispensation is true

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::scriptAloneNotDispensation
  Scenario: a script entry alone is not a dispensation
    Given a sidecar with only a script pass
    Then hasHumanDispensation is false

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::humanFailNotDispensation
  Scenario: a human FAIL is not a dispensation
    Given a sidecar with only a human fail
    Then hasHumanDispensation is false

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::latestHumanDecides
  Scenario: the most recent HUMAN entry decides between humans
    Given a sidecar with a human pass followed by a later human fail
    Then hasHumanDispensation is false

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::lapsesWhenSourcesChange
  Scenario: lapses when the sources it was granted against change
    Given a sidecar with a human pass
    When it is asked with a different lean hash
    Then hasHumanDispensation is false

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::noLeakAcrossCriteria
  Scenario: does not leak across criteria
    Given a sidecar with a human pass for one criterion
    When it is asked for the criterion q-usage-fixed-q0-leak
    Then hasHumanDispensation is false

  @test:scripts/tests/qa-dispensation-precedence.test.ts::human_dispensation_precedence::noSidecarNoDispensation
  Scenario: a block with no sidecar has no dispensation
    Given a block .ts with no sidecar
    Then hasHumanDispensation is false
