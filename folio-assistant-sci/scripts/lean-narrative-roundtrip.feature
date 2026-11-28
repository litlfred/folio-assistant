Feature: lean-narrative-roundtrip — a narrative names only declarations its library proves

  @test:scripts/lean-narrative-roundtrip.test.ts::a_narrative_names_only_declarations_its_library_proves::declaredNamesTrackNamespaces
  Scenario: declared names are qualified by their enclosing namespaces
    Given a Lean module with a namespace, a section inside it and a _root_ declaration
    When declaredNames reads it
    Then each name carries its namespace, and _root_ names carry none

  @test:scripts/lean-narrative-roundtrip.test.ts::a_narrative_names_only_declarations_its_library_proves::mainDeclarationsReadTheModuleDocstring
  Scenario: a module's main declarations are read from its docstring
    Given a docstring listing Main definitions and Main results, two names on one bullet
    When mainDeclarations reads it
    Then every listed name is returned

  @test:scripts/lean-narrative-roundtrip.test.ts::a_narrative_names_only_declarations_its_library_proves::leanAndSourceLinesAreRead
  Scenario: a block's Lean and Source lines are read, with the module shorthand
    Given a block whose Source line cites `Lib.Codes`, `.Other`
    When the lines are read
    Then the Lean names are listed and `.Other` expands to Lib.Other

  @test:scripts/lean-narrative-roundtrip.test.ts::a_narrative_names_only_declarations_its_library_proves::unknownNameFailsAndMissingMainResultWarns
  Scenario: an unknown name fails, and an unstated main result of a cited module warns
    Given a block naming a declaration the library does not have, and a block citing a module whose main definition no block states
    When judge rules on them
    Then the first fails and the second warns, naming the unstated definition
