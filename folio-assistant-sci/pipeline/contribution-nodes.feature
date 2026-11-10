Feature: sci's QA checkers and pipeline-plugin slots arrive as KG nodes through the dependency tree

  @test:pipeline/contribution-nodes.test.ts::sci's_contributions_arrive_as_nodes,_through_the_dependency_tree::everySlotFilledWithOwnImpl
  Scenario: every slot in the table is filled, with the table's own implementation
    Given the contribution registry of a folio that depends on sci
    Then every slot in PIPELINE_IMPLEMENTATIONS is filled with that table's implementation

  @test:pipeline/contribution-nodes.test.ts::sci's_contributions_arrive_as_nodes,_through_the_dependency_tree::everyCheckerRegisteredWithSource
  Scenario: every checker in the table is registered, hashed over the file that defines it
    Given the contribution registry of a folio that depends on sci
    Then every criterion in COST_AUTOMATED_CHECKERS is registered with that table's check
    And its source file is pipeline/qa-checkers-cost.ts

  @test:pipeline/contribution-nodes.test.ts::sci's_contributions_arrive_as_nodes,_through_the_dependency_tree::folioWithoutSciGetsNone
  Scenario: a folio whose tree does not include sci gets none of them
    Given the contribution registry loaded from folio-assistant-core's root
    Then none of the pipeline slots is filled
    And none of the cost checkers is registered

  @test:pipeline/contribution-nodes.test.ts::a_contribution's_code_ref_is_its_own::codeRefRefusesPrefixEscapeNoExport
  Scenario: an instance prefix, an escaping path and a missing export are refused
    Then the code ref "pipeline/x.ts#TABLE" is accepted
    And "cat-harness:pipeline/x.ts#TABLE", "../cat-harness/x.ts#TABLE" and "pipeline/x.ts" are refused
    And a QA checker node with an extra field is refused
