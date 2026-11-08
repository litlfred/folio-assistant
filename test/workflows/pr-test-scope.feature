Feature: A pull request runs only the bun test files its change can affect
  `.github/scripts/pr-test-scope.ts` selects the test files; `pr-bun-test.sh`
  runs a shard of that selection, and says an unaffected shard was skipped,
  never that it passed.

  @test:test/workflows/pr-test-scope.test.ts::lockChanges::maps_the_upstream_diff_of_a_re-pinned_whole_mount_under_its_path
  Scenario: lockChanges maps the upstream diff of a re-pinned whole mount under its path
    Given a base lock and a head lock mounting instance "a" whole at "a", with different shas and tree digests
    And an upstream diff of scripts/x.ts and README.md
    When lockChanges compares them
    Then the changed files are a/scripts/x.ts and a/README.md

  @test:test/workflows/pr-test-scope.test.ts::lockChanges::maps_a_partial_mount's_upstreamPath_to_its_mounted_path,_and_drops_files_outside_it
  Scenario: lockChanges maps a partial mount's upstreamPath to its mounted path, and drops files outside it
    Given a base lock and a head lock mounting upstream "library" of instance "b" at "b/lib", with different shas and tree digests
    And an upstream diff of library/y.ts and other/z.ts
    When lockChanges compares them
    Then the only changed file is b/lib/y.ts

  @test:test/workflows/pr-test-scope.test.ts::lockChanges::an_unchanged_digest_is_not_a_change,_whatever_the_sha
  Scenario: lockChanges treats an unchanged digest as no change, whatever the sha
    Given a base lock and a head lock mounting instance "a" with different shas but the same tree digest
    And an upstream diff of scripts/x.ts
    When lockChanges compares them
    Then there are no changed files

  @test:test/workflows/pr-test-scope.test.ts::lockChanges::an_unreadable_upstream_diff_counts_the_whole_directory
  Scenario: lockChanges counts the whole directory when the upstream diff is unreadable
    Given a base lock and a head lock mounting instance "a" with different tree digests
    And an upstream diff that cannot be read
    When lockChanges compares them
    Then the changed files are just "a/"

  @test:test/workflows/pr-test-scope.test.ts::lockChanges::a_different_instance_set_selects_everything
  Scenario: lockChanges selects everything when the instance set differs
    Given a base lock mounting instance "a" and a head lock mounting instances "a" and "b"
    When lockChanges compares them
    Then it selects all, because "the lock mounts a different set of instances"

  @test:test/workflows/pr-test-scope.test.ts::lockChanges::a_changed_declaration_or_asset_is_a_changed_file
  Scenario: lockChanges treats a changed declaration or asset as a changed file
    Given a base and a head lock for instance "a" whose declaration a.json and asset AGENTS.md have different sha256 values
    When lockChanges compares them
    Then the changed files are a/a.json and a/AGENTS.md

  @test:test/workflows/pr-test-scope.test.ts::selection::a_test_that_names_a_changed_fixture_is_selected_beside_the_import_closure
  Scenario: A test that names a changed fixture is selected beside the import closure
    Given a tree where a.test.ts imports lib/x.ts, b.test.ts names "fixtures/pick-me.yml", and c.test.ts is unrelated
    And a stand-in affected-tests module that selects a.test.ts for lib/x.ts
    When scopeFor is asked about lib/x.ts and fixtures/pick-me.yml
    Then it selects a.test.ts and b.test.ts

  @test:test/workflows/pr-test-scope.test.ts::selection::a_directory_prefix_expands_to_the_files_under_it
  Scenario: A directory prefix expands to the files under it
    Given the same tree
    When expand is given "lib/" and "gone.ts"
    Then it returns gone.ts and lib/x.ts
    When scopeFor is asked about "lib/"
    Then it selects a.test.ts

  @test:test/workflows/pr-test-scope.test.ts::selection::index.config.json_and_the_selector's_own_'all'_select_everything
  Scenario: index.config.json and the selector's own "all" select everything
    Given the same tree and stand-in module, which answers "all" for bun.lock
    When scopeFor is asked about index.config.json
    Then it selects all
    When scopeFor is asked about bun.lock
    Then it selects all

  @test:test/workflows/pr-test-scope.test.ts::selection::a_generic_basename_is_matched_with_its_parent
  Scenario: A generic basename is matched with its parent
    Then nameOf "smart-base/README.md" is "smart-base/README.md"
    And nameOf ".github/workflows/code-quality-gates.yml" is "code-quality-gates.yml"
    And testsNaming x/README.md among c.test.ts finds nothing

  @test:test/workflows/pr-test-scope.test.ts::selection::the_shards_split_the_selection_with_nothing_lost_or_doubled
  Scenario: The shards split the selection with nothing lost or doubled
    Given the files e, a, d, c and b
    When shareOf splits them into 4 shares
    Then the shares together are exactly the five files
    And share 4 is just "d"
    And share 2 of 4 of the single file "a" is empty

  @test:test/workflows/pr-test-scope.test.ts::the_selection_waits_for_the_judge_that_refuses_to_reuse_it_(#2963)::a_judge_without_SCOPED_STEP_selects_everything,_whatever_else_is_present
  Scenario: A judge without SCOPED_STEP selects everything, whatever else is present
    Given a tree whose .github/scripts/cqg_judge.py defines RUNS_SCANNED but no SCOPED_STEP
    Then judgeRefusesScopedReuse is false
    When computeScope runs with no changed files
    Then it selects all, giving a reason that mentions "#2963"

  @test:test/workflows/pr-test-scope.test.ts::the_selection_waits_for_the_judge_that_refuses_to_reuse_it_(#2963)::a_judge_with_SCOPED_STEP_lets_the_selection_proceed
  Scenario: A judge with SCOPED_STEP lets the selection proceed
    Given a tree whose .github/scripts/cqg_judge.py defines SCOPED_STEP
    Then judgeRefusesScopedReuse is true

  @test:test/workflows/pr-test-scope.test.ts::pr-bun-test.sh::an_empty_share_runs_nothing_and_says_'skipped_—_not_affected',_not_a_pass
  Scenario: An empty share runs nothing and says "skipped — not affected", not a pass
    Given a bun shim that records "bun test" arguments instead of running it
    And a scope selecting the single file test/workflows/bun-pin.test.ts
    When pr-bun-test.sh runs shard 2 of 4
    Then it exits 0
    And the step summary contains "skipped — not affected"
    And the step summary contains "This is not a pass"

  @test:test/workflows/pr-test-scope.test.ts::pr-bun-test.sh::a_share_runs_only_its_files,_with_--shard_dropped_and_the_reporter_kept
  Scenario: A share runs only its files, with --shard dropped and the reporter kept
    Given the bun shim, and BUN_OPTIONS "--shard=1/4 --reporter=junit"
    And a scope selecting five files t/a.test.ts to t/e.test.ts
    When pr-bun-test.sh runs shard 1 of 4
    Then it exits 0
    And it runs "BUN_OPTIONS=[ --reporter=junit] bun test ./t/a.test.ts ./t/e.test.ts"
    And the step summary contains "2 of 5 affected test file(s)"

  @test:test/workflows/pr-test-scope.test.ts::pr-bun-test.sh::no_scope,_or_'all',_runs_the_whole_suite_sharded_as_before
  Scenario: No scope, or "all", runs the whole suite sharded as before
    Given the bun shim, and BUN_OPTIONS "--shard=1/4 --reporter=junit"
    When pr-bun-test.sh runs shard 3 of 4 with no scope
    Then it runs "BUN_OPTIONS=[--shard=1/4 --reporter=junit] bun test " with no files
    When it runs shard 3 of 4 with a scope of "all" because "bun.lock is part of what every test runs under"
    Then it runs "bun test " with no files
    And the step summary contains "the whole suite (bun.lock is part of what every test runs under)"

  @test:test/workflows/pr-test-scope.test.ts::pr-bun-test.sh::--scope_never_fails_and_reports_'all'_when_it_cannot_select
  Scenario: --scope never fails, and reports "all" when it cannot select
    Given an empty directory with no checkout and no affected-tests module
    When pr-bun-test.sh --scope runs there
    Then it exits 0
    And its GITHUB_OUTPUT is exactly "kind=all"

  @test:test/workflows/pr-test-scope.test.ts::pr-bun-test.sh::the_shard_job_selects_on_a_pull_request,_and_exactly_one_bun-test_step_gives_the_verdict
  Scenario: The shard job selects on a pull request, and exactly one bun-test step gives the verdict
    Given the typescript-test job of code-quality-gates.yml
    Then its "scope" step runs only on pull_request, and not for merge-train/ or repin-train/ head refs
    And the scope step runs "bash .github/scripts/pr-bun-test.sh --scope"
    And its last step runs "bun test" if steps.scope.outputs.kind != 'some'
    And the step running "bash .github/scripts/pr-bun-test.sh ${{ matrix.shard }} 4" runs if steps.scope.outputs.kind == 'some'
    And both of those steps set CQG_VERDICT to "true"
    And the scoped step's BUN_OPTIONS do not contain "--shard"
    And the scoped step sets CQG_TESTS "bun" and CQG_TEST_SCOPE "${{ runner.temp }}/test-scope.json"
