# The LaTeX overlay replaces a PDF section's text with the author's LaTeX only
# when the section passes the title, prose and coverage gates; arxiv-source
# reads an arXiv id from an entry's directory name. Each Scenario names the
# test that executes it.
Feature: The LaTeX math overlay and the arXiv source reader

  @test:scripts/tests/latex-math-overlay.test.ts::latex-math-overlay::a_section_that_passes_all_three_gates_gets_the_author's_mathematics
  Scenario: A section that passes all three gates gets the author's mathematics
    Given an entry whose one PDF section matches a LaTeX \section by title, prose and coverage, with inline and display math
    When the overlay runs with that source
    Then it exits 0 and the section's result is "overlaid"
    And the section text holds $3_1$, and the display math either expanded by pandoc or kept verbatim when the converter is "latex"
    And the frontmatter keeps doc_id and adds text_source: latex
    And structure.json records math_source "latex" and one overlaid section

  @test:scripts/tests/latex-math-overlay.test.ts::latex-math-overlay::titles_that_agree_over_contents_that_do_not:_reported,_NOT_applied
  Scenario: Titles that agree over contents that do not are reported, not applied
    Given a LaTeX section with the PDF section's title but unrelated words
    When the overlay runs
    Then the section's result starts with "prose gate failed" and the section file is unchanged

  @test:scripts/tests/latex-math-overlay.test.ts::latex-math-overlay::a_LaTeX_section_holding_only_part_of_the_PDF_section_does_not_replace_it
  Scenario: A LaTeX section holding only part of the PDF section does not replace it
    Given a LaTeX section whose every word is in a much longer PDF section
    When the overlay runs
    Then the section's result starts with "coverage gate failed" and the section file is unchanged

  @test:scripts/tests/latex-math-overlay.test.ts::latex-math-overlay::a_section_is_never_paired_by_position
  Scenario: A section is never paired by position
    Given the only LaTeX section has a title unlike the only PDF section's
    When the overlay runs
    Then the section's result is "no matching \section"

  @test:scripts/tests/latex-math-overlay.test.ts::latex-math-overlay::not_eligible_is_SKIPPED_with_a_reason,_never_'overlaid:_0'
  Scenario: An ineligible entry is skipped with a reason
    Given an entry at page granularity
    When the overlay runs with a source
    Then the entry is "skipped" with a reason naming page granularity
    And an entry run with no source exits 0 and is "skipped" with a reason naming no LaTeX source

  @test:scripts/tests/latex-math-overlay.test.ts::latex-math-overlay::a_staged_entry_reads_the_source_fetched_into_the_promoted_one
  Scenario: A staged entry reads the source fetched into the promoted entry
    Given a promoted entry in the library holding source/e-print, and a staged copy of it with no source directory
    When the overlay runs on the staged entry with the library
    Then the staged section's result is "overlaid"

  @test:scripts/tests/latex-math-overlay.test.ts::arxiv-source::every_arXiv_id_shape_the_qou_library_uses_is_read_from_the_directory_name
  Scenario: Every arXiv id shape is read from the directory name
    When arxiv_id reads new-style, versionless, hyphenated-category, dotted-category and non-arXiv directory names
    Then it returns 0705.1468v1, 2111.06645, hep-th/9901001v2, alg-geom/9408004v1, math.GT/0309136v1, and null for milnorlink
