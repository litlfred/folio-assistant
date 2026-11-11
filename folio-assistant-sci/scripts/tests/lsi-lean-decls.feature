Feature: LSI over Lean declarations — declaration units and the lean-decl lsi:near provider

  @test:scripts/tests/lsi-lean-decls.test.ts::one_Lean_source::declsQualifiedByNamespaceModule
  Scenario: declarations are qualified by their namespace and module
    Given a Lean source with a def and a theorem in namespace QOU.Mass and a _root_ theorem topLevelFact
    When declUnitsOf reads it as module QOU.Mass.Markov
    Then the unit ids are QOU.Mass.markovZ_conventionD, QOU.Mass.markovZ_pos and topLevelFact, each "@QOU.Mass.Markov"

  @test:scripts/tests/lsi-lean-decls.test.ts::one_Lean_source::unitHasDocNameSignatureNotProof
  Scenario: a unit carries the doc comment, the split name and the signature — not the proof
    When declUnitsOf reads the same source
    Then the def's text contains its doc comment and the words "markov z convention d"
    And the theorem's text contains neither its proof's "positivity" nor the line comment above it

  @test:scripts/tests/lsi-lean-decls.test.ts::one_Lean_source::nameWordsSplitsCamelUnderscore
  Scenario: nameWords splits camel case and underscores
    Then nameWords of "QOU.Mass.markovZ_conventionD" is "markov z convention d"
    And nameWords of "HTMLParser_ok" is "html parser ok"

  @test:scripts/tests/lsi-lean-decls.test.ts::one_Lean_source::docCommentAcrossAttributesNotLine
  Scenario: a doc comment is found across attributes and modifiers, and a line comment is not one
    Then the doc comment before "@[simp] noncomputable def x" under "/-- doc -/" is "doc"
    And the doc comment before a def under a "--" line comment is empty

  @test:scripts/tests/lsi-lean-decls.test.ts::a_Lean_root::modulesFromPathSkipLakeCountDuplicates
  Scenario: modules come from the path, .lake is skipped, and a repeated id is counted not overwritten
    Given a Lean root with QOU/Mass/Markov.lean, which declares topLevelFact twice, and .lake/packages/Skip.lean
    When declUnits reads the root
    Then it reads 1 file
    And the units include topLevelFact@QOU.Mass.Markov and nothing from Skip.lean
    And the duplicates are exactly topLevelFact@QOU.Mass.Markov

  @test:scripts/tests/lsi-lean-decls.test.ts::lsiNearUnits_(the_`lean-decl`_provider_for_cross-graph_lsi:near)::noLeanRootNotSearched
  Scenario: with no Lean root it is not searched, never an empty index
    When lsiNearUnits is called with no roots
    Then it says it was not searched: "no Lean root given (--root lean-decl=<dir>)"
    And it returns no units

  @test:scripts/tests/lsi-lean-decls.test.ts::lsiNearUnits_(the_`lean-decl`_provider_for_cross-graph_lsi:near)::namespacedAndFullIdAreRefs
  Scenario: a namespaced name and the full id are explicit references; a bare top-level name is not
    Given a Lean root with the source at QOU/Mass/X.lean
    When lsiNearUnits is called with that root
    Then its build options are DECL_INDEX_OPTIONS
    And both "QOU.Mass.markovZ_pos" and "QOU.Mass.markovZ_pos@QOU.Mass.X" are reference keys for QOU.Mass.markovZ_pos@QOU.Mass.X
    And a top-level declaration's bare name, if there is one, is no reference key
