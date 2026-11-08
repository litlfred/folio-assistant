Feature: One staging deploy is one commit on gh-pages
  Reads the jobs of .github/workflows/feature-staging.yml. A step writes to
  gh-pages when it runs "git push origin gh-pages" or uses
  peaceiris/actions-gh-pages.

  @test:test/workflows/staging-one-commit.test.ts::a_staging_deploy_is_one_commit_—_bean_`bm6d`::exactly_ONE_step_of_the_stage_job_writes_to_gh-pages
  Scenario: Exactly one step of the stage job writes to gh-pages
    Given the steps of the stage job
    Then exactly 1 of them writes to gh-pages

  @test:test/workflows/staging-one-commit.test.ts::a_staging_deploy_is_one_commit_—_bean_`bm6d`::and_it_commits_the_payload_and_the_record_TOGETHER
  Scenario: That step commits the payload and the record together
    Given the stage job's one gh-pages writer
    Then it runs 'git -C pages add -A "$PREVIEW_DIR/$STAGING_SLUG" _render-log'
    And it does not name "$PREVIEW_DIR/$STAGING_SLUG/_render-log"

  @test:test/workflows/staging-one-commit.test.ts::a_staging_deploy_is_one_commit_—_bean_`bm6d`::the_peaceiris_action_is_gone_from_the_stage_job_—_it_cannot_reach_the_root
  Scenario: The peaceiris action is gone from the stage job, since it cannot reach the root
    Given the stage job
    Then it does not mention peaceiris/actions-gh-pages

  @test:test/workflows/staging-one-commit.test.ts::a_staging_deploy_is_one_commit_—_bean_`bm6d`::the_contended-ref_retry_survives_—_three_attempts,_each_re-reading_gh-pages
  Scenario: The contended-ref retry survives, with three attempts, each re-reading gh-pages
    Given the stage job's one gh-pages writer
    Then it loops 'while [ "$attempt" -le 3 ]; do'
    And it increments attempt with "attempt=$((attempt + 1))"
    And it runs "git -C pages fetch --depth=1 origin gh-pages"
    And it runs "git -C pages reset --hard FETCH_HEAD"
    And it neither pulls with --rebase nor runs git rebase

  @test:test/workflows/staging-one-commit.test.ts::a_staging_deploy_is_one_commit_—_bean_`bm6d`::a_failed_deploy_still_fails_the_job_—_a_lost_preview_stays_visible
  Scenario: A failed deploy still fails the job, so a lost preview stays visible
    Given the stage job's one gh-pages writer
    Then it emits "::error::could not deploy the staging preview after 3 attempts"
    And it contains "exit 1"

  @test:test/workflows/staging-one-commit.test.ts::the_paths_bm6d_warned_might_be_load-bearing_still_work::the_cleanup_removal_carries_its_payload_and_its_record_in_ONE_commit
  Scenario: The cleanup removal carries its payload and its record in one commit
    Given the cleanup-dispatch job
    Then it runs 'git add -A "$PD/$CLEANUP_SLUG" _render-log'
    And it passes "--event removed"
    And it passes "--reason "

  @test:test/workflows/staging-one-commit.test.ts::the_paths_bm6d_warned_might_be_load-bearing_still_work::the_retained_path_logs_with_NO_payload,_which_is_the_case_that_must_not_be_coalesced
  Scenario: The retained path logs with no payload, the case that must not be coalesced
    Given the cleanup job
    Then it passes "--event retained"
    And it runs "git -C pages add -A _render-log"
