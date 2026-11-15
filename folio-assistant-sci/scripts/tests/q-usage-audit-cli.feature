Feature: the q-usage-audit command line

  @test:scripts/tests/q-usage-audit-cli.test.ts::q-usage-audit_CLI:_a_sweep_that_finds_nothing_must_not_report_success::emptySweepExitsNonZeroNamesRoot
  Scenario: exits non-zero and names the searched root when no blocks match
    Given a temporary root holding folio/alpha-paper and folio/beta-paper
    When q-usage-audit runs there with --paper definitely-not-a-paper --no-write
    Then it exits non-zero
    And its stderr says "found NO blocks to audit" and names the "content repo root"

  @test:scripts/tests/q-usage-audit-cli.test.ts::q-usage-audit_still_IMPORTS::moduleLoads
  Scenario: the module loads at all
    When pipeline/q-usage-audit is imported
    Then the module is defined

  @test:scripts/tests/q-usage-audit-cli.test.ts::q-usage-audit_carries_no_private_resolver/walker::usesSharedQaUtilsResolver
  Scenario: it reads lean.ref resolution from the shared qa-utils
    When the source of q-usage-audit.ts is read
    Then it names pipeline/qa-utils
    And it defines neither resolveLakeTreePath nor lakeTreeContains
