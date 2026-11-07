Feature: A staging deploy replaces its own preview, and refuses to replace it with nothing
  Reads the "Deploy the preview and log the render" step of
  .github/workflows/feature-staging.yml, up to the next step. Every scenario
  first asserts that this step still exists.

  @test:test/workflows/staging-replaces-preview.test.ts::...and_refuses_to_replace_it_with_nothing_—_bean_`oisv`::an_empty_build_fails_the_job_rather_than_deploying
  Scenario: An empty build fails the job rather than deploying
    Given the deploy step's script
    Then it tests 'if [ -z "$(ls -A _site...)" ]; then'
    And it emits "::error::the build produced an empty ./_site"

  @test:test/workflows/staging-replaces-preview.test.ts::...and_refuses_to_replace_it_with_nothing_—_bean_`oisv`::the_guard_runs_BEFORE_the_rm_—_order_is_the_whole_safety_argument
  Scenario: The empty-build guard runs before the rm
    Given the deploy step's script
    Then it contains the guard 'if [ -z "$(ls -A _site'
    And it contains 'rm -rf "pages/$PREVIEW_DIR/$STAGING_SLUG"'
    And the guard comes before the rm

  @test:test/workflows/staging-replaces-preview.test.ts::...and_refuses_to_replace_it_with_nothing_—_bean_`oisv`::the_refusal_exits_non-zero,_so_a_lost_preview_is_not_silent
  Scenario: The refusal exits non-zero, so a lost preview is not silent
    Given the deploy step's script
    Then the text between the guard and the rm contains "exit 1"

  @test:test/workflows/staging-replaces-preview.test.ts::...and_refuses_to_replace_it_with_nothing_—_bean_`oisv`::the_error_names_the_slug,_so_the_reader_knows_WHICH_preview_was_spared
  Scenario: The error names the slug, so the reader knows which preview was spared
    Given the deploy step's script
    Then it contains "$PREVIEW_DIR/$STAGING_SLUG keeps its last working preview"

  @test:test/workflows/staging-replaces-preview.test.ts::...and_refuses_to_replace_it_with_nothing_—_bean_`oisv`::it_is_a_floor,_not_a_page-count_threshold
  Scenario: The guard is a floor, not a page-count threshold
    Given the deploy step's script
    Then it does not count ./_site files with find and wc -l
    And it does not compare with "-lt <number>"

  @test:test/workflows/staging-replaces-preview.test.ts::a_deploy_replaces_its_own_preview,_and_only_its_own::it_removes_the_slug_directory_before_copying_into_it
  Scenario: It removes the slug directory before copying into it
    Given the deploy step's script
    Then it contains 'rm -rf "pages/$PREVIEW_DIR/$STAGING_SLUG"'
    And it contains 'cp -R _site/. "pages/$PREVIEW_DIR/$STAGING_SLUG/"'
    And the rm comes before the cp

  @test:test/workflows/staging-replaces-preview.test.ts::a_deploy_replaces_its_own_preview,_and_only_its_own::the_removal_names_ONE_slug_—_never_the_STAGING_root
  Scenario: The removal names one slug, never the staging root
    Given the deploy step's script
    Then every "rm -rf" in it removes exactly "pages/$PREVIEW_DIR/$STAGING_SLUG"

  @test:test/workflows/staging-replaces-preview.test.ts::a_deploy_replaces_its_own_preview,_and_only_its_own::the_slug_is_re-checked_BY_VALUE_in_this_step
  Scenario: The slug is re-checked by value in this step
    Given the deploy step's script
    Then it contains 'case "$STAGING_SLUG" in'
    And it matches the empty, ".", ".." and "*/*" patterns
    And it contains "exit 1"

  @test:test/workflows/staging-replaces-preview.test.ts::a_deploy_replaces_its_own_preview,_and_only_its_own::no_sibling_slug_is_touched
  Scenario: No sibling slug is touched
    Given the deploy step's script without its comment lines
    When every "pages/$PREVIEW_DIR/..." path in it is collected
    Then there is more than zero of them
    And every one starts with "pages/$PREVIEW_DIR/$STAGING_SLUG"

  @test:test/workflows/staging-replaces-preview.test.ts::a_deploy_replaces_its_own_preview,_and_only_its_own::both_ends_of_the_tradeoff_point_at_each_other
  Scenario: Both ends of the tradeoff point at each other
    Given docs-site.yml and feature-staging.yml
    Then docs-site.yml mentions "feature-staging.yml" and "85im"
    And feature-staging.yml mentions "plj1" and "85im"
