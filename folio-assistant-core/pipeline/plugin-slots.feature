Feature: the tabular-csvw pipeline plugin slot

  @test:pipeline/plugin-slots.test.ts::tabular-csvw::readsDelimitedTextWithoutMagic
  Scenario: reads text with no magic bytes as delimited text
    Given the text "name,age" with two rows, no mimetype, at p.csv
    When the tabular-csvw extractor runs
    Then the result carries the tabular CSVW schema id
    And the result mentions p.csv

  @test:pipeline/plugin-slots.test.ts::tabular-csvw::nullForNonTabularText
  Scenario: is null for text that does not split into a table
    When the extractor runs on a single line of prose
    Then it returns null

  @test:pipeline/plugin-slots.test.ts::tabular-csvw::nullForFakeWorkbook
  Scenario: is null for a declared workbook that is not one, rather than throwing
    When the extractor runs on "not a zip" declared as an xlsx workbook
    Then it returns null rather than throwing

  @test:pipeline/plugin-slots.test.ts::tabular-csvw::nullForUnreadableMimetype
  Scenario: is null for a mimetype it has no reader for (an OpenDocument spreadsheet)
    When the extractor runs on an OpenDocument spreadsheet mimetype
    Then it returns null

  @test:pipeline/plugin-slots.test.ts::tabular-csvw::pluginNodeNamesTable
  Scenario: the pipeline-plugins node names this table
    When the pipeline-plugins/tabular-csvw.json node is read
    Then its slot is "tabular-csvw"
    And its implementation names pipeline/plugin-slots.ts and an export of that module
