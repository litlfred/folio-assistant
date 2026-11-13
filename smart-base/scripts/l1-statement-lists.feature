Feature: L1 statement lists
  The statements of each L1 source and each scenario graph, listed with the
  library entry and page they came from.

  @test:smart-base/scripts/l1-statement-lists.test.ts::where_an_L1_source_came_from::reads_graph.source.entry,_else_the_library/<id>/_its_paths_name,_else_nothing
  Scenario: an L1 source's library entry is its graph.source.entry, else the library id its paths name, else nothing
    Then a source entry "library/unepi-deck" gives "unepi-deck"
    And a source pdf "library/wer-92-17/WER9217.pdf" gives "wer-92-17"
    And a source pdf "uploads/x.pdf" gives no entry
    And a document with no graph gives no entry

  @test:smart-base/scripts/l1-statement-lists.test.ts::where_an_L1_source_came_from::takes_a_row's_first_page
  Scenario: a row's page is its first page
    Then "220–221" gives 220, 7 gives 7, and "" gives no page

  @test:smart-base/scripts/l1-statement-lists.test.ts::where_an_L1_source_came_from::parses_a_scenario's_evidence_location
  Scenario: a scenario's evidence location is parsed into file, key and page
    Then "a/b.l1.yaml#C01 (p210)" gives file "a/b.l1.yaml", key "C01" and page 210
    And "a/b.yaml#K" gives file "a/b.yaml" and key "K" with no page
    And "not a location" gives nothing

  @test:smart-base/scripts/l1-statement-lists.test.ts::statements::are_the_rows_verbatim,_one_line,_with_entry_and_page
  Scenario: recommendation statements are the rows verbatim on one line, with entry and page
    Given recommendation R1 on page "3" with a statement broken over two lines, and R2 with no statement
    When the recommendations of library entry "deck" are listed
    Then the only statement is R1, "Give dose 1.", a recommendation from "deck" page 3

  @test:smart-base/scripts/l1-statement-lists.test.ts::statements::skip_a_node_citing_a_file_that_is_not_an_L1_source,_and_report_one_naming_no_entry
  Scenario: scenario statements skip a node citing a non-L1 file and report one whose file names no entry
    Given a scenario citing an L1 source of entry "deck", a persona citing a mapping file that is not an L1 source, and a scenario citing a file that resolves to no entry
    When the scenario statements are listed
    Then the only statement is the first scenario, derived from R1
    And exactly one node is reported unresolved

  @test:smart-base/scripts/l1-statement-lists.test.ts::a_directory::yields_one_list_per_L1_source_and_per_scenario_graph
  Scenario: a directory yields one list per L1 source and per scenario graph
    Given a directory with an L1 source "src.l1.yaml" and a scenario-candidates graph under candidates/
    When its lists are built
    Then there are no problems
    And the lists are "src.recommendations.json" and "<directory>-scenario-candidates.scenarios.json"
