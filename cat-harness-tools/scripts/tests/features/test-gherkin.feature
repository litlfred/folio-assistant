# The scanner behind check:test-gherkin and the kg-audit criterion
# test-has-gherkin. Each Scenario names the test that executes it, in the
# grammar @test:<file>::<scope>::<name> (skill test-engineer, "Every test has
# a Gherkin").
Feature: Every test has a Gherkin

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::rust:_#[test]_functions_are_named_through_their_mod_scopes
  Scenario: Rust tests are named through their mod scopes
    Given a Rust file with #[test], #[tokio::test] and #[test_case] functions, some inside mods
    And a test marker inside a comment and inside a string
    When the Rust adapter reads it
    Then each test is named <file>::<mod>::<fn>
    And the markers in the comment and the string are not tests

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::kotlin:_@Test_functions_are_named_through_their_classes,_backtick_names_normalised
  Scenario: Kotlin tests are named through their classes
    Given a Kotlin class with @Test, a backtick-named @Test and a nested class with a @ParameterizedTest
    When the Kotlin adapter reads it
    Then each test is named <file>::<class>::<fun>, with the backtick name's spaces written as _
    And a function with no test annotation is not a test

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::js:_test()_and_it()_are_named_through_describe()_titles,_whitespace_as__
  Scenario: JavaScript tests are named through their describe titles
    Given a test file with test(), it.skip(), test.each()() and nested describe() calls
    When the JS adapter reads it
    Then each test is named <file>::<describe>::<title>, whitespace written as _
    And only test files are read

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::python:_the_name_is_pytest's_node_id
  Scenario: Python tests are named by pytest's node id
    Given a test module with module-level tests, a Test class, a non-Test class, a nested def and a docstring
    When the Python adapter reads it
    Then each collected test is named as pytest names it
    And nested functions, non-collected classes and docstrings contribute nothing

  @test:scripts/tests/test-gherkin.test.ts::feature_files::a_Scenario's_@test:_tags_are_its_links;_Examples_tags_and_doc_strings_are_not
  Scenario: A Scenario's @test tags are its links
    Given a feature with tagged Scenarios, a @manual Scenario Outline, Examples tags and a doc string
    When it is parsed
    Then each Scenario carries exactly the @test tags above it
    And Examples tags and doc-string text are not links

  @test:scripts/tests/test-gherkin.test.ts::joining_tests_to_Scenarios::orphans_are_reported_both_ways
  Scenario: Orphans are reported both ways
    Given tests and Scenarios where one test is unnamed, one tag names nothing, one test is named twice, one Scenario names no test and one tag sits on the Feature line
    When they are joined
    Then each of the five is reported under its own kind

  @test:scripts/tests/test-gherkin.test.ts::joining_tests_to_Scenarios::two_tests_that_normalise_to_one_name_are_ambiguous
  Scenario: Two tests with one qualified name are ambiguous
    Given two tests whose names normalise to the same tag
    When they are joined
    Then the name is reported as ambiguous

  @test:scripts/tests/test-gherkin.test.ts::joining_tests_to_Scenarios::a_tree_is_scanned_whole,_and_a_clean_tree_has_no_findings
  Scenario: A clean tree has no findings
    Given a directory with a Rust test, a bun test and a feature naming both
    When the tree is scanned
    Then both tests are found and nothing is reported
    And scanning only an unrelated subdirectory finds no tests

  @test:scripts/tests/test-gherkin.test.ts::the_kg-audit_criterion_test-has-gherkin::plan_cases_with_no_.feature,_a_missing_one,_or_an_empty_one_are_findings;_a_linked_tree_passes
  Scenario: Every test-plan case names a Gherkin that exists and holds a Scenario
    Given a test-plan/v1 plan with a case that names no .feature
    And a test-plan/v1.1 plan with cases naming a linked, a missing and an empty .feature
    When test-has-gherkin audits the instance
    Then the case with no .feature, the missing one and the empty one are each a finding
    And the same tree with no plans passes

  @test:scripts/tests/test-gherkin.test.ts::the_kg-audit_criterion_test-has-gherkin::nothing_to_judge_is_n/a,_and_many_orphans_in_one_file_are_one_finding
  Scenario: Nothing to judge is n/a, and orphans are reported per file
    Given an instance with no test, no Scenario and no plan
    Then test-has-gherkin is n/a, never a pass over nothing
    Given a test file with seven tests and no Scenario
    Then they are one finding that quotes five names and counts the rest

  @test:schemas/sdlc/test-plan.test.ts::the_shape::under_v1.1_every_case_names_its_.feature;_a_v1_plan_without_one_parses,_deprecated
  Scenario: test-plan/v1.1 requires a .feature on every case; v1 stays readable
    Given a test-plan/v1.1 plan with a case that names no .feature
    Then it is refused at that case's feature
    Given the same plan declared test-plan/v1
    Then it parses, and its deprecations name the version and the case
