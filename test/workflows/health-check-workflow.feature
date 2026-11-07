Feature: health-check.yml's daily trigger and its tracking-issue path
  The workflow is parsed, not run: its trigger, permissions and the report
  job's steps and their if: clauses are asserted.

  @test:test/workflows/health-check-workflow.test.ts::the_trigger::fires_once_every_24_hours,_as_asked,_and_off_the_hour
  Scenario: It fires once every 24 hours, and off the hour
    Given the schedule crons of health-check.yml
    Then there is exactly one
    And its day-of-month, month and day-of-week fields are each "*"
    And its hour is a number of at least 0
    And its minute is not 0

  @test:test/workflows/health-check-workflow.test.ts::the_trigger::is_runnable_on_demand,_because_a_check_reachable_only_from_a_cron_cannot_be_reproduced
  Scenario: It is runnable on demand, because a check reachable only from a cron cannot be reproduced
    Given the on: block of health-check.yml
    Then it has a workflow_dispatch trigger

  @test:test/workflows/health-check-workflow.test.ts::the_trigger::can_ask_which_pull_requests_are_open,_or_the_orphan_check_is_blind_by_construction
  Scenario: It can ask which pull requests are open, or the orphan check is blind by construction
    Given the permissions of health-check.yml
    Then pull-requests is "read"
    And issues is "write"

  @test:test/workflows/health-check-workflow.test.ts::the_trigger::fetches_the_whole_history_of_main,_without_which_the_size_ratio_cannot_fire
  Scenario: It fetches the whole history of main, without which the size ratio cannot fire
    Given the steps of the report job
    Then a step running "git fetch --unshallow ... refs/heads/main" comes after the checkout step
    And the "Run the health checks" step comes after it

  @test:test/workflows/health-check-workflow.test.ts::the_trigger::never_makes_the_clone_a_partial_clone,_which_turns_every_size_lookup_into_a_fetch_(bean_1dre)
  Scenario: It never makes the clone a partial clone
    Given the steps of the report job
    Then no step runs with "--filter=blob:none"

  @test:test/workflows/health-check-workflow.test.ts::the_trigger::does_not_fetch_every_branch,_which_ran_past_the_timeout_on_every_run_(bean_1dre)
  Scenario: It does not fetch every branch
    Given the report job's checkout step
    Then its fetch-depth is not 0

  @test:test/workflows/health-check-workflow.test.ts::the_tracking_issue::is_opened_or_edited_only_on_findings
  Scenario: The tracking issue is opened or edited only on findings
    Given the "Open or update the tracking issue" step
    Then its if is "steps.check.outputs.verdict == 'findings'"

  @test:test/workflows/health-check-workflow.test.ts::the_tracking_issue::is_EDITED_in_place_rather_than_commented_on,_so_a_persistent_finding_stays_one_unread_item
  Scenario: The tracking issue is edited in place rather than commented on
    Given the "Open or update the tracking issue" step
    Then its run contains "gh issue edit"
    And its run does not contain "gh issue comment"

  @test:test/workflows/health-check-workflow.test.ts::the_tracking_issue::is_closed_only_when_every_check_ran_and_was_clean
  Scenario: The tracking issue is closed only when every check ran and was clean
    Given the "Close the tracking issue" step
    Then its if is "steps.check.outputs.verdict == 'clean'"

  @test:test/workflows/health-check-workflow.test.ts::the_tracking_issue::is_NEVER_closed_on_`unknown`,_and_the_job_fails_instead
  Scenario: The tracking issue is never closed on unknown, and the job fails instead
    Given the steps of the report job whose run mentions "gh issue"
    Then there is more than zero of them
    And each has an if that does not contain "unknown'" and names 'findings' or 'clean'
    And the "Refuse to report success" step's if is "steps.check.outputs.verdict == 'unknown'"
    And its run contains "exit 1"

  @test:test/workflows/health-check-workflow.test.ts::the_tracking_issue::keeps_the_machine-readable_report_whatever_the_verdict,_including_when_it_went_blind
  Scenario: The machine-readable report is kept whatever the verdict, including when it went blind
    Given the report job's upload-artifact step
    Then its if is "always()"
    And its path is the health report path, relative to the index root
    And its if-no-files-found is "error"

  @test:test/workflows/health-check-workflow.test.ts::the_tracking_issue::runs_every_step_from_the_repository_root,_so_the_upload_path_is_resolved_there
  Scenario: Every step runs from the repository root, so the upload path is resolved there
    Given the steps of the report job
    Then none sets a working-directory

  @test:test/workflows/health-check-workflow.test.ts::the_tracking_issue::treats_an_exit_1_with_no_report_as_unchecked_rather_than_as_a_finding
  Scenario: An exit 1 with no report is treated as unchecked rather than as a finding
    Given the "Run the health checks" step
    Then its run contains '[ ! -s "$report" ]'
