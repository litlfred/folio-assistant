Feature: Code-quality gates judge a PR by "no new failures compared with main"
  Runs `.github/scripts/cqg-step.sh` and `cqg_judge.py` as the workflow
  does, in a sandbox with a stand-in gate-shell.sh that runs each step with
  bash -e, and a stand-in gh that serves main's run, job and job log (by
  default, job "Repository gates — x (hard)" concluded failure). "Main's
  log" below is the CQG-REPORT-V1 record a push run of the given steps
  prints. Most cases are ones that must fail.

  @test:test/workflows/cqg-no-new-failures.test.ts::before_`--begin`,_a_step's_exit_passes_through_unchanged::a_failing_setup_step_fails
  Scenario: Before --begin, a failing setup step fails
    Given a sandbox where --begin has not run
    Then a step "exit 3" exits 3
    And a step "true" exits 0
    And no steps.jsonl record is written

  @test:test/workflows/cqg-no-new-failures.test.ts::after_`--begin`,_a_failing_step_is_recorded_and_the_next_one_still_runs::the_step_exits_0_and_its_failure_is_in_the_record
  Scenario: After --begin, a failing step exits 0 and its failure is in the record
    Given a sandbox where --begin ran and exited 0
    When a step ": check:a" then "exit 1" runs
    Then it exits 0
    And steps.jsonl holds exactly one record, with exit 1 and label ": check:a"

  @test:test/workflows/cqg-no-new-failures.test.ts::after_`--begin`,_a_failing_step_is_recorded_and_the_next_one_still_runs::the_step's_token_is_not_in_its_own_environment
  Scenario: The step's token is not in its own environment
    Given a sandbox where --begin ran
    When a step checking that CQG_TOKEN is empty runs with CQG_TOKEN "secret"
    Then it exits 0
    And its record's exit is 0

  @test:test/workflows/cqg-no-new-failures.test.ts::a_step_marked_CQG_UNJUDGED_passes_its_exit_status_through,_even_after_`--begin`::its_failure_fails_the_step_and_is_not_recorded
  Scenario: A step marked CQG_UNJUDGED fails on its own failure, and is not recorded
    Given a sandbox where --begin ran
    Then a step "exit 4" with CQG_UNJUDGED "true" exits 4
    And a step "true" with CQG_UNJUDGED "true" exits 0
    And no steps.jsonl record is written

  @test:test/workflows/cqg-no-new-failures.test.ts::push,_merge_group_and_workflow_dispatch:_any_failure_fails,_so_main_stays_red::a_run_with_no_failure_passes
  Scenario: On push, a run with no failure passes
    Given a sandbox where --begin ran and a step "true" ran
    Then the push verdict exits 0

  @test:test/workflows/cqg-no-new-failures.test.ts::pull_request:_only_a_failure_main_does_not_have_fails::a_failure_main_has_too_passes,_and_is_listed_as_failing_on_main_too
  Scenario: A failure main has too passes, and is listed as failing on main too
    Given main's log for a step "check:red-on-main" that fails and a step "check:green-on-main" that passes
    When the PR runs both steps the same way
    Then the pull_request verdict exits 0
    And the summary contains "failing on main too" and "check:red-on-main"

  @test:test/workflows/cqg-no-new-failures.test.ts::pull_request:_only_a_failure_main_does_not_have_fails::main's_log_is_read_even_when_gh_refuses_its_colour_codes_without_--allow-escape-sequences
  Scenario: main's log is read even when gh refuses its colour codes without --allow-escape-sequences
    Given the same main's log, served by a gh that refuses a log without --allow-escape-sequences
    When the PR runs both steps the same way
    Then the pull_request verdict exits 0
    And the summary contains "failing on main too"

  @test:test/workflows/cqg-no-new-failures.test.ts::pull_request:_only_a_failure_main_does_not_have_fails::a_failure_main_passes_is_NEW_and_fails
  Scenario: A failure main passes is new and fails
    Given the same main's log
    When the PR runs "check:red-on-main", and "check:green-on-main" fails on the PR
    Then the pull_request verdict exits 1
    And the summary contains "new failure"

  @test:test/workflows/cqg-no-new-failures.test.ts::pull_request:_only_a_failure_main_does_not_have_fails::a_failure_in_a_step_main_never_recorded_is_NEW_and_fails
  Scenario: A failure in a step main never recorded is new and fails
    Given the same main's log
    When the PR runs a failing step "check:brand-new"
    Then the pull_request verdict exits 1

  @test:test/workflows/cqg-no-new-failures.test.ts::pull_request:_only_a_failure_main_does_not_have_fails::no_failure_passes_without_asking_main_at_all
  Scenario: No failure passes without asking main at all
    Given a gh that fails every call
    When the PR runs only a passing step
    Then the pull_request verdict exits 0

  @test:test/workflows/cqg-no-new-failures.test.ts::could-not-determine_is_never_green::main's_record_cannot_be_read
  Scenario: Main's record cannot be read
    Given a gh that fails every call
    When the PR runs a failing step
    Then the pull_request verdict exits 1
    And the summary contains "Could not determine"

  @test:test/workflows/cqg-no-new-failures.test.ts::could-not-determine_is_never_green::main's_log_holds_no_record,_or_a_corrupt_one
  Scenario: Main's log holds no record, or a corrupt one
    When the PR runs a failing step against a main log of "nothing"
    Then the pull_request verdict exits 1
    When the PR runs a failing step against a main log whose CQG-REPORT-V1 record is not zlib data
    Then the pull_request verdict exits 1

  @test:test/workflows/cqg-no-new-failures.test.ts::could-not-determine_is_never_green::main's_record_is_incomplete
  Scenario: Main's record is incomplete
    Given main's log holding the record of a push run that never began
    When the PR runs a failing step
    Then the pull_request verdict exits 1

  @test:test/workflows/cqg-no-new-failures.test.ts::could-not-determine_is_never_green::the_judged_steps_never_began_on_head
  Scenario: The judged steps never began on head
    Given a sandbox where --begin never ran
    Then the pull_request verdict exits 1

  @test:test/workflows/cqg-no-new-failures.test.ts::could-not-determine_is_never_green::a_step_outside_the_judged_ones_failed_on_head
  Scenario: A step outside the judged ones failed on head
    Given a sandbox where --begin ran and only a passing step ran
    When the verdict is given CQG_JOB_STATUS "failure"
    Then the pull_request verdict exits 1

  @test:test/workflows/cqg-no-new-failures.test.ts::could-not-determine_is_never_green::a_test_step_that_failed_with_no_report
  Scenario: A test step that failed with no report
    Given a sandbox where --begin ran
    When a bun test step exits 1 and its JUnit file is missing
    Then the pull_request verdict exits 1

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::the_same_failing_test_as_main_passes
  Scenario: The same failing bun test as main passes
    Given main's log for a bun step whose JUnit fails "old" and passes "ok"
    When the PR's bun step reports the same
    Then the pull_request verdict exits 0

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::a_second_failing_test_in_the_same_step_fails
  Scenario: A second failing bun test in the same step fails
    Given that main's log
    When the PR's bun step fails both "old" and "ok", reporting 2 fail
    Then the pull_request verdict exits 1
    And the summary contains "a.test.ts > grp > ok"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::an_unhandled_error_between_tests_is_named_by_its_file_and_is_new
  Scenario: An unhandled error between tests is named by its file and is new
    Given that main's log
    When the PR's bun step fails "old" and prints an unhandled error between tests in b.test.ts, reporting 1 fail and 1 error
    Then the pull_request verdict exits 1
    And the summary contains "b.test.ts > (unhandled error between tests)"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::real_bun_1.4.4,_failures_only:_`N_fail`_is_the_JUnit_failures,_and_each_is_judged
  Scenario: Real bun 1.4.4 output with failures only is judged failure by failure
    Given that main's log
    When the PR's bun step reports the captured fixture bun-1.4.4-failures
    Then the pull_request verdict exits 1
    And the summary does not contain "Could not determine"
    And the summary contains "a.test.ts > bad2"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::real_bun_1.4.4,_with_an_unhandled_error:_it_is_on_the_error_line_only,_never_in_`N_fail`_or_the_JUnit
  Scenario: Real bun 1.4.4 output with an unhandled error is judged, the error counted on the error line only
    Given that main's log
    When the PR's bun step reports the captured fixture bun-1.4.4-unhandled
    Then the pull_request verdict exits 1
    And the summary does not contain "Could not determine"
    And the summary contains "b.test.ts > (unhandled error between tests)" and "a.test.ts > after"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::real_bun_1.4.4,_a_file_that_fails_to_load:_its_error_is_counted_in_`N_fail`_too,_and_still_judged
  Scenario: Real bun 1.4.4 output with a file that fails to load is still judged
    Given that main's log
    And the captured fixture bun-1.4.4-load-failure, whose console reports " 4 fail" and " 2 errors"
    When the PR's bun step reports it
    Then the pull_request verdict exits 1
    And the summary does not contain "Could not determine"
    And the summary contains "c.test.ts > (unhandled error between tests)" and "b.test.ts > (unhandled error between tests)"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::`N_fail`_beyond_the_JUnit_failures_plus_every_unhandled_error_is_could-not-determine
  Scenario: N fail beyond the JUnit failures plus every unhandled error is could-not-determine
    Given that main's log
    When the PR's bun step fails "old" with one unhandled error but reports 3 fail and 1 error
    Then the pull_request verdict exits 1
    And the summary contains "Could not determine"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::`N_fail`_below_the_JUnit_failures_is_could-not-determine
  Scenario: N fail below the JUnit failures is could-not-determine
    Given that main's log
    When the PR's bun step's JUnit fails "old" and "other" but it reports 1 fail
    Then the pull_request verdict exits 1
    And the summary contains "Could not determine"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::counts_that_do_not_add_up_are_could-not-determine
  Scenario: Counts that do not add up are could-not-determine
    Given that main's log
    When the PR's bun step's JUnit fails "old" but it reports 3 fail
    Then the pull_request verdict exits 1
    And the summary contains "Could not determine"

  @test:test/workflows/cqg-no-new-failures.test.ts::bun_test_is_judged_per_test::a_non-zero_exit_with_no_failing_test_is_could-not-determine
  Scenario: A non-zero exit with no failing test is could-not-determine
    Given that main's log
    When the PR's bun step passes "old", reports 0 fail, and exits 1
    Then the pull_request verdict exits 1

  @test:test/workflows/cqg-no-new-failures.test.ts::Playwright_is_judged_per_spec::a_spec_failing_on_main_too_passes;_a_new_one_fails;_errors_outside_tests_are_could-not-determine
  Scenario: Playwright is judged per spec
    Given main's log for a Playwright step whose spec "home" fails
    Then a PR failing "home" only passes the pull_request verdict
    And a PR failing "home" and "menu" fails it
    And a PR failing "home" that also reports "1 error was not a part of any test" fails it

  @test:test/workflows/cqg-no-new-failures.test.ts::verdict_reuse_refuses_a_run_that_passed_by_inheriting_main's_failures::a_clean_record_keeps_the_reuse
  Scenario: A clean record keeps the reuse
    Given a successful job "TypeScript — bun test, shard 1/4" whose log holds the record of a run with no failure
    When cqg_judge.py reuse-check runs, exiting 0
    Then its output is "reuse=true"

  @test:test/workflows/cqg-no-new-failures.test.ts::verdict_reuse_refuses_a_run_that_passed_by_inheriting_main's_failures::an_inherited_failure_refuses_it
  Scenario: An inherited failure refuses the reuse
    Given a successful job whose log holds the record of a run with a failing step
    When cqg_judge.py reuse-check runs, exiting 0
    Then its output is "reuse=false"

  @test:test/workflows/cqg-no-new-failures.test.ts::verdict_reuse_refuses_a_run_that_passed_by_inheriting_main's_failures::no_record,_or_no_API,_refuses_it
  Scenario: No record, or no API, refuses the reuse
    Then reuse-check outputs "reuse=false" for a log of "nothing"
    And it outputs "reuse=false" when gh fails

  @test:test/workflows/cqg-no-new-failures.test.ts::a_PR_run_of_only_the_affected_tests_(CI_speed_7,_#2962)_is_said_so,_and_never_reused_for_main::the_verdict_says_only_the_affected_files_were_judged,_never_a_plain_pass
  Scenario: The verdict says only the affected files were judged, never a plain pass
    Given a bun step that ran pr-bun-test.sh with a scope of 3 selected files
    Then the pull_request verdict exits 0
    And the summary contains "Only the 3 affected test file(s) were judged"

  @test:test/workflows/cqg-no-new-failures.test.ts::a_PR_run_of_only_the_affected_tests_(CI_speed_7,_#2962)_is_said_so,_and_never_reused_for_main::reuse-check_refuses_a_run_that_judged_only_a_selection
  Scenario: reuse-check refuses a run that judged only a selection
    Given a job log holding the record of a pull_request run that judged a selection of 2 files
    When reuse-check runs
    Then its output is "reuse=false"
    And the summary contains "ran only the PR's affected tests"

  @test:test/workflows/cqg-no-new-failures.test.ts::a_PR_run_of_only_the_affected_tests_(CI_speed_7,_#2962)_is_said_so,_and_never_reused_for_main::a_whole-suite_run_(kind_all)_is_not_scoped
  Scenario: A whole-suite run, of kind all, is not scoped
    Given a bun step that ran with a scope of kind "all"
    When the pull_request verdict runs
    Then the summary does not contain "affected test file"

  @test:test/workflows/cqg-no-new-failures.test.ts::the_workflow_wires_it_as_designed::every_judged_job_uses_the_wrapper,_has_actions:_read,_and_names_itself_for_main's_lookup
  Scenario: Every judged job uses the wrapper, has actions: read, and names itself for main's lookup
    Given the judged jobs typescript-test, gates-kg, gates-docs, gates-standalone, gates-unrun and e2e-shard of code-quality-gates.yml
    Then each runs steps with shell "bash ${{ github.workspace }}/.github/scripts/cqg-step.sh {0}"
    And each has exactly the permissions contents: read and actions: read
    And each sets CQG_JOB_NAME to its own name
    And each has exactly one step running "bash .github/scripts/cqg-step.sh --begin"

  @test:test/workflows/cqg-no-new-failures.test.ts::the_workflow_wires_it_as_designed::each_judged_job_ends_in_its_verdict
  Scenario: Each judged job ends in its verdict
    Given the last step of each judged job
    Then it runs "python3 .github/scripts/cqg_judge.py verdict" or sets CQG_VERDICT "true"
    And where it runs the verdict, its if is "${{ !cancelled() }}", it sets no shell, and it sets CQG_UNJUDGED "true"

  @test:test/workflows/cqg-no-new-failures.test.ts::the_workflow_wires_it_as_designed::bun_test_and_the_drift_check_stay_their_jobs'_last_steps,_and_give_the_verdict
  Scenario: bun test and the drift check stay their jobs' last steps
    Then the last step of typescript-test runs "bun test"
    And the last step of gates-docs runs "bun run cat translation:drift:check"

  @test:test/workflows/cqg-no-new-failures.test.ts::the_workflow_wires_it_as_designed::nothing_here_uses_continue-on-error_or_`||_true`
  Scenario: Nothing here uses continue-on-error or "|| true"
    Then no step of a judged job sets continue-on-error
    And cqg-step.sh contains no "|| true"

  @test:test/workflows/cqg-no-new-failures.test.ts::the_workflow_wires_it_as_designed::no_step-level_`shell:`_holds_an_expression
  Scenario: No step-level shell holds an expression
    Given every step of every job in code-quality-gates.yml
    Then no step's shell contains "${{"

  @test:test/workflows/cqg-no-new-failures.test.ts::the_workflow_wires_it_as_designed::verdict_reuse_is_`true`_only_when_the_inheritance_check_says_so
  Scenario: Verdict reuse is true only when the inheritance check says so
    Given the verdict-reuse job
    Then its reuse output is "${{ steps.decide.outputs.reuse == 'true' && steps.inherited.outputs.reuse == 'true' && 'true' || 'false' }}"
