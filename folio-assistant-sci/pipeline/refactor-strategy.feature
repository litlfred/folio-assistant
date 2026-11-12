Feature: Lean refactor strategies — version comparison, applicability, and the shipped database

  @test:pipeline/refactor-strategy.test.ts::compareLeanVersions::comparesNumericallyNotLexically
  Scenario: compares numerically, not lexically
    Then as strings "4.9.0" sorts after "4.24.0"
    And compareLeanVersions puts 4.9.0 before 4.24.0, and 4.24.0 after 4.9.0

  @test:pipeline/refactor-strategy.test.ts::compareLeanVersions::equalVersionsEqual
  Scenario: equal versions compare equal
    Then compareLeanVersions of 4.24.0 and 4.24.0 is 0

  @test:pipeline/refactor-strategy.test.ts::compareLeanVersions::missingComponentsAreZero
  Scenario: missing components are treated as zero
    Then 4.24 equals 4.24.0
    And 4.24 is before 4.24.1

  @test:pipeline/refactor-strategy.test.ts::compareLeanVersions::majorVersionDominates
  Scenario: major version dominates
    Then 5.0.0 is after 4.99.0

  @test:pipeline/refactor-strategy.test.ts::isApplicableAt::minBoundInclusive
  Scenario: min bound is inclusive
    Given a strategy with min 4.17.0
    Then it applies at 4.17.0 and not at 4.16.9

  @test:pipeline/refactor-strategy.test.ts::isApplicableAt::maxBoundExclusive
  Scenario: max bound is exclusive
    Given a strategy with min 4.0.0 and max 4.30.0
    Then it applies at 4.29.9 and not at 4.30.0

  @test:pipeline/refactor-strategy.test.ts::isApplicableAt::unboundedNotApplicableStrict
  Scenario: an unbounded strategy is NOT applicable under strict gating
    Given a strategy with no Lean range
    Then it does not apply at 4.24.0 under strict gating
    And it applies at 4.24.0 when gating is not strict

  @test:pipeline/refactor-strategy.test.ts::isApplicableAt::deprecatedNeverApplicable
  Scenario: deprecated is never applicable, even in range
    Given a deprecated strategy with min 4.0.0
    Then it does not apply at 4.24.0, strict or not

  @test:pipeline/refactor-strategy.test.ts::shipped_strategy_database::loadsMechanicalFamily
  Scenario: loads the mechanical family
    When the shipped strategies are loaded
    Then there is at least one

  @test:pipeline/refactor-strategy.test.ts::shipped_strategy_database::everyStrategyHasLeanRange
  Scenario: every strategy declares a Lean range
    Then no shipped strategy lacks both a min and a max

  @test:pipeline/refactor-strategy.test.ts::shipped_strategy_database::idsUnique
  Scenario: ids are unique
    Then no two shipped strategies share an id

  @test:pipeline/refactor-strategy.test.ts::shipped_strategy_database::everyStrategyHasExample
  Scenario: every strategy carries a worked example
    Then every shipped strategy has an example with a before and an after

  @test:pipeline/refactor-strategy.test.ts::shipped_strategy_database::proposedCarryCaveat
  Scenario: non-obvious rewrites carry a caveat
    Then every proposed strategy has a caveat

  @test:pipeline/refactor-strategy.test.ts::shipped_strategy_database::supersededByResolves
  Scenario: superseded_by, where present, resolves to a known strategy
    Then every superseded_by names a shipped strategy
