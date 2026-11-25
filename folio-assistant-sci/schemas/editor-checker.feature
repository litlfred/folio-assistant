Feature: the editor-checkers this instance declares

  @test:schemas/editor-checker.test.ts::editor-checkers::declaredWithTypologyAndValidator
  Scenario: are declared: the directory, its typology node and its validator node
    Given the declaration folio-assistant-sci.json
    Then the directory with the editor-checkers typology is editor-checkers/
    And the typology node editor-checkers.json has kind "editor-checkers" and only the node schema "folio-editor-checker/v1"
    And the validator node editor-checker.json validates that kind and family
    And its schema is "folio-assistant-sci:schemas/editor-checker.ts#EditorCheckerKind"

  @test:schemas/editor-checker.test.ts::editor-checkers::atLeastOneEachPassesSchema
  Scenario: there is at least one, and each passes its schema
    Given the JSON nodes in editor-checkers/
    Then there is at least one
    And each passes EditorCheckerNodeSchema with no issues
    And each file is named for the node's id

  @test:schemas/editor-checker.test.ts::editor-checkers::eachServesDeclaredContentType
  Scenario: each serves a content type this instance declares an adapter for
    Given the JSON nodes in editor-checkers/
    Then each node's content type is one this instance declares a content adapter for

  @test:schemas/editor-checker.test.ts::editor-checkers::codeRefsResolveToFunctions
  Scenario: each code ref resolves to an exported function
    Given every code ref of every editor-checker node
    When each ref's module is imported
    Then the export it names is a function

  @test:schemas/editor-checker.test.ts::editor-checkers::refusesClimbingPath
  Scenario: the schema refuses a path that climbs out of the instance
    Given the first editor-checker node with its check set to "../cat-harness-tools/x.ts#f"
    Then EditorCheckerNodeSchema refuses it
