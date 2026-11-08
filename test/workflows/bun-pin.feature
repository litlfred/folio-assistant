Feature: Every workflow in this repository installs the pinned Bun
  The bun-pin gate (cat-harness-tools/scripts/check-bun-pin.ts) is run over
  this index repository's own `.bun-version` and `.github/workflows/`.

  @test:test/workflows/bun-pin.test.ts::the_real_repository::`.bun-version`_was_READ_—_every_assertion_below_is_computed_from_it
  Scenario: The .bun-version file was read, so every assertion is computed from it
    Given the bun-pin report for the index repository's root
    When its expected version is read
    Then the expected version is a three-part version number "<major>.<minor>.<patch>"

  @test:test/workflows/bun-pin.test.ts::the_real_repository::setup-bun_sites_were_FOUND_—_a_scan_matching_nothing_must_not_read_clean
  Scenario: setup-bun sites were found, so a scan matching nothing does not read clean
    Given the bun-pin report for the index repository's root
    Then the report counts more than zero setup-bun sites
    And the report counts more than zero workflows

  @test:test/workflows/bun-pin.test.ts::the_real_repository::every_site_installs_the_pinned_version
  Scenario: Every site installs the pinned version
    Given the bun-pin report for the index repository's root
    Then the report has no findings
