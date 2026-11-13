Feature: lean_formal_edges is served to MCP servers from its Tool node

  @test:pipeline/formal-edges-mcp.test.ts::lean_formal_edges_is_served_from_its_Tool_node::dependencyTreeYieldsSciGroup
  Scenario: the folio's dependency tree yields sci's group for it
    Given the root of a folio whose dependency tree includes folio-assistant-sci
    When the served tool groups are read from that root
    Then folio-assistant-sci's groups include the module pipeline/formal-edges-mcp.ts

  @test:pipeline/formal-edges-mcp.test.ts::lean_formal_edges_is_served_from_its_Tool_node::registersFormalEdgesTool
  Scenario: registerServedToolGroups puts it on the server
    Given a server stand-in that records the tools registered on it
    When registerServedToolGroups runs from the folio root
    Then there are no failures
    And every outcome is "registered"
    And the server has the lean_formal_edges tool

  @test:pipeline/formal-edges-mcp.test.ts::lean_formal_edges_is_served_from_its_Tool_node::unbuiltProjectIsErrorCouldNotDetermine
  Scenario: an unbuilt project is reported as could-not-determine and flagged isError
    Given the lean_formal_edges tool registered on a recording server
    When it is called with a lake directory that does not exist and ingest off
    Then the result is flagged isError
    And its text says "could not determine formal edges"
