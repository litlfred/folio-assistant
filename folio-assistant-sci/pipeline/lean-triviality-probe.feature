Feature: the Lean triviality probe — controls showing the tactic ladder closes what it should, and its skip reasons

  The scenarios that need Lean are skipped when no Lean toolchain is found.

  @test:pipeline/lean-triviality-probe.test.ts::the_ladder_actually_closes_goals_(the_control_for_`closed:_0`)::closesCheapGoal
  Scenario: closes a goal that cheap automation should close
    Given a Lean toolchain and core-Lean control theorems
    When trivTrue is probed
    Then it is closed by trivial in 1 step

  @test:pipeline/lean-triviality-probe.test.ts::the_ladder_actually_closes_goals_(the_control_for_`closed:_0`)::walksPastFailingRungs
  Scenario: walks past rungs that fail and reports the one that worked
    When simpAppend (xs ++ [] = xs) is probed
    Then it is closed by simp, at simp's position in the ladder
    And the first three rungs run are trivial, rfl and simp

  @test:pipeline/lean-triviality-probe.test.ts::the_ladder_actually_closes_goals_(the_control_for_`closed:_0`)::reachesOmegaRung
  Scenario: reaches deep rungs — omega at position 5
    When omegaLinear is probed
    Then it is closed by omega, at omega's position in the ladder

  @test:pipeline/lean-triviality-probe.test.ts::the_ladder_actually_closes_goals_(the_control_for_`closed:_0`)::leavesSubstantiveOpen
  Scenario: leaves a substantive goal open — it does not close everything
    When substantive (2 ^ n ≥ n + 1) is probed
    Then it stays open

  @test:pipeline/lean-triviality-probe.test.ts::an_unavailable_rung_is_not_a_rung_that_lost::aesopUnavailableNotFailure
  Scenario: records `aesop` as unavailable rather than as a failure
    When substantive is probed
    Then it stays open
    And aesop is recorded as unavailable and not among the rungs run
    And the rungs run are trivial, rfl, simp, decide and omega, with none timed out
    And the incomplete rungs are aesop only

  @test:pipeline/lean-triviality-probe.test.ts::an_unavailable_rung_is_not_a_rung_that_lost::incompleteRungsUnion
  Scenario: incompleteRungs unions both kinds of non-answer
    Then incompleteRungs of aesop unavailable and simp timed out is aesop and simp
    And with nothing unavailable or timed out it is empty

  @test:pipeline/lean-triviality-probe.test.ts::skip_reasons_are_distinguished,_because_their_fixes_differ::skipDeclNotFound
  Scenario: a declaration the lexer never saw
    When noSuchDeclaration is probed
    Then it is skipped as "decl-not-found"

  @test:pipeline/lean-triviality-probe.test.ts::skip_reasons_are_distinguished,_because_their_fixes_differ::skipNoBody
  Scenario: a declaration with no body to substitute
    When "theorem stated : True" with no body is probed
    Then it is skipped as "no-body"

  @test:pipeline/lean-triviality-probe.test.ts::skip_reasons_are_distinguished,_because_their_fixes_differ::skipBaselineFails
  Scenario: a file that does not elaborate unmodified
    When a theorem referring to an unknown name is probed
    Then it is skipped as "baseline-fails"

  @test:pipeline/lean-triviality-probe.test.ts::skip_reasons_are_distinguished,_because_their_fixes_differ::skipBaselineTimeout
  Scenario: a file too slow to probe is not a file that is broken
    When trivTrue is probed with a 1 ms budget
    Then it is skipped as "baseline-timeout"

  @test:pipeline/lean-triviality-probe.test.ts::skip_reasons_are_distinguished,_because_their_fixes_differ::everySkipReasonExplained
  Scenario: every skip reason carries an explanation of what would fix it
    Then decl-not-found, no-body, baseline-fails and baseline-timeout each have an explanation

  @test:pipeline/lean-triviality-probe.test.ts::splicing_the_body::assignInStatementNoMangle
  Scenario: a `:=` inside the statement no longer mangles the probe
    When withLet, whose statement is (let x := 5; x) = 5, is probed
    Then it is closed in 1 step

  @test:pipeline/lean-triviality-probe.test.ts::splicing_the_body::commentStrippingKeepsOffsets
  Scenario: comment stripping preserves offsets, so the splice lands correctly
    When a theorem with ":=" in its doc comment and in a line comment is probed
    Then it is closed

  @test:pipeline/lean-triviality-probe.test.ts::leanPathFor::emptyPathWithoutPackages
  Scenario: returns empty for a root with no restored packages
    Then leanPathFor of a root that does not exist is empty

  @test:pipeline/lean-triviality-probe.test.ts::leanPathFor::unioning_the_workspace_root::workspacePackagesBeforeStubs
  Scenario: emits workspace package dirs BEFORE the paper root's stubs
    Given a workspace with mathlib and batteries packages, and a paper root with its own modules and stub copies of those packages
    When leanPathFor is asked for the paper root with the workspace root
    Then both mathlib directories are on the path
    And the workspace's mathlib comes before the paper's stub

  @test:pipeline/lean-triviality-probe.test.ts::leanPathFor::unioning_the_workspace_root::includesPaperModuleDir
  Scenario: still includes the paper root's own module dir
    When leanPathFor is asked for the paper root with the workspace root
    Then the path includes the paper root's .lake/build/lib/lean

  @test:pipeline/lean-triviality-probe.test.ts::leanPathFor::unioning_the_workspace_root::singleRootWithoutWorkspace
  Scenario: omitting the workspace root preserves single-root behaviour
    When leanPathFor is asked for the paper root alone
    Then every entry is under the paper root

  @test:pipeline/lean-triviality-probe.test.ts::leanPathFor::unioning_the_workspace_root::noDuplicateWhenSameRoot
  Scenario: does not duplicate when both roots resolve to the same path
    When leanPathFor is asked with the paper root as both roots
    Then no entry is repeated
