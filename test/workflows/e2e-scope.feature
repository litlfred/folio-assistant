Feature: The e2e shards run on a PR push unless every changed file is one they cannot read
  Runs the e2e-scope job's own scripts, read out of
  .github/workflows/code-quality-gates.yml, with bash -e and the job's INERT
  and ALWAYS env. The "scope" step is run against a stand-in gh printing a
  chosen file listing ("F" lines are files, "P" lines previous names of
  renames); the "dispatch-scope" step in a git repository whose origin/main
  is one commit. Each run must exit 0, and its affected output is read.

  @test:test/workflows/e2e-scope.test.ts::e2e-scope_skips_the_shards_only_when_every_changed_file_is_inert::other_workflows_and_their_tests_only:_skipped
  Scenario: Other workflows and their tests only are skipped
    When the scope step runs on a listing of .github/workflows/docs-site.yml and test/workflows/merge-main-workflow.test.ts
    Then affected is "false"
    When the scope step runs on a listing of .github/actions/lake-cache-restore/action.yml, .github/dependabot.yml and .mcp.json
    Then affected is "false"

  @test:test/workflows/e2e-scope.test.ts::e2e-scope_skips_the_shards_only_when_every_changed_file_is_inert::%s_runs_them
  Scenario Outline: <why> runs them
    When the scope step runs on a listing of .github/workflows/docs-site.yml and <path>
    Then affected is "true"

    Examples:
      | why                                    | path                                     |
      | the pins                               | index.lock.json                          |
      | the instance config                    | index.config.json                        |
      | this workflow, which runs the shards   | .github/workflows/code-quality-gates.yml |
      | the mount script                       | .github/mount-from-lock.sh               |
      | the dependencies                       | bun.lock                                 |
      | the manifest                           | package.json                             |
      | an upload the library pages read       | uploads/x/README.md                      |
      | a skill kg-export reads                | .claude/skills/local/todo-manager.md     |
      | a root document                        | README.md                                |
      | a path nobody listed                   | src/new-thing.ts                         |
      | a file nested under test/workflows     | test/workflows/fixtures/x.json           |

  @test:test/workflows/e2e-scope.test.ts::e2e-scope_skips_the_shards_only_when_every_changed_file_is_inert::a_rename_out_of_a_path_that_matters_runs_them
  Scenario: A rename out of a path that matters runs them
    When the scope step runs on a listing of the file .github/workflows/x.yml with previous name index.lock.json
    Then affected is "true"

  @test:test/workflows/e2e-scope.test.ts::e2e-scope_skips_the_shards_only_when_every_changed_file_is_inert::a_listing_that_cannot_be_fetched,_is_empty,_or_is_short_of_the_PR's_count_runs_them
  Scenario: A listing that cannot be fetched, is empty, or is short of the PR's count runs them
    When the scope step runs with a gh that fails
    Then affected is "true"
    When the scope step runs on an empty listing
    Then affected is "true"
    When the scope step runs on a listing of one inert file while the PR reports 3001 changed files
    Then affected is "true"

  @test:test/workflows/e2e-scope.test.ts::e2e-scope_skips_the_shards_only_when_every_changed_file_is_inert::the_answer_is_written_to_the_job_summary
  Scenario: The answer is written to the job summary
    When the scope step runs on a listing of index.lock.json
    Then the job summary contains "index.lock.json"

  @test:test/workflows/e2e-scope.test.ts::a_dispatch_on_a_branch_is_scoped_by_its_diff_against_main::inert_files_only:_skipped
  Scenario: A dispatch whose branch changes inert files only is skipped
    When the dispatch-scope step runs on a branch adding .github/workflows/docs-site.yml and test/workflows/x.test.ts
    Then affected is "false"

  @test:test/workflows/e2e-scope.test.ts::a_dispatch_on_a_branch_is_scoped_by_its_diff_against_main::this_workflow,_or_any_other_path:_run
  Scenario: A dispatch whose branch changes this workflow, or any other path, runs them
    When the dispatch-scope step runs on a branch adding .github/workflows/code-quality-gates.yml
    Then affected is "true"
    When the dispatch-scope step runs on a branch adding .github/workflows/docs-site.yml and src/a.ts
    Then affected is "true"

  @test:test/workflows/e2e-scope.test.ts::a_dispatch_on_a_branch_is_scoped_by_its_diff_against_main::no_change_against_main:_run
  Scenario: A dispatch with no change against main runs them
    When the dispatch-scope step runs on a branch with no commit beyond origin/main
    Then affected is "true"

  @test:test/workflows/e2e-scope.test.ts::a_dispatch_on_a_branch_is_scoped_by_its_diff_against_main::the_job_runs_on_a_dispatch_of_a_branch,_never_of_main
  Scenario: The job runs on a dispatch of a branch, never of main
    Given the e2e-scope job's if
    Then it contains "github.event_name == 'workflow_dispatch' && github.ref != 'refs/heads/main'"

  @test:test/workflows/e2e-scope.test.ts::the_shards_honour_it,_and_everything_else_still_runs_them::only_the_exact_answer_`false`_skips_a_shard,_so_a_missing_answer_runs_it
  Scenario: Only the exact answer false skips a shard, so a missing answer runs it
    Given the e2e-shard job
    Then it needs e2e-scope
    And its if contains "needs.e2e-scope.outputs.affected != 'false'"
    And its if contains "!cancelled()"

  @test:test/workflows/e2e-scope.test.ts::the_shards_honour_it,_and_everything_else_still_runs_them::the_scope_job_runs_on_PR_pushes_only,_never_on_ready_for_review_or_a_draft
  Scenario: The scope job runs on PR pushes only, never on ready_for_review or a draft
    Given the e2e-scope job's if
    Then it contains "github.event_name == 'pull_request'"
    And it contains "github.event.action != 'ready_for_review'"
    And it contains "github.event.pull_request.draft != true"
