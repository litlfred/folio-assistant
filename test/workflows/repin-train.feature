Feature: The re-pin train's decisions, and the workflows that call them
  Exercises `.github/scripts/repin-train.ts`: whether a train PR has no new
  failures compared with main (per job, or per check where a job left a
  CQG record), when a train opens, whether a green train merges itself,
  and the text of repin-train.yml, repin-train-verdict.yml and sweeps.yml.
  JOB below is the job "Repository gates — workflows, skills, knowledge
  graph (hard)".

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::a_failure_main_also_has_is_known,_not_new
  Scenario: A failure main also has is known, not new
    Given the train and main both fail "e2e (1)" and pass "lint"
    When compare judges them
    Then the verdict is exactly success, with "e2e (1)" known and nothing pending, new or undetermined

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::a_failure_main_passes_is_new_and_blocks
  Scenario: A failure main passes is new and blocks
    Given the train fails "bun test (3)" and main passes it
    When compare judges them
    Then the state is "failure"
    And the new failures are exactly "bun test (3)"

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::a_failing_check_main_does_not_run_at_all_is_new
  Scenario: A failing check main does not run at all is new
    Given the train fails "stage" and main runs only "lint"
    Then compare's new failures are exactly "stage"

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::cancelled_and_timed_out_are_not_passes
  Scenario: Cancelled and timed out are not passes
    Given the train's "a" was cancelled and "b" timed out, and main has no checks
    Then compare's new failures are exactly "a" and "b"

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::a_re-run_supersedes_the_run_it_repeats
  Scenario: A re-run supersedes the run it repeats
    Given the train's "bun test (2)" failed and then passed on a re-run
    Then compare's state is "success"

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::a_running_check_keeps_the_verdict_pending,_unless_a_new_failure_already_decides_it
  Scenario: A running check keeps the verdict pending, unless a new failure already decides it
    Then compare's state is "pending" when "a" is in progress and "b" passed
    And it is "failure" when "a" is in progress and "b" failed

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::no_checks_at_all_is_never_green
  Scenario: No checks at all is never green
    Then compare of no train checks against no main checks is "pending"

  @test:test/workflows/repin-train.test.ts::no_new_failures_compared_with_main::waits_for_a_hard_gate_main_runs_that_has_not_started_on_the_train
  Scenario: It waits for a hard gate main runs that has not started on the train
    Given the train passed only "stage", and main passed "Repository gates (hard)" and "deploy"
    Then compare's state is "pending"
    And pending is exactly "Repository gates (hard)"

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::a_new_failure_inside_a_job_main_also_fails_is_NEW,_not_masked_by_the_job
  Scenario: A new failure inside a job main also fails is new, not masked by the job
    Given JOB fails on both sides
    And the train's record fails steps a and b, and main's fails a and passes b
    Then compare's state is "failure"
    And the new failures are exactly "JOB › b"
    And the known failures are exactly "JOB › a"

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::every_failing_check_also_failing_on_main_is_known,_and_the_train_is_green
  Scenario: Every failing check also failing on main is known, and the train is green
    Given JOB fails on both sides
    And the train's record fails test "x.test.ts > t" and passes step a, and main's record fails that test
    Then compare's state is "success"
    And the known failures are exactly "JOB › x.test.ts > t"

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::a_check_main's_record_lacks_is_new
  Scenario: A check main's record lacks is new
    Given JOB fails on both sides
    And the train's record fails test "new.test.ts > t", and main's record is empty
    Then the new failures are exactly "JOB › new.test.ts > t"

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::could-not-determine_is_never_green
  Scenario Outline: Could-not-determine is never green: <case>
    Given JOB fails on both sides, with <case>
    Then compare's state is "error"
    And there is exactly one undetermined entry
    And there are no new failures

    Examples:
      | case                                                                 |
      | no train record where main has one                                   |
      | an incomplete train record                                           |
      | a train record with an undetermined item                             |
      | no main record to compare with                                       |
      | an incomplete main record                                            |
      | a train record naming nothing failing although the job failed        |

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::a_new_failure_decides_the_verdict_even_when_something_else_is_undetermined
  Scenario: A new failure decides the verdict even when something else is undetermined
    Given JOB fails on both sides with no train record, and "other" fails on the train but passes on main
    Then compare's state is "failure"
    And the new failures are exactly "other"

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::a_job_with_no_record_on_either_side_is_judged_as_a_whole_job,_as_before
  Scenario: A job with no record on either side is judged as a whole job, as before
    Given "Feature staging" fails on both sides, with no record on either
    Then compare's state is "success"
    And the known failures are exactly "Feature staging"

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::the_record_is_read_back_exactly_as_cqg_judge.py_writes_it
  Scenario: The record is read back exactly as cqg_judge.py writes it
    Given a log with noise, an undecodable "CQG-REPORT-V1" line, and a timestamped "CQG-REPORT-V1" line carrying a deflated, base64 record
    Then decodeCqgRecord returns that record exactly
    And decodeCqgRecord of "no record here" is undefined

  @test:test/workflows/repin-train.test.ts::a_failing_job_is_judged_check_by_check_when_it_left_a_record::the_comment_lists_what_could_not_be_compared,_and_says_the_train_does_not_merge
  Scenario: The comment lists what could not be compared
    Given an "error" verdict whose undetermined entry is "J: why"
    When verdictComment writes it
    Then the body contains "Could not determine"
    And the body contains "- `J: why`"

  @test:test/workflows/repin-train.test.ts::a_green_train_merges_itself::merges_with_a_merge_commit,_the_judged_head_as_the_expected_sha
  Scenario: A green train merges with a merge commit, the judged head as the expected sha
    Given a stub API with open, mergeable train PR #9 labelled "repin-train" on a repin-train/ branch of this repository
    When mergeTrain runs for #9 at its head sha
    Then it reports merged
    And the only request sent is a PUT to /pulls/9/merge with merge_method "merge" and that sha

  @test:test/workflows/repin-train.test.ts::a_green_train_merges_itself::never_merges_a_head_that_moved,_a_closed_PR,_a_fork's_branch,_or_an_unmergeable_PR
  Scenario Outline: It never merges <case>
    Given a stub API with train PR #9 that is <case>
    When mergeTrain runs for #9 at the judged sha
    Then it reports not merged
    And nothing is sent

    Examples:
      | case                                     |
      | at a head that moved                     |
      | closed                                   |
      | from a fork                              |
      | on a branch that is not repin-train/     |
      | unlabelled                               |
      | not mergeable, with state "dirty"        |
      | of unknown mergeability                  |

  @test:test/workflows/repin-train.test.ts::a_green_train_merges_itself::a_refused_merge_is_reported,_not_thrown
  Scenario: A refused merge is reported, not thrown
    Given a stub API whose writes fail with "HTTP 405 Base branch was modified"
    When mergeTrain runs
    Then it reports not merged
    And its why contains "405"

  @test:test/workflows/repin-train.test.ts::a_green_train_merges_itself::a_sweep_judges_open_trains_with_no_final_verdict,_and_only_this_repository's
  Scenario: A sweep judges open trains with no final verdict, and only this repository's
    Given open trains a with no status, b with "failure", c with "success", d with "error", and a fork's train e
    Then trainsToJudge returns the heads of a and c

  @test:test/workflows/repin-train.test.ts::a_green_train_merges_itself::a_failed_train_is_judged_again_while_its_checks_still_run,_so_the_comment_lists_every_failure
  Scenario: A failed train is judged again while its checks still run
    Given open trains b and d, both with status "failure", where only b's checks are still running
    Then trainsToJudge returns the head of b

  @test:test/workflows/repin-train.test.ts::main's_baseline_is_read_one_check_at_a_time::a_check_the_newest_main_commit_skipped_takes_its_answer_from_an_older_commit
  Scenario: A check the newest main commit skipped takes its answer from an older commit
    Given the newest main commit passed "deploy", and an older one failed "Repository gates (hard)" and "deploy"
    When baselineByName reads them, newest first
    Then the baseline's "Repository gates (hard)" is "failure" and its "deploy" is "success"
    And a train failing "Repository gates (hard)" has it as a known failure

  @test:test/workflows/repin-train.test.ts::main's_baseline_is_read_one_check_at_a_time::a_check_still_running_on_the_newest_commit_keeps_the_older_finished_answer
  Scenario: A check still running on the newest commit keeps the older finished answer
    Given "bun test (1)" is in progress on the newest main commit and failed on an older one
    Then baselineByName's conclusions are exactly "failure"

  @test:test/workflows/repin-train.test.ts::when_a_train_opens::nothing_open:_open_a_train
  Scenario: With nothing open, a train opens
    Then decide for tree a with no train PRs is exactly open, because "new pins", closing nothing

  @test:test/workflows/repin-train.test.ts::when_a_train_opens::a_tree_an_earlier_train_already_tested_is_skipped,_open_or_closed
  Scenario: A tree an earlier train already tested is skipped, open or closed
    Then decide for tree a skips when closed train #7 tested tree a
    And it skips when open train #7 tested tree a and failed

  @test:test/workflows/repin-train.test.ts::when_a_train_opens::a_train_still_being_checked_keeps_its_pins_frozen
  Scenario: A train still being checked keeps its pins frozen
    Given open train #7 tested tree a
    Then decide for tree b skips while #7 has no verdict, with a reason naming "#7"
    And it skips while #7's verdict is "pending"

  @test:test/workflows/repin-train.test.ts::when_a_train_opens::a_passed_train_waiting_for_its_merge_is_not_closed_under_that_merge
  Scenario: A passed train waiting for its merge is not closed under that merge
    Given open train #7 tested tree a and passed
    Then decide for tree b skips

  @test:test/workflows/repin-train.test.ts::when_a_train_opens::a_failed_train_is_replaced_and_closed
  Scenario: A failed train is replaced and closed
    Given open train #7 tested tree a and failed, and closed train #5 tested tree c
    Then decide for tree b is exactly open, because "new pins", closing #7

  @test:test/workflows/repin-train.test.ts::the_workflows::the_train_runs_every_two_hours,_one_at_a_time
  Scenario: The train runs every two hours, one at a time
    Given repin-train.yml
    Then its cron runs at a fixed minute every 2 hours
    And its concurrency group is repin-train, with cancel-in-progress false

  @test:test/workflows/repin-train.test.ts::the_workflows::the_train_moves_pins_only_through_standing_consent,_and_never_merges_while_it_cuts_the_next_train
  Scenario: The train moves pins only through standing consent, and never merges while it cuts the next train
    Given repin-train.yml
    Then it runs "mount:repin:standing"
    And it contains no "/merge" and no "gh pr merge"
    And it runs 'repin-train.ts verdict --sha "$sha" --no-merge'

  @test:test/workflows/repin-train.test.ts::the_workflows::the_train_refreshes_bun.lock_with_its_pins,_so_frozen_installs_pass
  Scenario: The train refreshes bun.lock with its pins, so frozen installs pass
    Given repin-train.yml
    Then "bun install" comes after "mount:repin:standing --summary-file" and before "git add -u"

  @test:test/workflows/repin-train.test.ts::the_workflows::the_train_never_commits_workflow_files,_which_its_token_may_not_push
  Scenario: The train never commits workflow files, which its token may not push
    Given repin-train.yml
    Then "git checkout -- .github/workflows" comes after "mount:repin:standing --summary-file" and before "git add -u"

  @test:test/workflows/repin-train.test.ts::the_workflows::the_train_judges_open_trains_itself,_since_token-started_CI_triggers_no_workflow_run
  Scenario: The train judges open trains itself, since token-started CI triggers no workflow_run
    Given repin-train.yml
    Then "repin-train.ts verdict --sha" comes before the last "repin-train.ts decide --tree"
    And it grants "statuses: write"

  @test:test/workflows/repin-train.test.ts::the_workflows::without_a_bot_token,_the_train_starts_both_workflows_the_verdict_reads
  Scenario: Without a bot token, the train starts both workflows the verdict reads
    Given repin-train.yml
    Then it runs "gh workflow run code-quality-gates.yml"
    And it runs "gh workflow run feature-staging.yml"

  @test:test/workflows/repin-train.test.ts::the_workflows::the_verdict_judges_only_train_branches
  Scenario: The verdict judges only train branches
    Given repin-train-verdict.yml
    Then it contains "startsWith(github.event.workflow_run.head_branch, 'repin-train/')"
    And it contains "github.event.workflow_run.head_repository.full_name == github.repository"

  @test:test/workflows/repin-train.test.ts::the_workflows::the_verdict_sweeps_open_trains_on_a_short_schedule,_since_token-started_CI_triggers_no_workflow_run
  Scenario: The verdict sweeps open trains on a schedule, since token-started CI triggers no workflow_run
    Given sweeps.yml and repin-train-verdict.yml
    Then sweeps.yml has a schedule with a cron
    And sweeps.yml runs "repin-train.ts pending" and "gh workflow run repin-train-verdict.yml"
    And repin-train-verdict.yml has "workflow_dispatch:" and runs "repin-train.ts verdict --open"

  @test:test/workflows/repin-train.test.ts::the_workflows::the_verdict's_workflow_run_fires_only_for_train_branches,_at_the_trigger
  Scenario: The verdict's workflow_run fires only for train branches, at the trigger
    Given repin-train-verdict.yml
    Then it contains "branches: ['repin-train/**']"

  @test:test/workflows/repin-train.test.ts::the_workflows::the_verdict_merges_with_a_token_whose_push_starts_main's_workflows_when_one_is_set
  Scenario: The verdict merges with a token whose push starts main's workflows when one is set
    Given repin-train-verdict.yml
    Then it sets "MERGE_TOKEN: ${{ steps.bot.outputs.token || secrets.PUSH_BRANCH_TRIGGERING_CI || github.token }}"
    And it grants "contents: write"
    And it grants actions read or write
