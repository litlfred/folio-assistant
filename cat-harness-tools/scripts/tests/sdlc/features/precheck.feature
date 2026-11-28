# scripts/precheck.ts, the pre-push precheck (owner, card 2026-11-18): only the fast checks whose
# inputs the push changed, nothing when nothing relevant changed, and never in the way of a push it
# cannot judge. Run against a throwaway repository with stub bun and tsc.
# Each Scenario names the test that executes it.
Feature: A push runs only the fast checks its own changes can break

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_plan_follows_what_the_push_changed::nothing_it_checks:_no_check
  Scenario: Nothing it checks: no check
    Given the precheck
    Then nothing it checks: no check

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_plan_follows_what_the_push_changed::the_lock_or_the_config:_lock:coherence:check_(agreement_and_freshness)_and_mount:remote:check
  Scenario: The lock or the config: lock:coherence:check (agreement and freshness) and mount:remote:check
    Given the precheck
    Then the lock or the config: lock:coherence:check (agreement and freshness) and mount:remote:check

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_plan_follows_what_the_push_changed::.github/workflows:_check:workflow-pins_only
  Scenario: .github/workflows: check:workflow-pins only
    Given the precheck
    Then .github/workflows: check:workflow-pins only

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_plan_follows_what_the_push_changed::TypeScript:_the_typecheck,_only_with_a_tsc_to_run_it
  Scenario: TypeScript: the typecheck, only with a tsc to run it
    Given the precheck
    Then TypeScript: the typecheck, only with a tsc to run it

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_plan_follows_what_the_push_changed::git's_pre-push_stdin_is_read_four_fields_a_line
  Scenario: Git's pre-push stdin is read four fields a line
    Given the precheck
    Then git's pre-push stdin is read four fields a line

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_plan_follows_what_the_push_changed::an_exit_of_0_passes,_2_or_a_timeout_is_undetermined,_any_other_is_red
  Scenario: An exit of 0 passes, 2 or a timeout is undetermined, any other is red
    Given the precheck
    Then an exit of 0 passes, 2 or a timeout is undetermined, any other is red

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::a_push_that_changes_nothing_it_checks_does_nothing
  Scenario: A push that changes nothing it checks does nothing
    Given the precheck
    Then a push that changes nothing it checks does nothing

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::a_lock_change_runs_the_lock_and_mount_checks,_and_passes_when_they_pass
  Scenario: A lock change runs the lock and mount checks, and passes when they pass
    Given the precheck
    Then a lock change runs the lock and mount checks, and passes when they pass

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::a_red_check_refuses_the_push
  Scenario: A red check refuses the push
    Given the precheck
    Then a red check refuses the push

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::a_check_that_could_not_determine_(exit_2)_or_ran_past_its_time_lets_the_push_through
  Scenario: A check that could not determine (exit 2) or ran past its time lets the push through
    Given the precheck
    Then a check that could not determine (exit 2) or ran past its time lets the push through

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::a_TypeScript_change_runs_the_checkout's_own_tsc;_a_red_typecheck_refuses
  Scenario: A TypeScript change runs the checkout's own tsc; a red typecheck refuses
    Given the precheck
    Then a TypeScript change runs the checkout's own tsc; a red typecheck refuses

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::no_tsc_in_node_modules:_the_typecheck_is_left_to_CI,_nothing_is_installed
  Scenario: No tsc in node_modules: the typecheck is left to CI, nothing is installed
    Given the precheck
    Then no tsc in node_modules: the typecheck is left to CI, nothing is installed

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::a_checkout_that_is_not_set_up_(no_cat_runner,_no_node_modules)_lets_the_push_through_and_runs_nothing
  Scenario: A checkout that is not set up (no cat runner, no node_modules) lets the push through and runs nothing
    Given the precheck
    Then a checkout that is not set up (no cat runner, no node_modules) lets the push through and runs nothing

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::tracked_changes_not_committed:_the_checks_would_judge_another_tree,_so_none_runs
  Scenario: Tracked changes not committed: the checks would judge another tree, so none runs
    Given the precheck
    Then tracked changes not committed: the checks would judge another tree, so none runs

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::CAT_PRECHECK=0_turns_it_off
  Scenario: CAT_PRECHECK=0 turns it off
    Given the precheck
    Then CAT_PRECHECK=0 turns it off

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::as_git's_hook:_the_pushed_refs_on_stdin,_diffed_against_the_remote's_tip
  Scenario: As git's hook: the pushed refs on stdin, diffed against the remote's tip
    Given the precheck
    Then as git's hook: the pushed refs on stdin, diffed against the remote's tip

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_installed_as_git's_pre-push_hook::the_hook_runs_the_precheck_before_the_gates,_and_a_red_precheck_stops_the_push
  Scenario: The hook runs the precheck before the gates, and a red precheck stops the push
    Given the precheck
    Then the hook runs the precheck before the gates, and a red precheck stops the push

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_installed_as_git's_pre-push_hook::session_start_installs_it_where_there_is_none,_and_says_so_once
  Scenario: Session start installs it where there is none, and says so once
    Given the precheck
    Then session start installs it where there is none, and says so once

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_installed_as_git's_pre-push_hook::session_start_updates_our_older_hook,_and_leaves_anyone_else's_alone
  Scenario: Session start updates our older hook, and leaves anyone else's alone
    Given the precheck
    Then session start updates our older hook, and leaves anyone else's alone

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_plan_follows_what_the_push_changed::an_advisory_check_that_exits_1_is_advisory,_never_red
  Scenario: An advisory check that exits 1 is advisory, never red
    Given the precheck
    Then an advisory check that exits 1 is advisory, never red

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_advisory_lint_checks_follow_the_languages_the_push_changed::each_language_runs_its_linter_on_its_own_changed_files_only,_and_every_check_is_advisory
  Scenario: Each language runs its linter on its own changed files only, and every check is advisory
    Given the precheck
    Then each language runs its linter on its own changed files only, and every check is advisory

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_advisory_lint_checks_follow_the_languages_the_push_changed::nothing_it_lints:_no_lint_check_and_no_note
  Scenario: Nothing it lints: no lint check and no note
    Given the precheck
    Then nothing it lints: no lint check and no note

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_advisory_lint_checks_follow_the_languages_the_push_changed::a_tool_that_is_not_installed_is_skipped_with_a_note,_never_fetched
  Scenario: A tool that is not installed is skipped with a note, never fetched
    Given the precheck
    Then a tool that is not installed is skipped with a note, never fetched

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_advisory_lint_checks_follow_the_languages_the_push_changed::actionlint_must_be_1.7.12_or_later
  Scenario: Actionlint must be 1.7.12 or later
    Given the precheck
    Then actionlint must be 1.7.12 or later

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_the_advisory_lint_checks_follow_the_languages_the_push_changed::a_.rs_file's_crate_is_the_nearest_Cargo.toml_above_it
  Scenario: A .rs file's crate is the nearest Cargo.toml above it
    Given the precheck
    Then a .rs file's crate is the nearest Cargo.toml above it

  @test:scripts/tests/sdlc/precheck.test.ts::precheck:_run()_in_a_repository::a_red_lint_finding_is_printed_and_lets_the_push_through
  Scenario: A red lint finding is printed and lets the push through
    Given the precheck
    Then a red lint finding is printed and lets the push through
