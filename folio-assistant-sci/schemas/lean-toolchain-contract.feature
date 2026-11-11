Feature: the lean-toolchain role held to its contract

  @test:schemas/lean-toolchain-contract.test.ts::the_role_is_mechanical,_and_its_contract_is_a_skill_it_carries::playedBySystemActorWithContract
  Scenario: played only by a system Actor, carrying lean-toolchain-contract
    Given the lean-toolchain role in scenarios/roles.json
    Then it is played only by system Actors
    And it carries the skill lean-toolchain-contract

  @test:schemas/lean-toolchain-contract.test.ts::the_role_is_mechanical,_and_its_contract_is_a_skill_it_carries::actorPlaysRoleWithCapability
  Scenario: the Actor named in the contract plays it, with the lean-toolchain capability
    Given the actor scenarios/actors/lean-mcp.json
    Then it is a system Actor that plays lean-toolchain and has the lean-toolchain capability

  @test:schemas/lean-toolchain-contract.test.ts::2._build_with_`lake_build`_and_exit_0_with_no_compilation_errors::capabilitySatisfiesLeanCompiles
  Scenario: the capability satisfies req:lean-verification#lean-compiles
    Then the lean-toolchain capability satisfies req:lean-verification#lean-compiles

  @test:schemas/lean-toolchain-contract.test.ts::2._build_with_`lake_build`_and_exit_0_with_no_compilation_errors::leanCompilesStatementDemandsCleanBuild
  Scenario: that statement demands exactly that: lake build, exit code 0, no compilation errors, verified by test
    Given the lean-compiles statement of skills/requirements/lean-verification.json
    Then its requirement names "`lake build` without errors"
    And it has one success criterion naming "exit code 0" and "no compilation errors", verified by test

  @test:schemas/lean-toolchain-contract.test.ts::3._be_detectable_—_`lean_--version`,_with_lean-mcp_the_declared_fallback::detectionIsLeanVersion
  Scenario: detection is the command `lean --version`
    Then the lean-toolchain capability is detected by the command "lean --version"

  @test:schemas/lean-toolchain-contract.test.ts::3._be_detectable_—_`lean_--version`,_with_lean-mcp_the_declared_fallback::fallbackIsLeanMcp
  Scenario: the fallback is lean-mcp, which runs Lean server-side and so does not itself need a local toolchain
    Then the lean-toolchain capability falls back to lean-mcp
    And the lean-mcp capability is detected by an MCP probe and does not require lean-toolchain

  @test:schemas/lean-toolchain-contract.test.ts::4._report_what_it_ran,_not_only_that_it_passed::toolWritesCommittableStatus
  Scenario: the lean-build Tool writes the committable lean-build-status.json as its output
    Given the lean-build Tool
    Then its id is "lean-build"
    And its "status" output's description names lean-build-status.json and says it is committable

  @test:schemas/lean-toolchain-contract.test.ts::4._report_what_it_ran,_not_only_that_it_passed::toolDeclaresRuntimeNeeds
  Scenario: and it says what it needs to run, rather than leaving a caller to find out
    Then the lean-build Tool's runtime requirements include lean and lake

  @test:schemas/lean-toolchain-contract.test.ts::What_it_is_not_asked:_to_decide_—_sorry_tracking_is_verified_by_inspection,_not_by_this_role::sorryTrackingByInspectionOnly
  Scenario: req:lean-verification#sorry-tracking is verified by inspection only
    Given the sorry-tracking statement
    Then its only verification method is inspection
