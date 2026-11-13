# The document view of an ingested library entry (issue #2302, bean turh).
# Each Scenario names the test that executes it.
Feature: The document view of a library entry

  @test:scripts/tests/library/library-document.test.ts::readEntryDocument::reads_the_schema;_TOC_entries_link_to_their_sections;_summary_by_file,_else_extract
  Scenario: The view links TOC to sections, matches summaries by file, else extracts
    Given a pdf-structure entry of two sections, a summary for the methods section's file, and page and figure labels
    When its document view is read
    Then the TOC entries link to the two sections, keeping the second's confidence 0.55
    And the introduction has no summary and its whole short text as an uncut extract
    And the methods section carries its summary text
    And the second page label is "1", the figure's page label is "2", and the figure sequence gap is "table 2"

  @test:scripts/tests/library/library-document.test.ts::readEntryDocument::the_summary_badge_reads_the_narrative_list's_state,_so_a_confirmed_summary_is_not_shown_as_draft
  Scenario: A summary's status comes from its narrative list's state
    Given summaries whose narratives are a draft and a confirmed one
    When the document view is read
    Then the first section's summary status is draft and the second's is confirmed

  @test:scripts/tests/library/library-document.test.ts::readEntryDocument::a_withheld_entry_publishes_no_extract,_and_keeps_structure_and_summaries
  Scenario: A withheld entry publishes no extract
    # Gap: the title says summaries are kept; the entry has no summaries.json and no summary is checked.
    Given an entry with section text, read as withheld
    Then the section's extract is null and the view is marked withheld
    And the TOC still holds two entries

  @test:scripts/tests/library/library-document.test.ts::readEntryDocument::a_field_an_older_ingestion_lacks_is_absent,_not_empty;_no_structure.json_is_null
  Scenario: Fields an older ingestion lacks are absent, and no structure.json is null
    Given an entry whose structure has no pages and no figures
    Then its view has no pageLabels and no figures keys
    And a directory with no structure.json has a null view

  @test:scripts/tests/library/library-document.test.ts::readEntryDocument::an_extract_is_cut_at_a_word_and_says_so
  Scenario: An extract is cut at a word boundary and marked cut
    When the extract of "alpha beta gamma delta" is taken at 12 characters
    Then it is "alpha beta", marked cut

  @test:scripts/tests/library/library-document.test.ts::keywords_in_the_document_view::document_and_section_keywords_from_keywords.json,_heading_evidence_kept;_absent_file_leaves_the_field_absent
  Scenario: Keywords come from keywords.json with their heading evidence
    Given an entry whose keywords.json gives document keywords and keywords for the methods section
    Then the view's keywords are the terms, each marked whether a heading is evidence
    And the methods section's keywords are given and the other section's are empty
    And an entry with no keywords.json has no keywords field

  @test:scripts/tests/library/library-document.test.ts::a_text_source_is_shown_by_its_own_headings,_not_as_a_PDF_(litlfred/dth-hrh)::the_view_says_it_is_a_text_source_and_keeps_its_sections
  Scenario: A text source's view says it is text and keeps its sections
    Given a text-structure/v1 entry with two sections
    When its document view is read
    Then it is not null, its variant is "text" and its sections are the two section ids

  @test:scripts/tests/library/library-document.test.ts::a_text_source_is_shown_by_its_own_headings,_not_as_a_PDF_(litlfred/dth-hrh)::a_PDF_entry_still_says_pdf
  Scenario: A PDF entry's view says pdf
    Given a pdf-structure entry
    When its document view is read
    Then its variant is "pdf"

  @test:scripts/tests/library/library-document.test.ts::plainHeading_—_a_text_heading_as_a_reader_sees_it_(litlfred/dth-hrh)::strips_emphasis_and_escapes,_keeps_the_words
  Scenario: A heading loses emphasis, escapes and code marks
    When headings with **bold**, __bold__, *emphasis*, backtick code and escaped dots are made plain
    Then each keeps only its words and literal punctuation

  @test:scripts/tests/library/library-document.test.ts::plainHeading_—_a_text_heading_as_a_reader_sees_it_(litlfred/dth-hrh)::an_escaped_star_stays_a_star;_words_with_underscores_are_untouched
  Scenario: Escaped stars and underscored words survive
    When "Rating \\*\\*\\* stars", a file name with underscores, and a plain heading are made plain
    Then the stars become literal "***", and the other two are unchanged

  @test:scripts/tests/library/library-document.test.ts::a_Markdown_section's_extract_(litlfred/dth-hrh,_twg-outline)::drops_its_own_heading_and_reads_as_plain_text
  Scenario: A heading-unit section's extract drops its heading and reads as plain text
    Given a text section of unit "heading" whose file starts with front matter and its own heading
    When the document view is read
    Then the section title is the plain heading "Part 4. Examples"
    And its extract is the body as plain text, without links, emphasis or list marks

  @test:scripts/tests/library/library-document.test.ts::a_Markdown_section's_extract_(litlfred/dth-hrh,_twg-outline)::a_whole_verbatim_file_is_left_as_it_is
  Scenario: A whole-file section's extract keeps its Markdown
    # Gap: the title says the file is left as it is; only the start of the extract is checked, not the rest of the text.
    Given a text section of unit "file" with the same Markdown
    When the document view is read
    Then its extract starts with the raw heading "# **Part 4\\. Examples**"

  @test:scripts/tests/library/library-document.test.ts::a_Markdown_table_in_an_extract_(litlfred/dth-hrh,_'Handbook_at_a_glance')::drops_the_delimiter_row_and_reads_each_row_as_its_cells
  Scenario: A Markdown table reads as its rows of cells
    Given a section with a heading and a Markdown table with a delimiter row, bold text and an escaped pipe
    When it is made plain and its whitespace collapsed
    Then the delimiter row is gone and each row reads as its cells joined by "; "
