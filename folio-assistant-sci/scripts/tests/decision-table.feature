Feature: DMN-backed gateways in this instance's Lean build gate and paper process

  @test:scripts/tests/decision-table.test.ts::the_shipped_tables::leanGateSeparatesDeferredSorries
  Scenario: the Lean gate distinguishes deferred sorries from conjectural ones
    Given the decision table Decision_LeanBuildGate of lean-build-gate.dmn
    Then its hit policy is FIRST and its inputs are buildOk and deferredSorries
    And a failed build with 0 deferred sorries is "not yet"
    And a good build with 4 deferred sorries is "not yet"
    And a good build with 0 deferred sorries is "green" by Rule_Green

  @test:scripts/tests/decision-table.test.ts::the_shipped_tables::possibleOutcomesFromRules
  Scenario: possibleOutcomes reads the rules, not a particular evaluation
    Given the decision table Decision_LeanBuildGate
    Then its possible outcomes are "green" and "not yet"

  @test:scripts/tests/decision-table.test.ts::computed_gateways_in_a_running_process::workflowNextReportsTableFacts
  Scenario: workflow_next reports which facts the table reads
    Given an instance of authoring-a-paper.bpmn completed up to the Lean gate
    Then Gateway_LeanGreen is enabled as a decision
    And it is computed by Decision_LeanBuildGate from the facts buildOk and deferredSorries

  @test:scripts/tests/decision-table.test.ts::computed_gateways_in_a_running_process::outcomeComputedRuleRecorded
  Scenario: the outcome is computed from facts, and the rule is recorded
    Given an instance completed up to the Lean gate
    When Gateway_LeanGreen is completed with buildOk true and 0 deferred sorries
    Then only Task_Validate is enabled
    And the history records the outcome "green" with the note "Decision_LeanBuildGate → green by Rule_Green"

  @test:scripts/tests/decision-table.test.ts::computed_gateways_in_a_running_process::redBuildRoutesToFormalize
  Scenario: a red build routes back to formalisation
    Given an instance completed up to the Lean gate
    When Gateway_LeanGreen is completed with buildOk false and 0 deferred sorries
    Then only Task_Formalize is enabled

  @test:scripts/tests/decision-table.test.ts::computed_gateways_in_a_running_process::handSuppliedOutcomeRefused
  Scenario: a hand-supplied outcome is REFUSED on a computed gateway
    Given an instance completed up to the Lean gate
    When Gateway_LeanGreen is completed with the outcome "green" supplied by hand
    Then it throws a WorkflowError saying it is "computed by Decision_LeanBuildGate, not chosen"

  @test:scripts/tests/decision-table.test.ts::computed_gateways_in_a_running_process::omittedFactsRefusedAndNamed
  Scenario: omitting the facts refuses and names them
    Given an instance completed up to the Lean gate
    When Gateway_LeanGreen is completed with no facts
    Then it throws an error naming buildOk and deferredSorries
