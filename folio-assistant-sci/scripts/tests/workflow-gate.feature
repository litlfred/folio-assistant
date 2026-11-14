Feature: the workflow gate on this instance's advisory content-type process

  @test:scripts/tests/workflow-gate.test.ts::the_base_is_strict_and_the_content-type_processes_are_not::advisoryProcessAllowsDisabledStep
  Scenario: an advisory process allows a step that is not enabled, and says why
    Given the process model of authoring-a-paper.bpmn and a fresh instance of it for a paper
    When the gate is checked for the step Call_ReviewPublish with nothing completed
    Then the step is allowed
    And the reason says "advisory"
