Feature: the formal-edge driver's parts that need no Lean

  @test:pipeline/formal-edges.test.ts::the_shipped_template::templateHasMarkerOnce
  Scenario: carries the imports marker exactly once
    Given the shipped extractor template
    Then it contains the imports marker exactly once

  @test:pipeline/formal-edges.test.ts::the_shipped_template::templateReadsBothEnvVars
  Scenario: reads both environment variables the driver sets
    Given the shipped extractor template
    Then it names "FORMAL_EDGES_TAGGED" and "FORMAL_EDGES_OUT"

  @test:pipeline/formal-edges.test.ts::the_shipped_template::templateReportsMissingNames
  Scenario: reports missing tagged names rather than dropping them
    Given the shipped extractor template
    Then it writes ("missing", Json.bool true)

  @test:pipeline/formal-edges.test.ts::fillTemplate::fillPutsOneImportPerModule
  Scenario: puts one import per module where the marker was
    When fillTemplate fills a template with a doc comment, the marker and "import Lean" with the modules A.B and C
    Then the result is the doc comment, "import A.B", "import C" and "import Lean"

  @test:pipeline/formal-edges.test.ts::fillTemplate::fillRefusesNoMarker
  Scenario: refuses a template with no marker, rather than running with no imports
    When fillTemplate fills "import Lean" with module A
    Then it throws, naming the imports marker

  @test:pipeline/formal-edges.test.ts::builtModules::builtModulesFromOleansSorted
  Scenario: names every .olean under .lake/build/lib/lean as a dotted module, sorted
    Given a project with QOU.olean, QOU/Mass/Tower.olean and QOU/Mass/Tower.ilean under .lake/build/lib/lean
    When builtModules reads it
    Then the modules are QOU and QOU.Mass.Tower

  @test:pipeline/formal-edges.test.ts::builtModules::unbuiltProjectHasNoModules
  Scenario: an unbuilt project has no modules (the CLI treats that as could-not-determine)
    When builtModules reads a project that was never built
    Then there are no modules

  @test:pipeline/formal-edges.test.ts::toIngestRecords::missingDeclNeverEmptyRecord
  Scenario: a missing declaration never becomes a record with no dependencies
    Given extractor rows for Q.b, a missing Q.gone, and Q.a
    When toIngestRecords converts them
    Then Q.gone is reported missing
    And the records are for Q.b and Q.a only

  @test:pipeline/formal-edges.test.ts::toIngestRecords::depsSortedLeanPathCarried
  Scenario: dependencies are sorted and the block's lean path is carried
    When toIngestRecords converts the same rows, with Q.b's lean path "folio/p/b.lean"
    Then Q.b's record has type_deps Q.a, Q.z, no value_deps and lean_path "folio/p/b.lean"
    And Q.a's record has no dependencies and no lean path
