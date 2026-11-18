Feature: proof-not-machine-trivial — a warning when a tactic oracle closes a proof in few steps

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::naWithoutCache
  Scenario: n/a when there is no cache — absence of data, not absence of triviality
    Given a repo with a block whose lean.ref is "p:P.foo" and no triviality cache
    When checkProofNotMachineTrivial checks the block
    Then the result is "n/a" with a note saying "not measured"

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::naWithoutRunForDecl
  Scenario: n/a when the cache has no run for this declaration
    Given a triviality cache with an entry only for P.other
    When checkProofNotMachineTrivial checks the block
    Then the result is "n/a"

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::warnsWhenClosedInFewSteps
  Scenario: warns when the oracle closed the goal in few steps
    Given a cache entry for P.foo closed in 2 steps
    When checkProofNotMachineTrivial checks the block
    Then the result is "warn" with 2 atomic steps to close and oracle_closed 1
    And its hit says "not a verdict"

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::passesWhenNotClosed
  Scenario: passes when the oracle could not close the goal
    Given a cache entry for P.foo not closed
    When checkProofNotMachineTrivial checks the block
    Then it passes with oracle_closed 0

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::passesAboveThreshold
  Scenario: passes when the goal took more than the threshold
    Given a cache entry for P.foo closed in one step more than the threshold
    When checkProofNotMachineTrivial checks the block
    Then it passes

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::naWhenMeasurementStale
  Scenario: n/a when the measurement is stale relative to the .lean
    Given a cache entry for P.foo closed in 1 step, recorded against a different hash of b.lean
    When checkProofNotMachineTrivial checks the block
    Then the result is "n/a" with a note saying "stale"

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::shortLadderNotClosedIsNa
  Scenario: a `not closed` from a SHORT ladder is n/a, not pass
    Given a cache entry for P.foo not closed, with aesop unavailable
    When checkProofNotMachineTrivial checks the block
    Then the result is "n/a" with a note naming "aesop" and "short ladder"

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::fullLadderNotClosedPasses
  Scenario: a `not closed` from the FULL ladder is still a pass
    Given a cache entry for P.foo not closed, with every rung available
    When checkProofNotMachineTrivial checks the block
    Then it passes

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::shortLadderKeepsClosedWarn
  Scenario: an incomplete ladder does not suppress a goal that WAS closed
    Given a cache entry for P.foo closed in 3 steps, with aesop unavailable
    When checkProofNotMachineTrivial checks the block
    Then the result is "warn"

  @test:scripts/tests/qa-checkers-triviality.test.ts::proof-not-machine-trivial::neverFails
  Scenario: never returns fail — it is warn-only by construction
    Given cache entries closed in 0 steps, closed in 1 step, and not closed
    When checkProofNotMachineTrivial checks the block against each
    Then no result is "fail"
