Feature: checking the blocks of a digital transformation handbook

  @test:scripts/dth-block-check.test.ts::lanesOf::lanesOfReadsRefs
  Scenario: reads lane ids and partitionElementRef, with or without a prefix
    When lanes with and without a prefix are read
    Then each gives its id and partitionElementRef, or none

  @test:scripts/dth-block-check.test.ts::check::alignedDthPasses
  Scenario: passes a DTH whose personas, lanes and tables line up
    When a DTH whose personas, lanes and tables line up is checked
    Then there are no errors and the counts are one each, with rules

  @test:scripts/dth-block-check.test.ts::check::personaMissingLinksFlagged
  Scenario: flags a persona with missing links, and a lane bound to someone else
    When a persona lacks its links and a lane names someone else
    Then the errors name each missing link, the wrong partitionElementRef and the undeclared persona

  @test:scripts/dth-block-check.test.ts::check::laneWithoutRefFlagged
  Scenario: flags a process lane with no partitionElementRef
    When a lane has no partitionElementRef
    Then the only error names that lane

  @test:scripts/dth-block-check.test.ts::check::tableWithoutPassageFlagged
  Scenario: flags a decision table that cites no passage, or a missing one
    When a decision table cites no passage, and one cites a missing passage
    Then each is flagged
