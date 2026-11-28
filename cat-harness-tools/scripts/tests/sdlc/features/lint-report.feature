# scripts/lint-report.ts, the per-layer lint counts (lint baseline, 2026-11-28): every finding
# counted against the layer that holds it, a missing tool read as not measured, and exit 0 always.
# Each Scenario names the test that executes it.
Feature: The lint report counts each linter's findings per layer and never fails

  @test:scripts/tests/sdlc/lint-report.test.ts::lint:report:_counting::a_finding_is_counted_against_the_deepest_layer_that_holds_it,_else_the_root
  Scenario: A finding is counted against the deepest layer that holds it, else the root
    Given the lint report
    Then a finding is counted against the deepest layer that holds it, else the root

  @test:scripts/tests/sdlc/lint-report.test.ts::lint:report:_counting::ruff's_and_shellcheck's_JSON_are_read_as_file_and_rule
  Scenario: Ruff's and shellcheck's JSON are read as file and rule
    Given the lint report
    Then ruff's and shellcheck's JSON are read as file and rule

  @test:scripts/tests/sdlc/lint-report.test.ts::lint:report:_counting::shell_files_are_found_under_a_tree,_skipping_dependencies_and_build_output
  Scenario: Shell files are found under a tree, skipping dependencies and build output
    Given the lint report
    Then shell files are found under a tree, skipping dependencies and build output

  @test:scripts/tests/sdlc/lint-report.test.ts::lint:report:_counting::a_tool_that_is_not_installed_reads_not_measured,_never_0,_and_the_run_still_exits_0
  Scenario: A tool that is not installed reads not measured, never 0, and the run still exits 0
    Given the lint report
    Then a tool that is not installed reads not measured, never 0, and the run still exits 0

  @test:scripts/tests/sdlc/lint-report.test.ts::lint:report:_the_baseline::a_baseline_keeps_each_layer's_totals,_keyed_by_its_directory_name
  Scenario: A baseline keeps each layer's totals, keyed by its directory name
    Given the lint report
    Then a baseline keeps each layer's totals, keyed by its directory name

  @test:scripts/tests/sdlc/lint-report.test.ts::lint:report:_the_baseline::the_table_shows_a_count's_change_against_the_baseline,_and_no_change_as_the_count_alone
  Scenario: The table shows a count's change against the baseline, and no change as the count alone
    Given the lint report
    Then the table shows a count's change against the baseline, and no change as the count alone
