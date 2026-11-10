Feature: The IG's quality checks page

  @test:scripts/ig-qa-page.test.ts::ig-qa-page::fhirQaSummaryFromAst
  Scenario: FHIR QA: the Publisher's summary when the AST carries it, its counts and its record
    Given an AST holding the Publisher's QA summary (3 errors, 7 warnings, 0 hints, IG Publisher 2.0.15, FHIR 5.0.0) and its manifest
    When the FHIR QA section is written
    Then it names the Publisher and FHIR versions and the date
    And it shows the errors and hints counts, says nothing of suppressed messages, and links the record at assets/fhir-qa/qa.json
    And it shows when the AST was generated and which parts are provisional until a full IG Publisher run

  @test:scripts/ig-qa-page.test.ts::ig-qa-page::fhirQaWithoutSummarySaysSo
  Scenario: FHIR QA: an AST without the summary says so, never zeros
    Given an AST with a manifest but no QA summary, and a validity record saying the AST is stale because the inputs changed
    When the FHIR QA section is written
    Then it says the AST holds no Publisher QA summary and shows no errors count
    And it shows the validity "stale" with its reason, and the recorded and current input digests side by side

  @test:scripts/ig-qa-page.test.ts::ig-qa-page::pageRawHalvesKgRecords
  Scenario: the page: both halves inside raw, the KG records laid out by the harness's renderer
    Given one instance's directory holding a knowledge-graph QA record with two findings
    When the QA page is rendered
    Then its front matter titles it "QA Report" and keeps it out of the navigation
    And the FHIR QA section comes before the knowledge-graph QA section, both inside a raw block that the page ends with
    And it links every instance's QA, names the record's two findings and its writer, and links the record file
    And a pipe in a summary is escaped and Liquid-looking text in an entry is shown as written
