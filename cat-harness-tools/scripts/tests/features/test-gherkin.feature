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

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::js:_a_regex_literal_holding_a_quote_or_backtick_opens_no_string
  Scenario: A regex literal with a quote or backtick hides no test
    Given a test file whose first lines hold a regex literal with backticks and one with quotes
    And then a describe() scope and a describe.skipIf(cond)() scope, each holding a test
    When the JS adapter reads it
    Then both tests are found, each named through its scope

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::js:_a_template_nested_in_a_template's_${}_does_not_close_it;_id[${key}]_is_a_fixed_name
  Scenario: A template nested in a template's ${} does not close it
    Given a test file whose first line nests a template literal inside another's ${…}
    And then two top-level describe() scopes, the second holding a test titled with ${key}
    And a computed describe(key) holding a test titled id[${key}] and one titled "case ${key}"
    When the JS adapter reads it
    Then each test is named through its own scope only
    And a title id[${key}] is a fixed name, kept verbatim, and the computed describe around it is left out
    And the title "case ${key}" is still computed and reported

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::js:_a_block_comment_mentioning_a_/*_glob_still_closes
  Scenario: A JS block comment mentioning a glob still closes
    Given a test file whose doc comment mentions `schemas/**` and `x/*.ts`
    When the JS adapter reads it
    Then the test after the comment is found

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::js:_a_division_is_not_read_as_a_regex_literal
  Scenario: A division is not read as a regex literal
    Given a test file whose first line divides with /
    When the JS adapter reads it
    Then the test after it is found

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::js:_modifiers_with_their_own_arguments_chain_before_the_title_call
  Scenario: Chained modifiers with arguments do not hide a test
    Given tests written as test.skipIf(c).each(t)(…), test.if(c).each(t)(…), it.skip.each(t)(…) and test.skipIf(c)(…)
    And a describe.skipIf(c)(…) scope holding a test, and a test.each passed around as a value
    When the JS adapter reads them
    Then the four tests and the scoped test are found by their titles
    And the value is not taken for a test

  @test:scripts/tests/test-gherkin.test.ts::language_adapters::js:_a_test_with_a_computed_title_is_found_and_reported,_never_dropped
  Scenario: A test whose title is computed is reported, not dropped
    Given a test file with tests titled by a loop variable and by a template with an interpolation
    And a test inside a describe whose title is a variable, and one with a fixed template title
    When the JS adapter reads it and the tests are joined to no Scenarios
    Then the three computed ones are found and each is reported as having a title no tag can name
    And only the fixed-title test is reported as having no Scenario

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

  @test:scripts/tests/test-gherkin.test.ts::bindings_beyond_@test:,_and_Gherkin_dialects::a_translated_.feature_is_read_in_its_own_dialect;_an_unknown_dialect_is_reported
  Scenario: A translated feature file is read in its own dialect
    Given a feature file headed "# language: fr" with a Scénario and a Plan du scénario
    When it is parsed
    Then both Scenarios and their @test tags are found, and the Exemples tags are not links
    Given a feature file headed with a language code no dialect has
    Then it is reported as an unknown dialect

  @test:scripts/tests/test-gherkin.test.ts::bindings_beyond_@test:,_and_Gherkin_dialects::@itb:_binds_a_GITB_test_case_by_suite_and_case_id;_a_missing_source_is_unresolved,_never_a_pass
  Scenario: An @itb tag binds a GITB test case by suite id and test-case id
    Given a GITB test suite "ts-hcert" that references test case "tc-verify", and one commented out
    And Scenarios tagged with that case, with an absent case and with the commented-out one
    When they are joined against the suite's checkout
    Then only the present case resolves; the absent and commented-out ones name no target
    When they are joined with no checkout held
    Then every @itb tag is unresolved, "source not held", and none passes
