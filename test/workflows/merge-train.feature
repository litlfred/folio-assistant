Feature: The merge train's decisions, and the workflows that call them
  Exercises `.github/scripts/merge-train.ts`: who is opted in and ready,
  what the next batch is, how a red batch is bisected, the state kept in a
  train PR's body, a tick against a stub GitHub API, and the text of the
  workflows that call it. The default candidate is PR #10: not a draft,
  based on main, from this repository, labelled "merge-train" by a User,
  changing src/x.ts, with a passing "lint (hard)" check.

  @test:test/workflows/merge-train.test.ts::opted_in_and_ready::a_person's_label,_green_checks:_ready
  Scenario: A person's label and green checks make a PR ready
    Given main's checks: "lint (hard)" passing and "tests (hard)" failing
    Then notReady finds no reason for the default candidate

  @test:test/workflows/merge-train.test.ts::opted_in_and_ready::a_label_added_by_a_bot_is_not_a_person's_decision
  Scenario: A label added by a bot is not a person's decision
    Given the default candidate labelled by a Bot
    Then notReady's reason contains "not added by a person"

  @test:test/workflows/merge-train.test.ts::opted_in_and_ready::an_approval_opts_in_without_the_label
  Scenario: An approval opts in without the label
    Given a candidate with no label that is approved
    Then notReady finds no reason
    Given a candidate with no label that is not approved
    Then notReady's reason contains "not opted in"

  @test:test/workflows/merge-train.test.ts::opted_in_and_ready::drafts,_forks,_other_bases_and_protected_paths_are_never_carried
  Scenario: Drafts, forks, other bases and protected paths are never carried
    Then notReady says "a draft" for a draft
    And notReady says "a fork" for a PR from another repository
    And notReady's reason contains "base is dev" for a PR based on dev
    And notReady's reason contains "never carries" for a PR changing .github/workflows/x.yml
    And notReady's reason contains "never carries" for a PR changing subscriptions/a/b.json

  @test:test/workflows/merge-train.test.ts::opted_in_and_ready::a_failure_main_shares_does_not_block;_a_new_one_does;_running_checks_wait
  Scenario: A failure main shares does not block, a new one does, and running checks wait
    Given main's checks: "lint (hard)" passing and "tests (hard)" failing
    Then a candidate whose "tests (hard)" fails is ready
    And a candidate whose "lint (hard)" fails is not, with a reason containing "fail where main passes"
    And a candidate whose "lint (hard)" is in progress is not, with a reason containing "still running"

  @test:test/workflows/merge-train.test.ts::opted_in_and_ready::a_conflicted_PR_has_no_runs,_and_the_train_integrates_it
  Scenario: A conflicted PR has no runs, and the train integrates it
    Given a candidate with no check runs
    Then notReady finds no reason

  @test:test/workflows/merge-train.test.ts::opted_in_and_ready::a_train_PR_is_never_a_member_of_a_train
  Scenario: A train PR is never a member of a train
    Given a candidate labelled "merge-train" and "merge-train-batch"
    Then notReady's reason contains "train PR itself"

  @test:test/workflows/merge-train.test.ts::bisecting_a_red_batch::one_member_is_the_culprit
  Scenario: A red batch of one member ejects it
    When afterRed is given the batch [7] and the queue [[8, 9]]
    Then it ejects 7 and keeps the queue [[8, 9]]

  @test:test/workflows/merge-train.test.ts::bisecting_a_red_batch::a_larger_batch_splits_in_halves,_first_half_first,_ahead_of_the_old_queue
  Scenario: A larger batch splits in halves, first half first, ahead of the old queue
    When afterRed is given the batch [1, 2, 3, 4, 5] and the queue [[9]]
    Then the queue is [[1, 2, 3], [4, 5], [9]]

  @test:test/workflows/merge-train.test.ts::bisecting_a_red_batch::one_culprit_among_k_costs_about_ceil(log2_k)_red_runs
  Scenario Outline: One culprit among <k> costs about ceil(log2 k) red runs
    Given a batch of <k> PRs whose last one is the culprit
    When batches are run from the queue, every red one being bisected with afterRed
    Then any ejected PR is the culprit
    And <k> minus 1 PRs land
    And there are at most ceil(log2 <k>) + 1 red runs

    Examples:
      | k  |
      | 2  |
      | 3  |
      | 5  |
      | 8  |
      | 16 |
      | 33 |

  @test:test/workflows/merge-train.test.ts::the_next_batch::the_bisect_queue_goes_first,_restricted_to_PRs_still_ready
  Scenario: The bisect queue goes first, restricted to PRs still ready
    Then nextBatch of ready [1, 2, 5, 9] with queue [[3, 2], [1]] is batch [2] with queue [[1]]
    And nextBatch of ready [5, 9] with queue [[3], [4]] is batch [5, 9] with an empty queue

  @test:test/workflows/merge-train.test.ts::the_next_batch::with_no_queue,_every_ready_PR,_oldest_first
  Scenario: With no queue, the batch is every ready PR, oldest first
    Then nextBatch of ready [9, 1, 5] with no queue is batch [1, 5, 9] with an empty queue

  @test:test/workflows/merge-train.test.ts::one_tick's_step::an_open_train_still_being_checked_waits
  Scenario: An open train still being checked waits
    Given an open train #50 with members 1 and 2
    Then decideStep's action is "wait" when its check state is "pending"
    And it is "wait" when its check state is unknown

  @test:test/workflows/merge-train.test.ts::one_tick's_step::green_merges;_red_bisects_or_ejects
  Scenario: Green merges, and red bisects or ejects
    Given an open train #50 with members 1 and 2
    Then decideStep's action is "merge" on "success"
    And on "failure" it is "red" with the queue [[1], [2]]
    Given an open train with member 4 and queue [[5]]
    Then on "error" decideStep is "red", ejecting 4, with the queue [[5]]

  @test:test/workflows/merge-train.test.ts::one_tick's_step::no_open_train:_build_from_the_newest_train's_queue,_else_the_pool
  Scenario: With no open train, build from the newest train's queue, else the pool
    Given closed trains #52 with queue [[3]] and #51 with queue [[9]], and ready PRs 3 and 4
    Then decideStep is "build" with batch [3] and an empty queue
    And with no trains and ready PRs 4 and 3 it is "build" with batch [3, 4]
    And with no trains and no ready PRs its action is "idle"

  @test:test/workflows/merge-train.test.ts::state_in_the_train_PR_body::round-trips,_and_a_body_without_it_reads_as_none
  Scenario: The state in the train PR body round-trips, and a body without it reads as none
    Given a state with member 1 and queue [[2, 3]]
    Then readState of a body embedding writeState of it returns the same state
    And readState of "no state" is undefined
    And readState of "<!-- merge-train:state {broken} -->" is undefined

  @test:test/workflows/merge-train.test.ts::state_in_the_train_PR_body::only_the_members_merge:train_merged_are_carried;_the_rest_are_named
  Scenario: Only the members merge:train merged are carried, and the rest are named
    Given a plan with members 1 and 2
    And a merge:train report where 1 is "merged" and 2 is "refused" because "1 conflict(s) need a person"
    When builtMembers reads them
    Then the members are just 1
    And the refused are 2 with that reason
    And the trainBody of them reads back with those members
    And the body contains "#2: 1 conflict(s) need a person"

  @test:test/workflows/merge-train.test.ts::the_workflows_are_wired::merge-main's_sweep_skips_a_PR_in_the_train
  Scenario: merge-main's sweep skips a PR in the train
    Given merge-main.yml
    Then it contains 'any(.labels[]; .name == "merge-train")'

  @test:test/workflows/merge-train.test.ts::the_workflows_are_wired::the_sweep_dispatches_the_train_only_when_`pending`_says_so
  Scenario: The sweep dispatches the train only when pending says so
    Given sweeps.yml
    Then it contains "merge-train.ts pending"
    And it contains "gh workflow run merge-train.yml"

  @test:test/workflows/merge-train.test.ts::the_workflows_are_wired::the_train_builds_with_merge:train_and_judges_once
  Scenario: The train builds with merge:train and judges once
    Given merge-train.yml
    Then it contains "bun run cat merge:train -- --base origin/main"
    And it contains "merge-train.ts tick"
    And it contains "gh workflow run code-quality-gates.yml"
    And it contains "merge-train.ts eject-refused"

  @test:test/workflows/merge-train.test.ts::the_workflows_are_wired::a_dispatch_on_main_after_a_train_merge_is_looked_up_by_its_second_parent
  Scenario: A dispatch on main after a train merge is looked up by its second parent
    Given code-quality-gates.yml
    Then it contains "git rev-parse -q --verify 'HEAD^2'"

  @test:test/workflows/merge-train.test.ts::a_closed_train_carries_the_queue_on::withState_replaces_the_state,_or_appends_it
  Scenario: withState replaces the state, or appends it
    Given a state with no members and queue [[4]]
    Then withState on a body that already has a state replaces it, and it reads back as the new state
    And withState on the body "x" appends it, and it reads back as the new state

  @test:test/workflows/merge-train.test.ts::the_workflow-PR_off_switch_(owner,_2026-11-05)::off:_a_PR_changing_.github/workflows/_is_not_carried
  Scenario: With the switch off, a PR changing .github/workflows/ is not carried
    Given a candidate changing .github/workflows/x.yml
    Then notReady with the switch off gives a reason containing "never carries"

  @test:test/workflows/merge-train.test.ts::the_workflow-PR_off_switch_(owner,_2026-11-05)::on:_it_is_carried;_subscriptions/_never_is
  Scenario: With the switch on, a workflow PR is carried, but subscriptions/ never is
    Then notReady with the switch on finds no reason for a candidate changing .github/workflows/x.yml and src/a.ts
    And it gives a reason containing "never carries" for a candidate changing subscriptions/a/b.json

  @test:test/workflows/merge-train.test.ts::the_workflow-PR_off_switch_(owner,_2026-11-05)::both_workflows_gate_the_switch_on_the_variable_AND_a_bot_token
  Scenario: Both workflows gate the switch on the variable and a bot token
    Given merge-train.yml and sweeps.yml
    Then each sets "MERGE_TRAIN_CARRIES_WORKFLOWS: ${{ vars.MERGE_TRAIN_CARRIES_WORKFLOWS == 'true' && (" ...

  @test:test/workflows/merge-train.test.ts::the_sweep_starts_a_runner_only_when_a_tick_has_something_to_do::an_open_train_whose_checks_still_run_is_no_work
  Scenario: An open train whose checks still run is no work
    Given a stub GitHub with one open train PR, which refuses every write
    Then pending is undefined when one of its checks is still in progress
    And pending is undefined when it has no checks

  @test:test/workflows/merge-train.test.ts::the_sweep_starts_a_runner_only_when_a_tick_has_something_to_do::an_open_train_whose_checks_all_finished_is
  Scenario: An open train whose checks all finished is work
    Given a stub GitHub with one open train PR whose only check completed with failure
    Then pending's answer contains "judge it"

  @test:test/workflows/merge-train.test.ts::one_whole_tick,_against_a_stub_GitHub::a_green_train_lands,_its_member_is_told,_and_the_next_plan_does_not_take_it_again
  Scenario: A green train lands, its member is told, and the next plan does not take it again
    Given a stub GitHub with open train #80 carrying member #11, green checks, and open labelled PRs #11 and #12
    When one tick runs, with a merge that triggers no CI
    Then the train head's status is set to "success"
    And train #80 is merged with merge_method "merge" at its judged head sha
    And code-quality-gates.yml is dispatched on main
    And a comment is posted on #11
    And the next step is "build" with batch [12] and an empty queue
    And the plan's members are just #12

  @test:test/workflows/merge-train.test.ts::a_member_already_on_main_is_neither_carried_nor_ejected::builtMembers_skips_already-contained
  Scenario: builtMembers skips a member already contained in main
    Given a plan with member 1 and a "built" report where member 1 is "already-contained"
    Then builtMembers returns no members and no refused

  @test:test/workflows/merge-train.test.ts::pending_says_why_an_opted-in_PR_waits_(2026-11-06,_#2987)::a_labelled_PR_whose_checks_still_run_is_named,_with_its_reason
  Scenario: A labelled PR whose checks still run is named, with its reason
    Given a stub GitHub with no train and an open PR #33 labelled "merge-train" by a User, whose check is in progress
    When pending runs, collecting the lines it logs
    Then it returns undefined
    And the lines are exactly "#33 waits: its own checks are still running (1)"

  @test:test/workflows/merge-train.test.ts::a_labelled_PR_merged_outside_the_train_is_reported_once_(2026-11-06,_#2951,_#2987)::labelled,_merged_recently,_by_no_train:_a_stray
  Scenario: A PR labelled, merged recently and by no train is a stray
    Given closed PRs: #1 labelled and merged recently, #2 not labelled, #3 closed unmerged, #4 merged too long ago, #5 a train PR, and #6 carried by merged train #50
    Then strayCandidates returns just #1

  @test:test/workflows/merge-train.test.ts::a_labelled_PR_merged_outside_the_train_is_reported_once_(2026-11-06,_#2951,_#2987)::once_told_(marker_comment),_it_is_not_reported_again
  Scenario: Once told by a marker comment, a stray is not reported again
    Given recent labelled strays #1, which has a comment carrying the stray marker, and #7, which does not
    Then strays returns just #7, writing nothing

  @test:test/workflows/merge-train.test.ts::the_train's_checkout_is_shallow;_only_a_build_fetches_history_(2026-11-06:_28_min)::fetch-depth_1,_and_the_build_step_unshallows_before_it_stacks
  Scenario: The train's checkout is shallow, and only the build step unshallows, before it stacks
    Given merge-train.yml
    Then it contains "fetch-depth: 1" and not "fetch-depth: 0"
    And from "id: build" on, "--unshallow" comes before "bun run cat merge:train"
