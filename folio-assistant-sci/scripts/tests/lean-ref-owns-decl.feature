Feature: lean-ref-owns-decl — one Lean declaration is claimed by one block, and the graph's tie-break

  @test:scripts/tests/lean-ref-owns-decl.test.ts::lean-ref-owns-decl::propProofPairSharingDeclPasses
  Scenario: a prop + proof pair sharing one decl is LEGITIMATE
    Given a proposition prop:x and a proof prf:x whose lean.ref is the same "p:P.x"
    When checkLeanRefOwnsDecl checks prop:x
    Then it passes
    And it counts 2 claimants of the declaration

  @test:scripts/tests/lean-ref-owns-decl.test.ts::lean-ref-owns-decl::twoDefinitionsSharingDeclFailBoth
  Scenario: two definitions claiming one decl FAILS, from both sides
    Given definitions def:a and def:b whose lean.ref is the same "p:P.Thing"
    When checkLeanRefOwnsDecl checks each of them
    Then both fail
    And def:a's hit names def:b, and def:b's hit names def:a

  @test:scripts/tests/lean-ref-owns-decl.test.ts::lean-ref-owns-decl::distinctDeclsPass
  Scenario: distinct decls pass
    Given definitions def:a and def:b with the lean.refs "p:P.A" and "p:P.B"
    When checkLeanRefOwnsDecl checks def:a
    Then it passes

  @test:scripts/tests/lean-ref-owns-decl.test.ts::lean-ref-owns-decl::naWithoutLeanRef
  Scenario: n/a for a block with no lean.ref
    Given a remark rem:a with no lean.ref
    When checkLeanRefOwnsDecl checks it
    Then the result is "n/a"

  @test:scripts/tests/lean-ref-owns-decl.test.ts::graph_decl_ownership_tie-break::declResolvesToStatementNotProof
  Scenario: a decl resolves to the STATEMENT block, not its proof
    Given a proof prf:x, which sorts first, and a proposition prop:x, both with lean.ref "p:P.x"
    When the content graph is built
    Then the owners of P.x are prf:x and prop:x
    And the owner whose kind is proposition is prop:x
