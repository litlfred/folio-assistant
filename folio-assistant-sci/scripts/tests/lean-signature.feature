Feature: leanSignatures — a hash of what Lean declarations claim, and QA freshness at statement granularity

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::invariantUnderProofRewrite
  Scenario: is invariant under a proof-body rewrite
    Given two theorems foo and bar, and the same two with different proofs
    Then their signatures are equal

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::changesWithSignature
  Scenario: changes when a signature changes
    Given the same theorems with foo's argument changed from Nat to Int
    Then the signatures differ

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::changesWhenTailAfterAssignChanges
  Scenario: changes when a statement contains `:=` and its TAIL changes
    Given "theorem t : (let x := 5; x) = 5" and the same with "= 6"
    Then the signatures differ

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::structureInstanceNoTruncate
  Scenario: a structure instance in the statement does not truncate it
    Given "theorem t : ({ a := 1 } : Foo).a = 1" and the same with "= 2"
    Then the signatures differ

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::invariantWhenStatementHasAssign
  Scenario: still invariant under a proof rewrite when the statement holds `:=`
    Given "theorem t : (let x := 5; x) = 5" proved by rfl and by simp
    Then the signatures are equal

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::changesOnRename
  Scenario: changes when a declaration is RENAMED
    Given the theorems with foo renamed to foo'
    Then the signatures differ

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::ignoresComments
  Scenario: ignores comments, including doc comments
    Given the theorems with a doc comment and a trailing line comment added
    Then the signature equals the uncommented one

  @test:scripts/tests/lean-signature.test.ts::leanSignatures::undefinedWithoutDecls
  Scenario: returns undefined when there are no lexable declarations
    Then the signature of a file with only import and open lines is undefined
    And the signature of an empty file is undefined

  @test:scripts/tests/lean-signature.test.ts::entryIsFresh_—_lean_granularity::statementFreshAfterProofRewrite
  Scenario: statement granularity survives a proof-body rewrite
    Given a QA entry recorded against the hashes of b.lean
    When b.lean's proofs are rewritten
    Then the file hash changes
    And the entry is fresh at statement granularity
    And it is not fresh at file granularity, nor at the default granularity

  @test:scripts/tests/lean-signature.test.ts::entryIsFresh_—_lean_granularity::statementStaleOnSignatureChange
  Scenario: statement granularity DOES invalidate on a signature change
    Given a QA entry recorded against the hashes of b.lean
    When foo's signature changes
    Then the entry is not fresh at statement granularity

  @test:scripts/tests/lean-signature.test.ts::entryIsFresh_—_lean_granularity::legacyEntryFallsBackToFileHash
  Scenario: falls back to the whole-file hash when the entry predates lean_statement
    Given a QA entry recording only the file hash of b.lean
    When b.lean's proofs are rewritten
    Then the entry is not fresh at statement granularity

  @test:scripts/tests/lean-signature.test.ts::entryIsFresh_—_lean_granularity::noDeclsFallsBack
  Scenario: falls back when the file has no lexable declarations
    Given b.lean with only an import, whose hashes have no lean_statement
    When an "open Nat" line is added
    Then the entry recorded before is not fresh at statement granularity
