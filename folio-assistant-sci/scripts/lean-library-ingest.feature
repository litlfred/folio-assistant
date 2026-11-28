Feature: lean-library-ingest — a Lean library is linearised in an order its imports allow

  @test:scripts/lean-library-ingest.test.ts::a_Lean_library_is_linearised_in_an_order_its_imports_allow::parsesImportsDocstringsAndDecls
  Scenario: a module's imports, docstring and declarations are read from source
    Given a module importing Lib.Base with a module docstring titled "Core" and a documented theorem
    When parseModule reads it
    Then its imports, title and declaration with docstring are recorded

  @test:scripts/lean-library-ingest.test.ts::a_Lean_library_is_linearised_in_an_order_its_imports_allow::everyModuleFollowsItsImports
  Scenario: every module comes after the modules it imports
    Given four modules where Heavy imports Core and both import Base
    When topoOrder orders them
    Then Base is first and Core precedes Heavy

  @test:scripts/lean-library-ingest.test.ts::a_Lean_library_is_linearised_in_an_order_its_imports_allow::chaptersAreSubdirectoriesInDependencyOrder
  Scenario: chapters are subdirectories, ordered by the chapter-level import DAG
    Given a subdirectory A whose modules Heavy imports
    When chapters groups and orders them
    Then Base precedes A and A precedes Heavy

  @test:scripts/lean-library-ingest.test.ts::a_large_library_is_split_into_parts,_and_short_topics_are_gathered::smallItemsAreGatheredIntoOnePart
  Scenario: consecutive short topics are gathered into one part
    Given a library of five loose files and one directory of four modules, over the chapter threshold
    When parts splits it
    Then there are two parts, one of which is the directory
