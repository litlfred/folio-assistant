Feature: extract-references — the library papers' reference lists, split into folio-reference/v1 nodes

  @test:scripts/extract-references.test.ts::splitting_a_reference_list_into_entries::bracketListSplitsOnNextNumber
  Scenario: [n] lists split on the next number, and a one-word-per-line entry stays one entry
    Given IEEE entries [8]–[10] verbatim from the library, [9] with one word per line
    Then the style is detected as "bracket"
    And the entries are numbered 8, 9 and 10
    And entry 9 joins to "Y. Deng, A. Kanervisto, J. Ling, and A. M. Rush,"

  @test:scripts/extract-references.test.ts::splitting_a_reference_list_into_entries::dottedListSplitsInSequence
  Scenario: n. lists split on the next number in sequence; an out-of-sequence number starts nothing
    Then LNCS entries 13–15, across a page break, split as 13, 14 and 15
    And entries 24–26 with a broken access date split as 24, 25 and 26
    And in a minimal list "7." inside entry 2 starts nothing, giving 1, 2 and 3

  @test:scripts/extract-references.test.ts::splitting_a_reference_list_into_entries::dropsPageNumbersAndRunningHeads
  Scenario: page numbers and running heads are dropped; a number that finishes the line before is kept
    When the LNCS entries are split with the document's repeated running head
    Then no entry contains "P. Horn and J. Keuper"
    And entry 13 ends "(DAS). pp. 599–606 (2008)"
    And entry 25 ends "accessed: 2025-12- 01"

  @test:scripts/extract-references.test.ts::splitting_a_reference_list_into_entries::authorYearSplitsOnAuthorList
  Scenario: author-year paragraphs split where a line opens an author list after a closed sentence
    Given natbib author-year entries with a page break mid-entry and an appendix letter after the list
    Then the style is detected as "author-year"
    And the entries open with Josh Achiam, Anthropic, Zhangir Azerbayev and Jiaqi Chen
    And the Azerbayev entry contains "Albert Q. Jiang, Jia Deng"
    And the last entry has no "Work in progress" and ends "emnlp-main.218."

  @test:scripts/extract-references.test.ts::splitting_a_reference_list_into_entries::editorMarkerNotEntryEnd
  Scenario: an editor's `(ed.).` does not end the entry, and a title line is not a name list
    Given an entry by "Christian Szegedy (ed.)." followed by another entry
    Then there are 2 entries
    And the first is "Christian Szegedy (ed.). A Promising Path Towards Autoformalization and General Artificial Intelligence, 2020."

  @test:scripts/extract-references.test.ts::splitting_a_reference_list_into_entries::footnotesAndHeadBelongToNeither
  Scenario: footnotes and a running head between two entries belong to neither
    Given ACM entries [12] and [13] with footnotes and a running head between them
    Then the entries are 12 and 13
    And entry 12 ends "ACM Transactions on Information Systems (2023)."

  @test:scripts/extract-references.test.ts::parsing_only_what_the_entry_makes_unambiguous::rejoinsUrlBrokenAfterPunctuation
  Scenario: a URL broken after its own punctuation is rejoined
    Then the Anthropic entry joins to "URL https://www.anthropic.com/news/claude-3-family."
    And the Azerbayev entry joins to "https://doi.org/10.48550/arXiv.2310.10631."

  @test:scripts/extract-references.test.ts::parsing_only_what_the_entry_makes_unambiguous::urlCutMidWordNotRejoined
  Scenario: a URL cut mid-word is not rejoined: the result would be a guess
    Given an entry whose URL is cut after "https://github.c"
    When it is joined for parsing
    Then the text carries the unsure marker and not "https://github.c"

  @test:scripts/extract-references.test.ts::parsing_only_what_the_entry_makes_unambiguous::hyphenRejoinedOnPaperEvidence
  Scenario: a hyphen at a line break is rejoined only on the paper's own evidence
    Then "chal-" / "lenges", which the vocabulary does not hold, joins with the unsure marker
    And "mathe-" / "matical expressions" joins to "mathematical expressions"

  @test:scripts/extract-references.test.ts::parsing_only_what_the_entry_makes_unambiguous::ieeeTitleAndAuthors
  Scenario: an IEEE entry: the quoted title, the name list before it
    When the Zhang, Du and Dai entry is parsed as bracket style
    Then the title is the quoted "Track, attend, and parse (tap): An end-to-end framework"
    And the authors are Zhang J., Du J. and Dai L.

  @test:scripts/extract-references.test.ts::parsing_only_what_the_entry_makes_unambiguous::acmYearAfterAuthorsNonInitialDropsAuthors
  Scenario: an ACM entry: the year after the authors; a non-initial abbreviation leaves the authors out
    When the Kamali and Tompa entry is parsed with the year after the authors
    Then the year is 2010 and the title is "A new mathematics retrieval system"
    And there are no authors

  @test:scripts/extract-references.test.ts::parsing_only_what_the_entry_makes_unambiguous::singleNameStaysLiteral
  Scenario: one name that is not initials-first stays whole, as `literal`
    When "Anthropic. Introducing the next generation of claude, 2024. ..." is parsed as author-year
    Then the author is the literal "Anthropic" and the title "Introducing the next generation of claude", and nothing else

  @test:scripts/extract-references.test.ts::parsing_only_what_the_entry_makes_unambiguous::ocrDiacriticDropsAuthors
  Scenario: an OCR'd diacritic (`Doll´ar`) leaves the author list out rather than spelling a name wrong
    When an entry naming "P. Doll´ar" is parsed as bracket style
    Then there are no authors
    And the title is "Focal loss for dense object detection"

  @test:scripts/extract-references.test.ts::the_committed_extracted-references/::committedOutputMatchesLibrary
  Scenario: is what the library gives (the check:extracted-references gate)
    When the extraction is planned from the library
    Then the committed extracted-references/ files are exactly the planned files, byte for byte
    And at least 7 documents are planned

  @test:scripts/extract-references.test.ts::the_committed_extracted-references/::nodesPassSchemaWithProvenance
  Scenario: every node passes core's ReferenceNodeSchema, with extracted provenance and a section it came from
    Then every committed node passes ReferenceNodeSchema with the reference schema tag
    And its provenance is "extracted", and derivedFrom names a library section that exists
    And its type is article-journal or document, and its note is not empty

  @test:scripts/extract-references.test.ts::the_committed_extracted-references/::idsValidUniqueNameFile
  Scenario: ids are valid citation keys, unique, `<doc-id>.r<n>`, and name their file
    Then every id is a valid citation key of the form <doc-id>.r<n> for the document it came from
    And each file is named <id>.json, and no id repeats

  @test:scripts/extract-references.test.ts::the_committed_extracted-references/::noInventedField
  Scenario: no field is invented: every parsed value is in the entry's own text
    Then every node has only the allowed fields
    And its title, author name parts, year, DOI and URL each appear in its note

  @test:scripts/extract-references.test.ts::the_committed_extracted-references/::bibliographyCollectReadsAll
  Scenario: the bibliography viewer's collect() reads every entry, and finds none of them invalid
    When the bibliography viewer's collect() runs
    Then it reads as many sci-extracted-references entries as are committed, all from folio-assistant-sci with extracted provenance
    And it finds none of them invalid
    And it lists the sci-extracted-references subgraph as references
