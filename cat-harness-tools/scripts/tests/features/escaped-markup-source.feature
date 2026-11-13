# The source side of check:escaped-markup (scripts/check-escaped-markup.ts) finds markdown lines that open at column 0 with a
# placeholder written like an HTML tag, which kramdown reads as a block; real elements, autolinks, fences and generated trees are left alone.
# Each Scenario names the test that executes it.
Feature: Escaped markup in markdown sources

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_fire::catches_the_#1730_defect:_a_code_span_wrapped_so_a_line_begins_<slide>
  Scenario: A code span wrapped so a line begins with <slide> is caught
    Given two lines from library-ingestion.md where a code span wraps so the second line begins "<slide>`"
    When the lines are scanned for leaking markup
    Then exactly one finding is reported
    And its tag is "slide" and it is on line 2

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_fire::catches_a_DOTTED_placeholder,_which_is_never_an_element
  Scenario: A dotted placeholder at the start of a line is caught
    When the line "<file.json> is the sidecar" is scanned
    Then one finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_fire::catches_a_close_tag_too_—_kramdown_reads_either_as_a_block
  Scenario: A close tag at the start of a line is caught
    When the line "</agentId> ends it" is scanned
    Then one finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::an_autolink_is_valid_markdown,_not_a_tag
  Scenario: An autolink at the start of a line is not a finding
    When a line opening with a "https://creativecommons.org/…" autolink is scanned
    And a line holding only a "mailto:" autolink is scanned
    Then neither yields a finding

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::a_REAL_html_element_is_allowed_to_open_a_line
  Scenario: A real HTML element may open a line
    When a line opening with "<caption>" is scanned
    And the line '<details markdown="1">' is scanned
    Then neither yields a finding

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::a_placeholder_inside_a_code_span,_mid-line,_is_the_safe_spelling
  Scenario: A placeholder inside a mid-line code span is not a finding
    When the line "written to `library/<slug>/` by the ingester" is scanned
    Then no finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::a_fenced_region_is_not_markdown,_so_its_contents_cannot_trip_this
  Scenario: A placeholder inside a backtick fence is not a finding
    Given a yaml fenced block holding a line starting "<slide>", followed by text after the fence
    When it is scanned
    Then no finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::a_tilde_fence_closes_only_on_a_tilde_fence
  Scenario: A placeholder inside a tilde fence is not a finding
    Given a tilde-fenced block holding the line "<slide>"
    When it is scanned
    Then no finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::front_matter_is_YAML_and_kramdown_never_sees_it
  Scenario: A placeholder in front matter is not a finding
    Given front matter whose title is "<slide> something", followed by a body
    When it is scanned
    Then no finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::an_html_comment_is_not_a_tag
  Scenario: An HTML comment at the start of a line is not a finding
    When the line "<!-- marker:begin -->" is scanned
    Then no finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::leakingLinesIn_—_must_NOT_fire_(all_four_are_real_corpus_lines)::an_INDENTED_code_block_cannot_trip_it_—_the_column-0_rule_pays_for_itself
  Scenario: A placeholder in an indented code block is not a finding
    When a line indented four spaces and opening with "<slide>" is scanned
    Then no finding is reported

  @test:scripts/tests/escaped-markup-source.test.ts::scope::excludes_the_generated_trees,_because_those_must_never_be_hand-edited
  Scenario: The generated trees are excluded from the scanned sources
    Then the generated segments include "/reference/skill-instructions/"
    When the markdown sources under "cat-harness/docs" are listed
    Then more than 50 files are found
    And none of them is under "docs/reference/skill-instructions/"

  @test:scripts/tests/escaped-markup-source.test.ts::scope::the_html_allow-list_carries_the_elements_this_corpus_actually_opens_lines_with
  Scenario: The HTML allow-list holds the elements the corpus opens lines with
    Then the allow-list contains "caption", "details", "summary", "div", "table" and "figure"
    And it does not contain "slide"
