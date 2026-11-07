Feature: Every render-log-union-attr.sh call in feature-staging.yml is there and resolves
  Reads this repository's .github/workflows/feature-staging.yml. A call site
  is resolved against its job's platform checkout path and its step's
  working-directory, then mapped back into this repository.

  @test:test/workflows/render-log-union-attr.test.ts::render-log-union-attr.sh::every_gh-pages_rebase_in_feature-staging.yml_is_preceded_by_it
  Scenario: Every gh-pages rebase in feature-staging.yml is preceded by the script
    Given the lines of feature-staging.yml
    When the "git pull --rebase origin gh-pages" lines are found
    Then there are exactly 3 of them
    And each of the 4 lines before each one mentions render-log-union-attr.sh

  @test:test/workflows/render-log-union-attr.test.ts::render-log-union-attr.sh::...and_every_call_RESOLVES_from_the_cwd_its_step_actually_runs_in
  Scenario: Every call resolves from the directory its step actually runs in
    Given every "bash ...render-log-union-attr.sh" call in feature-staging.yml
    When each is resolved against its job's platform checkout and its step's working-directory
    Then there are exactly 3 call sites
    And every one resolves inside the platform checkout to a file that exists in this repository

  @test:test/workflows/render-log-union-attr.test.ts::render-log-union-attr.sh::a_path_that_is_right_for_ANOTHER_job_is_caught,_not_waved_through
  Scenario: A path that is right for another job is caught, not waved through
    Given the resolved call sites of feature-staging.yml, grouped by job
    Then the "stage" job has no call sites
    And the "cleanup" job has at least one
    And each "cleanup" literal starts with "source/cat-harness-tools/"
    And the bare literal "cat-harness-tools/scripts/render-log-union-attr.sh", resolved from that step's directory, does not start with "source/"
