Feature: folio-staging.yml checks the platform out inside the workspace, and finds a dispatched run's pull request
  These run the workflow's own step scripts, read from
  .github/workflows/folio-staging.yml, with bash -e in a fake runner
  workspace, and read the outputs the step writes to GITHUB_OUTPUT.

  @test:test/workflows/folio-staging-platform.test.ts::${job}:_where_the_platform_is_checked_out_(zdfa)::a_sibling_path_is_checked_out_inside_the_workspace,_then_linked_where_the_folio_names_it
  Scenario Outline: In <job>, a sibling path is checked out inside the workspace, then linked where the folio names it
    Given a fake workspace "repo" inside a fresh temporary directory
    When the <job> job's "Locate the platform" step runs with PLATFORM_DIR "../platform"
    Then it exits 0 with outputs outside "true", checkout ".folio-platform" and present "false"
    And the "Check out the platform" step's path is "${{ steps.platform.outputs.checkout }}"
    When .folio-platform/marker is written with "platform"
    And the "Link the platform where the folio names it" step runs with ABS set to the locate step's abs output
    Then it exits 0
    And ../platform/marker, read from the workspace, holds "platform"

    Examples:
      | job          |
      | stage        |
      | publish-main |

  @test:test/workflows/folio-staging-platform.test.ts::${job}:_where_the_platform_is_checked_out_(zdfa)::a_path_inside_the_workspace_is_checked_out_where_it_is_named,_and_not_linked
  Scenario Outline: In <job>, a path inside the workspace is checked out where it is named, and not linked
    Given a fake workspace
    When the <job> job's "Locate the platform" step runs with PLATFORM_DIR "folio-assistant"
    Then its outputs include outside "false" and checkout "folio-assistant"

    Examples:
      | job          |
      | stage        |
      | publish-main |

  @test:test/workflows/folio-staging-platform.test.ts::${job}:_where_the_platform_is_checked_out_(zdfa)::the_link_step_refuses_to_replace_something_already_at_the_named_path
  Scenario Outline: In <job>, the link step refuses to replace something already at the named path
    Given a fake workspace "repo" whose sibling directory ../platform already exists
    When the <job> job's "Link the platform where the folio names it" step runs with ABS set to that directory
    Then it exits non-zero
    And its output contains "refusing to replace it"
    And no .folio-platform exists in the workspace

    Examples:
      | job          |
      | stage        |
      | publish-main |

  @test:test/workflows/folio-staging-platform.test.ts::folio-staging_passes_render-log_only_paths_it_accepts::every_literal_--path_is_safe
  Scenario: Every literal --path passed to render-log is safe
    Given every literal --path "..." within three lines after a render-log.ts call in folio-staging.yml
    Then there is more than zero of them
    And render-log's isSafeRenderPath accepts every one

  @test:test/workflows/folio-staging-platform.test.ts::stage:_a_dispatched_run_finds_its_pull_request_(ehh6)::a_pull_request_run_keeps_its_own_number_and_base,_and_asks_nothing
  Scenario: A pull_request run keeps its own number and base, and asks nothing
    Given a fake gh that fails whenever it is called
    When the stage job's "Find the pull request" step runs with EVENT_PR "7" and EVENT_BASE "main"
    Then it exits 0
    And its outputs are exactly number "7" and base "main"
    And its output does not contain "could not list"

  @test:test/workflows/folio-staging-platform.test.ts::stage:_a_dispatched_run_finds_its_pull_request_(ehh6)::a_dispatch_takes_the_branch's_one_open_PR_from_this_repository;_a_fork's_branch_of_the_same_name_is_not_it
  Scenario: A dispatch takes the branch's one open PR from this repository, and a fork's branch of the same name is not it
    Given a fake gh listing PR 26 from this repository and PR 99 from a fork, both based on main
    When the stage job's "Find the pull request" step runs with no event PR, for branch "claude/x"
    Then it exits 0
    And its outputs are exactly number "26" and base "main"

  @test:test/workflows/folio-staging-platform.test.ts::stage:_a_dispatched_run_finds_its_pull_request_(ehh6)::no_PR,_several,_or_a_failed_lookup:_tied_to_none,_and_the_run_goes_on
  Scenario: No PR, several, or a failed lookup ties the run to none, and the run goes on
    Given the stage job's "Find the pull request" step, run with no event PR
    When the fake gh lists no PRs
    Then the step has no outputs
    When the fake gh lists two open PRs from this repository
    Then the step has no outputs
    And its output contains "several open pull requests"
    When the fake gh fails
    Then the step exits 0 with no outputs
    And its output contains "could not list pull requests"

  @test:test/workflows/folio-staging-platform.test.ts::stage:_a_dispatched_run_finds_its_pull_request_(ehh6)::every_later_step_reads_the_PR_from_this_step,_never_from_the_event
  Scenario: Every later step reads the PR from this step, never from the event
    Given the stage job's steps after "Find the pull request"
    Then none mentions "github.event.pull_request.number"
    And none mentions "github.event.pull_request.base"
    And none mentions "event_name == 'pull_request'"
    And none mentions "context.issue.number"
    And the "Ingest review comments" and "Comment staging URL on PR" steps run only if "steps.pr.outputs.number != ''"
