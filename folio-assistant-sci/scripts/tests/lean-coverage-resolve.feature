Feature: resolveLeanFile follows lean.ref into the Lean library for any package, and the status overlay uses it

  @test:scripts/tests/lean-coverage-resolve.test.ts::resolveLeanFile_follows_lean.ref_for_any_package::nonQouPrefixResolvesToLibrary
  Scenario: a non-qou package prefix resolves into the library tree
    Given a Lean library with Demo/Algebra/Groups.lean proving lagrange by rfl
    And a block thm-lagrange.ts with no sibling .lean, whose lean.ref is "demo:Demo.Algebra.Groups.lagrange"
    When resolveLeanFile resolves the block
    Then it resolves to Groups.lean
    And that file's validation status is "leanok"

  @test:scripts/tests/lean-coverage-resolve.test.ts::resolveLeanFile_follows_lean.ref_for_any_package::qouPrefixStillResolves
  Scenario: the qou prefix still resolves (no regression for the folio it was written for)
    Given the same block with lean.ref "qou:Demo.Algebra.Groups.lagrange"
    When resolveLeanFile resolves the block
    Then it resolves to Groups.lean

  @test:scripts/tests/lean-coverage-resolve.test.ts::the_block-status-overlay_slot_overlays_live_Lean_status_(bean_saqd)::overlayTakesStatusFromResolvedLean
  Scenario: a block with a lean field takes sorryFree and validation from its resolved .lean
    Given a theorem block whose lean.ref is "demo:Demo.Algebra.Groups.lagrange" and whose validation is "not_checked"
    When overlayBlockStatus overlays it, with the temporary directory as the paper
    Then its lean field has sorryFree true and validation "leanok"

  @test:scripts/tests/lean-coverage-resolve.test.ts::the_block-status-overlay_slot_overlays_live_Lean_status_(bean_saqd)::overlayKeepsStrongerVerdictSkipsBare
  Scenario: a stronger recorded verdict is kept, and a block with no lean field is left alone
    Given a theorem block with the same lean.ref whose validation is "stub"
    When overlayBlockStatus overlays it
    Then its validation stays "stub"
    And a remark block with no lean field is left unchanged
