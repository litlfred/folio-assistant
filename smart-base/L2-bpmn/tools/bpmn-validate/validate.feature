Feature: bpmn-validate checks a DAK's BPMN structure, vendor namespaces and lane actors
  One check replaces four Python validators: the XML and its root, no
  Camunda or Zeebe namespace, unique ids, lanes that hold every flow node,
  and every innermost lane naming an ActorDefinition (or a harness role) by
  its id, never by a guessed file name or a title.

  @test:smart-base/L2-bpmn/tools/bpmn-validate/validate.test.ts::bpmn-validate::readsActorDefinitionInstanceIdsFromFsh
  Scenario: the ActorDefinition ids are the FSH Instance ids
    Given an FSH file with two ActorDefinition instances, one with its keyword lines in another order, and a Questionnaire instance
    Then the ActorDefinition ids are "DAK.Persona.HealthWorker" and "DAK.Persona.Client"
    And the fixture roles file declares the role "reviewer"

  @test:smart-base/L2-bpmn/tools/bpmn-validate/validate.test.ts::bpmn-validate::goodFixtureHasNoErrorOrWarning
  Scenario: a well-formed BPMN whose lanes bind actors and a role passes
    Given a BPMN with a lane bound by partitionElementRef to an ActorDefinition, one bound to a role, and one whose id is an ActorDefinition id
    Then there is no error and no warning
    And two lanes are matched to ActorDefinitions and one to a role

  @test:smart-base/L2-bpmn/tools/bpmn-validate/validate.test.ts::bpmn-validate::badFixtureReportsEachDefect
  Scenario: each defect of a bad BPMN is reported with its code
    Given a BPMN with a Zeebe namespace, a duplicate id, an orphan task, a process with no laneSet, a lane named like a persona but bound to nothing, and a lane bound to an undeclared actor
    Then the errors are ACTOR-003, ACTOR-004, BPMN-003, BPMN-005 and SWIM-002
    And the warnings are SWIM-003 and SWIM-005
    And the unbound lane is reported by its id, not matched by its name

  @test:smart-base/L2-bpmn/tools/bpmn-validate/validate.test.ts::bpmn-validate::malformedOrForeignRootIsAnError
  Scenario: XML that does not parse, or whose root is not bpmn:definitions, is an error
    Given an unclosed BPMN document and a document whose root is another element
    Then the first is BPMN-001 and the second BPMN-002

  @test:smart-base/L2-bpmn/tools/bpmn-validate/validate.test.ts::bpmn-validate::readsOnlyTheDeclaredProcessDirectories
  Scenario: BPMN is read from the declared process directories, not input/business-processes
    Given the paths of a smart-base process, an IG's input/bpmn file and an input/business-processes file
    Then the first two are in a process directory and the third is not
