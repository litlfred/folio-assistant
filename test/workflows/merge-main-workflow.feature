Feature: merge-main.yml fires on the PRs it exists for, merges with main's tool, and keeps its write token away from the PR's tree
  Reads this repository's .github/workflows/merge-main.yml: its triggers,
  the select, merge and notify jobs, and the order, conditions, env and run
  text of their steps.

  @test:test/workflows/merge-main-workflow.test.ts::merge-main.yml_triggers::the_label_trigger_is_pull_request_target,_which_fires_on_a_conflicted_PR
  Scenario: The label trigger is pull_request_target, which fires on a conflicted PR
    Given the triggers of merge-main.yml
    Then pull_request_target fires on exactly "labeled" and "ready_for_review"
    And there is no pull_request trigger

  @test:test/workflows/merge-main-workflow.test.ts::merge-main.yml_triggers::never_on_synchronize:_its_own_push_to_a_PR_branch_must_not_re-fire_it
  Scenario: It never fires on synchronize, so its own push to a PR branch does not re-fire it
    Given the triggers of merge-main.yml
    Then no trigger's types include "synchronize"

  @test:test/workflows/merge-main-workflow.test.ts::merge-main.yml_triggers::a_dispatch_with_no_PR_is_allowed,_and_sweeps
  Scenario: A dispatch with no PR is allowed, and sweeps
    Given the workflow_dispatch input "pr"
    Then it is not required
    And the select job's script, on empty candidates, sets candidates from "gh api"

  @test:test/workflows/merge-main-workflow.test.ts::merge-main.yml_triggers::the_job_conditions_name_the_trigger_that_exists
  Scenario: The job conditions name the trigger that exists
    Given the select job
    Then its if contains "pull_request_target"

  @test:test/workflows/merge-main-workflow.test.ts::a_draft_gets_no_merge_and_no_dispatch_(bean_dft1)::select_skips_a_draft_PR
  Scenario: select skips a draft PR
    Given the select job's script
    Then it reads ".draft" with jq, then logs "skip #$n: draft" and continues

  @test:test/workflows/merge-main-workflow.test.ts::a_draft_gets_no_merge_and_no_dispatch_(bean_dft1)::a_ready_for_review_event_runs_select_only_for_a_labelled_PR
  Scenario: A ready_for_review event runs select only for a labelled PR
    Given the select job
    Then its if contains "github.event.action == 'ready_for_review'"
    And its if contains "contains(github.event.pull_request.labels.*.name, 'merge-main')"

  @test:test/workflows/merge-main-workflow.test.ts::a_sweep_merges_only_a_conflicted_PR_(2026-11-05)::the_names_a_person_gave_are_kept_apart_from_the_swept_list
  Scenario: The names a person gave are kept apart from the swept list
    Given the select job's script
    Then it sets candidates_named="$candidates" before the case on "$candidates"

  @test:test/workflows/merge-main-workflow.test.ts::a_sweep_merges_only_a_conflicted_PR_(2026-11-05)::on_a_sweep,_a_PR_that_is_not_conflicted_is_skipped,_after_the_behind_check
  Scenario: On a sweep, a PR that is not conflicted is skipped, after the behind check
    Given the select job's script
    Then after "already contains main", when candidates_named is empty, it reads .mergeable
    And when mergeable is not false it logs "merges cleanly" and continues, before "pick #$n"

  @test:test/workflows/merge-main-workflow.test.ts::a_sweep_merges_only_a_conflicted_PR_(2026-11-05)::an_unknown_mergeability_is_asked_again_once,_never_read_as_conflicted
  Scenario: An unknown mergeability is asked again once, never read as conflicted
    Given the select job's script
    Then when mergeable is null it asks gh api "repos/$REPO/pulls/$n" for .mergeable again

  @test:test/workflows/merge-main-workflow.test.ts::the_write_token_never_meets_a_fork::select_keeps_only_same-repository_heads
  Scenario: select keeps only same-repository heads
    Given the select job's script
    Then it contains ".head.repo.full_name == .base.repo.full_name"

  @test:test/workflows/merge-main-workflow.test.ts::the_write_token_never_meets_a_fork::the_merge_job_re-checks_it_BEFORE_its_checkout_step
  Scenario: The merge job re-checks the same-repository head before its checkout step
    Given the merge job's steps
    Then a step checks ".head.repo.full_name == .base.repo.full_name"
    And the checkout step comes after it
    And that step's run contains "exit 1"

  @test:test/workflows/merge-main-workflow.test.ts::the_merge_runs_main's_tool,_and_fails_loudly::main's_merge-base.ts_is_checked_out_outside_the_tree,_before_the_merge
  Scenario: main's merge-base.ts is checked out outside the tree, before the merge
    Given the merge job's steps
    Then a step runs 'worktree add --detach "$RUNNER_TEMP/tool" origin/main'
    And the step with id "merge" comes after it

  @test:test/workflows/merge-main-workflow.test.ts::the_merge_runs_main's_tool,_and_fails_loudly::the_merge_step_runs_that_copy_against_the_PR_with_--root,_never_the_PR's_script
  Scenario: The merge step runs that copy against the PR with --root, never the PR's script
    Given the merge job's steps
    Then the merge step runs 'bun run "$RUNNER_TEMP/tool/cat-harness-tools/scripts/merge-base.ts" --root "$GITHUB_WORKSPACE"'
    And no step runs "bun run cat merge:main"

  @test:test/workflows/merge-main-workflow.test.ts::the_merge_runs_main's_tool,_and_fails_loudly::a_non-zero_exit_that_is_not_a_refusal_fails_the_job,_after_the_comment
  Scenario: A non-zero exit that is not a refusal fails the job, after the comment
    Given the merge job's steps
    Then the step conditioned on "refused != 'true'" comes after the "Comment once" step
    And it runs "exit 1"
    And the merge step's run contains 'echo "refused=true"'

  @test:test/workflows/merge-main-workflow.test.ts::a_rejected_fast-forward_is_an_expected_race,_not_a_red_check::the_push_step_exits_0_when_the_branch_moved,_and_says_so
  Scenario: The push step exits 0 when the branch moved, and says so
    Given the merge job's step with id "push"
    Then its run contains 'echo "rejected=true"'
    And when "$now" is set and differs from "$SELECTED" it exits 0

  @test:test/workflows/merge-main-workflow.test.ts::a_rejected_fast-forward_is_an_expected_race,_not_a_red_check::any_other_push_failure_still_fails
  Scenario: Any other push failure still fails
    Given the push step
    Then "push failed although the branch did not move" is followed by "exit 1"

  @test:test/workflows/merge-main-workflow.test.ts::a_rejected_fast-forward_is_an_expected_race,_not_a_red_check::nothing_downstream_reads_the_push_step's_OUTCOME_as_'pushed'
  Scenario: Nothing downstream reads the push step's outcome as "pushed"
    Given the merge job's steps
    Then none mentions "steps.push.outcome == 'success'"

  @test:test/workflows/merge-main-workflow.test.ts::a_push_refusal_is_read_from_stderr,_not_guessed::(a)_stderr_is_captured_and_the_workflows_refusal_is_recognised_before_the_branch-moved_check
  Scenario: stderr is captured, and the workflows refusal is recognised before the branch-moved check
    Given the push step's run
    Then it contains '2> "$RUNNER_TEMP/push.err"'
    And "refusing to allow a GitHub App to create or update workflow" comes before 'echo "rejected=true"'
    And it contains 'echo "blocked=workflows"'

  @test:test/workflows/merge-main-workflow.test.ts::a_push_refusal_is_read_from_stderr,_not_guessed::the_dispatch_fallback_runs_every_gating_workflow,_JSON-LD_drift_included
  Scenario: The dispatch fallback runs every gating workflow, JSON-LD drift included
    Given the "Have CI judge the merge commit" step
    Then its run contains "code-quality-gates.yml jsonld-gen-check.yml"

  @test:test/workflows/merge-main-workflow.test.ts::a_cancelled_or_unfinished_run_is_not_an_error_(#1854)::the_workflow_hands_the_job_status_to_main's_copy_of_the_composer
  Scenario: The workflow hands the job status to main's copy of the comment composer
    Given the "Comment once" step
    Then its env sets JOB_STATUS to "${{ job.status }}"
    And its run contains 'bun run "$RUNNER_TEMP/tool/cat-harness-tools/scripts/merge-main-comment.ts" --log "$RUNNER_TEMP/merge.log"'
    And its "= leave ]" check comes before "gh api -X PATCH"
    And its run does not contain "**Error**"

  @test:test/workflows/merge-main-workflow.test.ts::a_cancelled_or_unfinished_run_is_not_an_error_(#1854)::a_cancelled_merge_step_never_trips_the_failure_step
  Scenario: A cancelled merge step never trips the failure step
    Given the step conditioned on "refused != 'true'"
    Then its if contains "steps.merge.outcome == 'success'"

  @test:test/workflows/merge-main-workflow.test.ts::one_bad_member_no_longer_reds_the_whole_run_(bean_`03nl`)::the_matrix_member_allows_its_own_failure_to_be_ignored_by_the_RUN
  Scenario: The matrix member allows its own failure to be ignored by the run
    Given the merge job
    Then it continues on error

  @test:test/workflows/merge-main-workflow.test.ts::one_bad_member_no_longer_reds_the_whole_run_(bean_`03nl`)::...and_still_fails,_so_it_is_red_and_findable_rather_than_swallowed
  Scenario: The member still fails, so it is red and findable rather than swallowed
    Given the merge job's step conditioned on "refused != 'true'"
    Then its run contains "exit 1"

  @test:test/workflows/merge-main-workflow.test.ts::one_bad_member_no_longer_reds_the_whole_run_(bean_`03nl`)::the_selection_job_stays_loud:_no_continue-on-error_anywhere_on_it
  Scenario: The selection job stays loud, with no continue-on-error on it
    Given the select job
    Then it does not set continue-on-error

  @test:test/workflows/merge-main-workflow.test.ts::one_bad_member_no_longer_reds_the_whole_run_(bean_`03nl`)::one_job,_and_only_one,_decides_the_run's_colour
  Scenario: One job, and only one, decides the run's colour
    Given the notify job
    Then it exists and needs exactly select and merge
    And its if contains "!cancelled()" and not "always()"
    And it does not set continue-on-error

  @test:test/workflows/merge-main-workflow.test.ts::one_bad_member_no_longer_reds_the_whole_run_(bean_`03nl`)::every_member_reports,_whatever_happened_to_it,_and_hands_the_verdict_over
  Scenario: Every member reports, whatever happened to it, and hands the verdict over
    Given the merge job's steps
    Then the "Record what this member found" step comes after the failure step, with if "always()"
    And the upload-artifact step comes after it, with if "always()"
    And the record step's run contains '"verdict":"undetermined","notify":true'
    And it contains 'grep -q -- "--verdict" "$tool"'

  @test:test/workflows/merge-main-workflow.test.ts::one_bad_member_no_longer_reds_the_whole_run_(bean_`03nl`)::the_aggregator_runs_main's_copy,_with_the_remote_mounts_its_checkout_needs
  Scenario: The aggregator runs main's copy, with the remote mounts its checkout needs
    Given the notify job's steps
    Then a step runs mount-from-lock.sh or mount-from-lock.ts
    And setup-bun is given bun-version "1.4.4"
    And the "Decide whether this run" step runs "cat-harness-tools/scripts/merge-main-comment.ts --aggregate verdicts"
    And the download-artifact step continues on error

  @test:test/workflows/merge-main-workflow.test.ts::the_signature_is_read_before_it_is_overwritten::the_previous_signature_is_read_in_a_step_ahead_of_the_comment_step
  Scenario: The previous signature is read in a step ahead of the comment step
    Given the merge job's steps
    Then the "Read the failure this PR's comment already reports" step comes before the "Comment once" step
    And its run mentions "merge-main-signature"
    And it writes 'echo "signature=$sig" >> "$GITHUB_OUTPUT"'

  @test:test/workflows/merge-main-workflow.test.ts::the_signature_is_read_before_it_is_overwritten::the_comment_step_keeps_its_plan,_and_knows_the_PR's_head
  Scenario: The comment step keeps its plan, and knows the PR's head
    Given the "Comment once" step
    Then its run contains '--plan-out "$RUNNER_TEMP/plan.json"'
    And its env sets HEAD_SHA to "${{ steps.pr.outputs.sha }}"

  @test:test/workflows/merge-main-workflow.test.ts::the_signature_is_read_before_it_is_overwritten::the_verdict_step_reads_that_plan_and_that_previous_signature
  Scenario: The verdict step reads that plan and that previous signature
    Given the "Record what this member found" step
    Then its run contains '--verdict "$out" --plan "$RUNNER_TEMP/plan.json"'
    And its env sets PREVIOUS_SIGNATURE to "${{ steps.prev.outputs.signature }}"
    And its env sets HEAD_CHECK to "${{ steps.head.outcome }}"

  @test:test/workflows/merge-main-workflow.test.ts::the_signature_is_read_before_it_is_overwritten::the_head-moved_race_has_an_id,_so_the_verdict_can_recognise_it
  Scenario: The head-moved race has an id, so the verdict can recognise it
    Given the "Check the branch did not move since selection" step
    Then its id is "head"

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::the_PR_checkout_persists_no_credential_and_is_given_no_push_token
  Scenario: The PR checkout persists no credential and is given no push token
    Given the merge job's checkout step
    Then persist-credentials is false
    And no token is given to it

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::no_token_is_set_for_the_whole_job
  Scenario: No token is set for the whole job
    Given the merge job's env
    Then no value names "secrets." or "steps.bot"

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::main's_tool_is_checked_out_before_anything_runs_in_the_PR's_tree
  Scenario: main's tool is checked out before anything runs in the PR's tree
    Given the merge job's steps
    Then the tool worktree step comes after the checkout
    And no step between them runs mount-from-lock, bun install, "bun run cat" or state-mount

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::between_the_checkout_and_the_merge,_no_step_runs_the_PR_tree's_own_scripts
  Scenario: Between the checkout and the merge, no step runs the PR tree's own scripts
    Given the merge job's steps between the checkout and the merge, other than the tool step
    Then none runs "bun run cat" or the PR tree's own .github/mount-from-lock.sh
    And any mount-from-lock.sh call is '"$RUNNER_TEMP/tool/.github/mount-from-lock.sh" --root "$GITHUB_WORKSPACE"'
    And any bun install passes "--ignore-scripts"
    And any state-mount.ts call is '"$RUNNER_TEMP/tool/cat-harness-tools/scripts/state-mount.ts"'
    And the tool step runs 'cd "$RUNNER_TEMP/tool"' before mount-from-lock.sh

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::the_PR_tree_is_still_mounted,_installed_and_state-mounted_before_the_merge
  Scenario: The PR tree is still mounted, installed and state-mounted before the merge
    Given the merge job's steps after the tool step and before the merge
    Then they run 'bash "$RUNNER_TEMP/tool/.github/mount-from-lock.sh" --root "$GITHUB_WORKSPACE"'
    And they run "bun install --frozen-lockfile --ignore-scripts"
    And they run 'bun "$RUNNER_TEMP/tool/cat-harness-tools/scripts/state-mount.ts"'

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::the_App_token_is_minted_after_the_merge,_only_when_there_is_one_to_push
  Scenario: The App token is minted after the merge, only when there is one to push
    Given the merge job's create-github-app-token step
    Then it comes after the merge step and before the push step
    And its if contains "steps.merge.outputs.merged == 'true'"

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::only_the_push_step_is_handed_a_push_token,_and_it_never_lands_in_.git/config
  Scenario: Only the push step is handed a push token, and it never lands in .git/config
    Given the merge job's steps
    Then no step but the push step has env containing "steps.bot.outputs.token ||" or "PUSH_BRANCH_TRIGGERING_CI ||"
    And the push step's PUSH_TOKEN names "steps.bot.outputs.token"
    And the push step runs "GIT_CONFIG_KEY_1=core.hooksPath GIT_CONFIG_VALUE_1=/dev/null"
    And no step writes an extraheader or x-access-token with git config or git remote set-url

  @test:test/workflows/merge-main-workflow.test.ts::pre-merge_steps_run_from_main's_tree,_and_the_token_reaches_only_the_push::steps_that_run_before_the_merge_hold_no_GitHub_token_at_all
  Scenario: Steps that run before the merge hold no GitHub token at all
    Given the merge job's steps after the checkout, up to and including the merge
    Then none has env naming GH_TOKEN, GITHUB_TOKEN or "secrets."
