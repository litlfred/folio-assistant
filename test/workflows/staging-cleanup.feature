Feature: The staging deletion path: the dispatch cleanup's guards, its preflight, and the close-event gate
  feature-staging.yml is parsed, never run, because running it would remove
  a review preview. The scenarios assert which step runs, when, and with
  which env bindings.

  @test:test/workflows/staging-cleanup.test.ts::the_dispatch_cleanup_exists_and_is_reachable::is_a_job_of_its_own,_so_the_label_path_is_untouched
  Scenario: The dispatch cleanup is a job of its own, so the label path is untouched
    Given the jobs of feature-staging.yml
    Then a cleanup-dispatch job exists
    And the cleanup job's if is "github.event.action == 'closed'"

  @test:test/workflows/staging-cleanup.test.ts::the_dispatch_cleanup_exists_and_is_reachable::takes_a_slug_and_a_confirmation,_both_optional_so_an_ordinary_staging_dispatch_still_works
  Scenario: It takes a slug and a confirmation, both optional so an ordinary staging dispatch still works
    Given the workflow_dispatch inputs
    Then they include cleanup_slug and cleanup_confirm
    And each of the two is not required and defaults to ""

  @test:test/workflows/staging-cleanup.test.ts::the_dispatch_cleanup_exists_and_is_reachable::runs_ONLY_on_a_dispatch_that_named_a_slug
  Scenario: It runs only on a dispatch that named a slug
    Given the cleanup-dispatch job
    Then its if is "github.event_name == 'workflow_dispatch' && inputs.cleanup_slug != ''"

  @test:test/workflows/staging-cleanup.test.ts::the_dispatch_cleanup_exists_and_is_reachable::does_not_also_deploy_a_preview_while_being_asked_to_remove_one
  Scenario: It does not also deploy a preview while being asked to remove one
    Given the stage job
    Then its if contains "inputs.cleanup_slug == ''"

  @test:test/workflows/staging-cleanup.test.ts::the_dispatch_cleanup_exists_and_is_reachable::gives_a_dispatched_cleanup_its_own_concurrency_group,_so_two_of_them_do_not_cancel_each_other
  Scenario: A dispatched cleanup gets its own concurrency group, so two do not cancel each other
    Given the text of feature-staging.yml
    Then it contains "group: staging-${{ inputs.verify_pr != '' && 'verify-' || '' }}${{ github.event.pull_request.head.ref || inputs.cleanup_slug || inputs.branch || github.ref_name }}"

  @test:test/workflows/staging-cleanup.test.ts::the_guard::binds_both_inputs_to_`env:`_rather_than_interpolating_them_into_the_script
  Scenario: The guard binds both inputs to env rather than interpolating them into the script
    Given the "Validate the slug and the confirmation" step
    Then its env sets CLEANUP_SLUG to "${{ inputs.cleanup_slug }}" and CLEANUP_CONFIRM to "${{ inputs.cleanup_confirm }}"
    And its run contains 'SLUG="$CLEANUP_SLUG"'
    And its run does not contain "${{ inputs.cleanup_slug }}"

  @test:test/workflows/staging-cleanup.test.ts::the_guard::refuses_a_slug_that_is_a_path,_or_that_carries_anything_the_slug_pipeline_cannot_produce
  Scenario: The guard refuses a slug that is a path, or that carries anything the slug pipeline cannot produce
    Given the "Validate the slug and the confirmation" step
    Then its run contains the case pattern '""|.|..|_retired)'
    And its run contains the case pattern "*[!A-Za-z0-9._-]*)"

  @test:test/workflows/staging-cleanup.test.ts::the_guard::requires_the_confirmation_to_REPEAT_the_slug,_so_it_names_the_artefact_it_confirms
  Scenario: The guard requires the confirmation to repeat the slug
    Given the "Validate the slug and the confirmation" step
    Then its run contains 'if [ "$CLEANUP_CONFIRM" != "$SLUG" ]; then'
    And its run contains "exit 1"
    And its run contains "Nothing was removed"

  @test:test/workflows/staging-cleanup.test.ts::the_guard::removes_with_`rm_-rf_--`_and_a_quoted_variable,_never_an_interpolated_one
  Scenario: It removes with rm -rf -- and a quoted variable, never an interpolated one
    Given the "Remove the preview" step
    Then its run contains 'rm -rf -- "$PD/$CLEANUP_SLUG"'
    And its env sets CLEANUP_SLUG to "${{ steps.guard.outputs.slug }}"

  @test:test/workflows/staging-cleanup.test.ts::the_preflight::runs_BEFORE_the_publish_branch_is_even_checked_out,_let_alone_removed_from
  Scenario: The preflight runs before the preview is removed, and nothing in the job continues on error
    Given the steps of the cleanup-dispatch job
    Then a step named "Refuse to remove a preview that is still in use" exists
    And the "Remove the preview" step comes after it
    And the text from "cleanup-dispatch:" on does not contain "continue-on-error"

  @test:test/workflows/staging-cleanup.test.ts::the_preflight::calls_the_ONE_implementation_of_liveness,_not_a_second_one_written_in_bash
  Scenario: The preflight calls the one implementation of liveness, not a second one written in bash
    Given the "Refuse to remove" step
    Then its run contains "scripts/staging-cleanup-preflight.ts"

  @test:test/workflows/staging-cleanup.test.ts::the_preflight::checks_out_the_full_history,_without_which_the_preflight_refuses_every_dispatch
  Scenario: The job checks out the full history, without which the preflight refuses every dispatch
    Given the cleanup-dispatch step that checks out to path "source"
    Then its fetch-depth is 0

  @test:test/workflows/staging-cleanup.test.ts::the_preflight::records_what_it_removed,_with_the_size_and_the_run_that_did_it
  Scenario: It records what it removed, with the size and the run that did it
    Given the "Remove the preview" step
    Then its run contains "du -sh"
    And its run contains "$RUN_URL"
    And its run contains "Dispatched by $DISPATCHED_BY"

  @test:test/workflows/staging-cleanup.test.ts::the_preflight::protects_the_gh-pages_push_against_the_race,_like_every_other_writer_of_that_ref
  Scenario: It protects the gh-pages push against the race, like every other writer of that ref
    Given the "Remove the preview" step
    Then its run contains "for attempt in 1 2 3"
    And its run contains "git pull --rebase origin gh-pages"

  @test:test/workflows/staging-cleanup.test.ts::the_close-event_gate_—_merged_removes,_closed-unmerged_does_not::reads_`merged`_off_the_event,_and_binds_it_to_env_rather_than_interpolating
  Scenario: The close-event gate reads merged off the event, and binds it to env rather than interpolating
    Given the cleanup job's step with id "check"
    Then its env sets MERGED to "${{ github.event.pull_request.merged }}"
    And its run contains '"$MERGED"'

  @test:test/workflows/staging-cleanup.test.ts::the_close-event_gate_—_merged_removes,_closed-unmerged_does_not::a_merged_PR_confirms_WITHOUT_a_label
  Scenario: A merged PR confirms without a label
    Given the cleanup job's "check" step, from 'if [ "$MERGED" = "true" ]' up to its elif
    Then that branch contains "confirmed=true"
    And it does not mention LABELS

  @test:test/workflows/staging-cleanup.test.ts::the_close-event_gate_—_merged_removes,_closed-unmerged_does_not::closed-unmerged_still_requires_the_label_—_the_last-copy_case
  Scenario: Closed-unmerged still requires the label, the last-copy case
    Given the cleanup job's "check" step, from its elif on
    Then it contains "staging:cleanup"
    And it contains "confirmed=false"

  @test:test/workflows/staging-cleanup.test.ts::the_close-event_gate_—_merged_removes,_closed-unmerged_does_not::records_WHICH_rule_removed_it,_so_a_reader_can_tell_merge_from_label
  Scenario: It records which rule removed the preview, so a reader can tell merge from label
    Given the cleanup job's "check" step
    Then its run contains "reason=merged", "reason=labelled" and "reason=closed-unmerged-and-unlabelled"

  @test:test/workflows/staging-cleanup.test.ts::the_close-event_gate_—_merged_removes,_closed-unmerged_does_not::still_fires_only_on_close_—_it_has_not_been_widened_to_reach_an_OPEN_PR
  Scenario: It still fires only on close, and has not been widened to reach an open PR
    Given the cleanup job
    Then its if contains "github.event.action == 'closed'"

  @test:test/workflows/staging-cleanup.test.ts::both_removal_paths_can_load_the_platform_they_run::%s_mounts_the_platform's_layers_from_its_lock_after_checking_it_out
  Scenario Outline: <job> mounts the platform's layers from its lock after checking it out
    Given the steps of the <job> job
    Then one of them uses actions/checkout with path "source"
    And a later step runs mount-from-lock.sh or mount-from-lock.ts with --root source

    Examples:
      | job              |
      | cleanup          |
      | cleanup-dispatch |
