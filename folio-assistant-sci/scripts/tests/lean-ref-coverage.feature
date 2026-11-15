Feature: lean.ref resolution into the Lean library tree, and coverage of library files no block references

  @test:scripts/tests/lean-ref-coverage.test.ts::lean.ref_candidate-2_(library_tree)_resolution::siblinglessBlockResolvesToLibraryAudited
  Scenario: sibling-less block resolves to the Lake-tree file and is audited
    Given the qou package configured on a workspace Lake tree, and the braids-and-knots chapter configured categorical
    And a library file QOU/BraidKnot/TauQuantumIntegerForm.lean typing CommRing-universal identities over ℝ
    And a block in braids-and-knots with no sibling .lean whose lean.ref names that module
    When walkBlocks walks the folio
    Then the block's lean file is the library file
    And checkWallSide fails on it
    And the archimedean-in-categorical-chapter check fails, with chapter "braids-and-knots"

  @test:scripts/tests/lean-ref-coverage.test.ts::lean.ref_candidate-2_(library_tree)_resolution::directModulePathResolves
  Scenario: direct module-path resolution (candidate 2a)
    Given the library file QOU/FluidDynamics/qBkm.lean
    Then resolveCanonicalLean resolves "qou:QOU.FluidDynamics.qBkm" to that file

  @test:scripts/tests/lean-ref-coverage.test.ts::lean.ref_candidate-2_(library_tree)_resolution::siblingWinsOverLibrary
  Scenario: sibling (candidate 1) wins over the library tree
    Given a library file QOU/BraidKnot/Dup.lean and a block dup with a sibling dup.lean, whose lean.ref names that module
    When walkBlocks walks the folio
    Then the block's lean file is the sibling braids-and-knots/dup.lean, not the library file

  @test:scripts/tests/lean-ref-coverage.test.ts::lean.ref_candidate-2_(library_tree)_resolution::declRefResolvesToLeafNotAggregator
  Scenario: decl-named ref resolves to the leaf decl file, NOT an import-only aggregator (candidate c)
    Given an import-only QOU/BraidKnot.lean and a leaf QOU/BraidKnot/BindingIsovectorChiralResidue.lean declaring binding_isovector_mirror_from_chiral
    When resolveCanonicalLean resolves "qou:QOU.BraidKnot.binding_isovector_mirror_from_chiral"
    Then it resolves to the leaf file, not QOU/BraidKnot.lean

  @test:scripts/tests/lean-ref-coverage.test.ts::lean.ref_candidate-2_(library_tree)_resolution::directModulePathWinsWhenDeclares
  Scenario: (a) direct module-path still wins when the module file declares the decl
    Given QOU/Basic.lean declaring foo in namespace QOU
    Then resolveCanonicalLean resolves "qou:QOU.Basic.foo" to QOU/Basic.lean

  @test:scripts/tests/lean-ref-coverage.test.ts::lean.ref_candidate-2_(library_tree)_resolution::nonexistentDeclNoAggregatorFallback
  Scenario: ref naming a nonexistent decl does NOT fall back to an import-only root
    Given an import-only QOU.lean and QOU/Some/Module.lean declaring genId
    Then "qou:QOU.NoSuchDeclAnywhere" resolves to nothing
    And "qou:QOU.Some.Module.genId" resolves to QOU/Some/Module.lean

  @test:scripts/tests/lean-ref-coverage.test.ts::lean.ref_candidate-2_(library_tree)_resolution::unknownOrMalformedRefUndefined
  Scenario: unknown package / malformed ref resolves to undefined
    Then "nope:QOU.X", "malformed-no-colon" and no ref each resolve to nothing

  @test:scripts/tests/lean-ref-coverage.test.ts::orphan_library-tree_coverage::orphanMixedFlaggedReferencedSkipped
  Scenario: an orphan mixed-substrate file is flagged; a referenced file is not scanned
    Given a referenced generic-R library file and an unreferenced OrphanMixed.lean holding both generic-R and archimedean lemmas
    When scanOrphanLeanFiles scans with the referenced file covered
    Then it scans 2 files and finds 1 orphan
    And there is exactly 1 wall-side-correct finding, on OrphanMixed.lean
    And no finding is on the referenced file

  @test:scripts/tests/lean-ref-coverage.test.ts::orphan_library-tree_coverage::cleanGenericOrphanNoFindings
  Scenario: a clean generic-R orphan produces no findings (no path-based over-firing)
    Given an unreferenced generic-R file QOU/BraidKnot/CleanGeneric.lean
    When scanOrphanLeanFiles scans with nothing covered
    Then it finds 1 orphan and no findings

  @test:scripts/tests/lean-ref-coverage.test.ts::orphan_library-tree_coverage::listsEveryLeanInLakeTree
  Scenario: listPackageLeanFiles enumerates every .lean across the Lake tree
    Given library files QOU/A/One.lean and QOU/B/Two.lean
    Then listPackageLeanFiles lists both
