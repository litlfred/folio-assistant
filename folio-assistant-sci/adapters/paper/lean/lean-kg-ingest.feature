Feature: lean-kg-ingest — turning doc-gen4 doc-data into the Lean KG viewer's data

  @test:adapters/paper/lean/lean-kg-ingest.test.ts::lean-kg-ingest::moduleOfDocPathMapsModuleFragment
  Scenario: moduleOfDocPath maps doc-gen4 paths to module + fragment
    Then "./QOU/Mass/X.html#QOU.Mass.X.y" maps to module "QOU.Mass.X" and fragment "QOU.Mass.X.y"
    And "./foundational_types.html" maps to nothing

  @test:adapters/paper/lean/lean-kg-ingest.test.ts::lean-kg-ingest::rewriteHeaderRoutesLinks
  Scenario: rewriteHeader routes kept modules to the viewer and the rest to the external docs
    Given the header of QOU.A.x, linking to itself and to Mathlib's Field
    When rewriteHeader rewrites it keeping the root "qou" with external docs at "https://ext/"
    Then the link to QOU.A.x is "#/m/QOU.A/QOU.A.x"
    And the link to Field is "https://ext/Mathlib/Algebra/Field/Defs.html#Field"

  @test:adapters/paper/lean/lean-kg-ingest.test.ts::lean-kg-ingest::ingestPrunesChunksLinks
  Scenario: ingest prunes to kept roots, chunks signatures, links lean.ref blocks
    Given doc-data for QOU.A (2 declarations), QOU.Big (CHUNK_SIZE + 3) and a Mathlib module
    And a content block prop:x whose lean.ref is "qou:QOU.A.x"
    When ingest runs keeping the module root QOU
    Then it reports 2 modules, 2 + CHUNK_SIZE + 3 declarations and 1 formalized
    And index.json lists QOU.A and QOU.Big, with QOU.Big in 2 chunks
    And the QOU.Big files are QOU.Big.0.sig.json, QOU.Big.1.sig.json and QOU.Big.jsonld
    And in QOU.A.jsonld, QOU.A.x formalizes block:prop:x with md "ch/blk.md"

  @test:adapters/paper/lean/lean-kg-ingest.test.ts::lean-kg-ingest::overlayWritesOnlyChangedModules
  Scenario: overlay mode writes only changed modules
    Given a base ingest of the fixture
    And QOU.A's doc-data then changed to a single declaration QOU.A.z
    When ingest runs again with that base and its index
    Then it writes 1 module and leaves 1 unchanged
    And overlay.json lists only QOU.A as changed
    And no QOU.Big file is written

  @test:adapters/paper/lean/lean-kg-ingest.test.ts::lean-kg-ingest::refusesNonDocGenDir
  Scenario: ingest refuses a directory that is not doc-gen4 doc-data
    When ingest runs on an empty directory
    Then it throws "not a doc-gen4"

  @test:adapters/paper/lean/lean-kg-ingest.test.ts::signatureStyles::signatureStylesScopedDropsLayout
  Scenario: keeps custom properties and signature rules, scoped; drops page layout
    Given CSS with rules for *, body, nav, :root, .decl_header and ".fn, .impl_arg", and a dark-mode media query
    When signatureStyles filters it
    Then it keeps ":root{ --x: 1 }"
    And it scopes .decl_header and .impl_arg under .lkg-sig
    And it has no rule for body, nav or *
    And it keeps the media query with only its :root rule
