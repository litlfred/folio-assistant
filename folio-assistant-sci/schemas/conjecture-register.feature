Feature: the conjecture register — its typology, schema, status lifecycle and assumedBy

  @test:schemas/conjecture-register.test.ts::conjecture-register_typology_and_validator::declaresTypologyAndValidator
  Scenario: declares the conjectures typology (holds: state) and its validator node
    Given the typology node conjectures.json
    Then its kind is "conjectures", it holds "state", records no work and is not renderable
    And its only node schema is the conjecture-register schema
    And the validator node conjecture-register.json validates kind "conjectures" in that family
    And its schema is "folio-assistant-sci:schemas/conjecture-register.ts#ConjectureRegisterKind"
    And ConjectureRegisterKind's id is "folio-conjecture-register"

  @test:schemas/conjecture-register.test.ts::conjecture-register_typology_and_validator::validatesNodesRejectsMalformed
  Scenario: validates formal and identification register nodes and rejects malformed entries
    Given a formal, attempted register node with a Lean stub, two assumedBy labels and one partial attempt
    Then the node schema and the kind's schema accept it
    And it is refused with sourceBlock "thm:not-a-conjecture"
    And it is refused with an extra field

  @test:schemas/conjecture-register.test.ts::conjecture_status_lifecycle_DMN_and_transitions::dmnCoversStatusesDeterministic
  Scenario: DMN table covers every ConjectureStatus and evaluates deterministically
    Given the conjecture status lifecycle decision table
    Then its hit policy is FIRST and its inputs are superseded, disproved, proved and attemptCount
    And its possible outcomes are exactly the conjecture statuses
    And with no flags and 0 attempts it gives "open" by Rule_Open
    And with no flags and 2 attempts it gives "attempted" by Rule_Attempted
    And with proved and 2 attempts it gives "proved" by Rule_Proved
    And with disproved and 1 attempt it gives "disproved" by Rule_Disproved
    And with superseded and proved and 3 attempts it gives "superseded" by Rule_Superseded

  @test:schemas/conjecture-register.test.ts::conjecture_status_lifecycle_DMN_and_transitions::transitionsForwardRefusesBackward
  Scenario: transitionConjectureNode advances open -> attempted -> proved and refuses backward transitions
    Given an open identification register node with no attempts
    When an attempt is added
    Then the node is "attempted" with 1 attempt
    When it is moved to "proved", resolved by "thm:mass-ratio-derived"
    Then it is "proved" and resolvedBy is "thm:mass-ratio-derived"
    And proved may not go to open but may go to superseded
    And moving the proved node to "open" throws "Invalid conjecture status transition"

  @test:schemas/conjecture-register.test.ts::computeAssumedBy_over_lean-formal-graph_reverse_edges::assumedByDirectAndTransitive
  Scenario: computes direct and transitive reverse dependencies from formal-edge records
    Given formal-edge records in which LemmaStep's type uses ConjAlpha, ThmMain's value uses LemmaStep, and CorFinal's type uses ThmMain
    Then the direct reverse dependencies of "qou:QOU.ConjAlpha" are QOU.LemmaStep
    And the transitive ones are QOU.CorFinal, QOU.LemmaStep and QOU.ThmMain

  @test:schemas/conjecture-register.test.ts::computeAssumedBy_over_lean-formal-graph_reverse_edges::assumedByMapsDeclsToLabels
  Scenario: maps Lean declaration names to block labels when declToBlockLabel is provided
    Given the same records and a map from those declarations to lem:step, thm:main and cor:final
    Then the reverse dependencies of "qou:QOU.ConjAlpha" are cor:final, lem:step and thm:main
