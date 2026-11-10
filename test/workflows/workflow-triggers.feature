Feature: Workflow triggers match what their headers claim
  Reads every .yml file in .github/workflows/. A workflow's triggers are the
  keys of its on: block (or its inline on: list); its header is everything
  before on:. A header claim the triggers do not back is allowed only with a
  "TRIGGERS, ACTUAL" note.

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::every_workflow_has_an_`on:`_block_with_at_least_one_trigger
  Scenario: Every workflow has an on: block with at least one trigger
    Given every workflow file
    Then each has at least one trigger

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::a_header_claiming_a_trigger_it_lacks_must_say_so_explicitly
  Scenario: A header claiming a trigger it lacks must say so explicitly
    Given every workflow file
    When its header's unbacked trigger claims are computed
    Then no workflow has unbacked claims without a "TRIGGERS, ACTUAL" note

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::`schedule`_as_a_noun_is_not_a_cron_claim,_but_a_real_one_still_is
  Scenario: schedule as a noun is not a cron claim, but a real one still is
    Given dispatch-only fixtures whose headers say "immunization schedule" and "dosing schedule"
    Then neither has an unbacked claim
    Given dispatch-only fixtures whose headers say "on a schedule", "scheduled", "Nightly", "daily" and "cron"
    Then each has exactly the unbacked claim "schedule"
    Given a fixture "# Runs on a schedule." with a schedule: cron trigger followed by jobs:
    Then its triggers are exactly "schedule"
    And it has no unbacked claim

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::the_note_names_why,_not_just_that
  Scenario: The TRIGGERS, ACTUAL note names why, not just that
    Given every workflow file carrying a "TRIGGERS, ACTUAL" note
    Then the note, from that point on, mentions folio, tools/, platform or "owner's decision"

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::the_workflows_that_DO_fire_on_an_event_are_still_wired
  Scenario: The workflows that do fire on an event are still wired
    Given the pinned map of live workflows and their triggers
      | workflow                  | triggers           |
      | code-quality-gates.yml    | pull_request, push |
      | docs-site.yml             | push               |
      | ci-health.yml             | schedule, workflow_run |
      | jsonld-gen-check.yml      | pull_request, push |
      | feature-staging.yml       | pull_request       |
      | sweeps.yml                | schedule           |
      | health-check.yml          | schedule           |
      | pr-checks-present.yml     | schedule           |
      | upstream-pins.yml         | schedule           |
    Then each workflow has each of its listed triggers

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::a_header_claiming_it_fires_on_a_failure_must_have_`workflow_run`
  Scenario: A header claiming it fires on a failure must have workflow_run
    Given dispatch-only fixtures whose headers say "on the failure itself", "on the failing run", "when a gating run completes" and "A workflow_run trigger"
    Then each has exactly the unbacked claim "workflow_run"
    Given dispatch-only fixtures whose headers say "the job fails", "The step completes" and "A failure here is reported"
    Then none has an unbacked claim
    Given a fixture "# Fires on the failure itself." with a workflow_run trigger followed by jobs:
    Then its triggers are exactly "workflow_run"
    And it has no unbacked claim

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::every_`workflow_run`_names_workflows_that_actually_exist,_by_their_declared_`name:`
  Scenario: Every workflow_run names workflows that actually exist, by their declared name
    Given the declared name: of every workflow file
    And every workflow with an on.workflow_run block
    Then its inline workflows: list can be parsed
    And every name in it is a declared workflow name

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::a_workflow_named_by_`workflow_run`_can_actually_produce_runs_on_the_default_branch
  Scenario: A workflow named by workflow_run can actually produce runs on the default branch
    Given every workflow_run whose branches filter, if any, admits main
    When each workflow name it waits on is resolved to its file
    Then every resolved workflow has a push trigger

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::`ci-health.yml`'s_red_conclusions_are_exactly_the_ones_this_repo_calls_red
  Scenario: ci-health.yml's red conclusions are exactly the ones this repository calls red
    Given GitHub's run conclusions, as declared in the test
    And NOT_A_VERDICT from cat-harness-tools' ci-health
    When the expected red set is the conclusions other than success and not in NOT_A_VERDICT
    Then the conclusions listed in ci-health.yml's fromJSON('[...]') equal that set

  @test:test/workflows/workflow-triggers.test.ts::workflow_triggers_match_what_their_headers_claim::no_workflow_references_PR_context_while_unable_to_receive_a_PR_event
  Scenario: No workflow references PR context while unable to receive a PR event
    Given every workflow without a pull_request, pull_request_target or workflow_call trigger
    Then none mentions github.event.pull_request unless it carries a "TRIGGERS, ACTUAL" note
