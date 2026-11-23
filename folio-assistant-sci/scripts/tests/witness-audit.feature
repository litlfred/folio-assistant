Feature: witness-audit — staleness of Lean and Python computation witnesses

  @test:scripts/tests/witness-audit.test.ts::witness-audit::auditsLeanWitnessStates
  Scenario: audits Lean witnesses: fresh, stale hash, malformed JSON, and pending files
    Given a folio chapter with Fresh.lean and a witness named for its content hash, holding a commitSha
    And Stale.lean with a witness named for another hash
    And Malformed.lean with a witness, named for its hash, that is not valid JSON
    And Pending.lean with no witness
    When auditLeanWitnesses reads the root
    Then it returns 3 entries
    And Fresh.lean is not stale and has a commit sha
    And Stale.lean is stale with a reason containing "content hash mismatch"
    And Malformed.lean is stale with the reason "malformed witness file"
    When runAudit runs on the root for Lean only
    Then it counts 4 Lean files: 1 witnessed, 2 stale and 1 pending
    And it counts 0 Python witnesses

  @test:scripts/tests/witness-audit.test.ts::witness-audit::auditsPythonWitnessStates
  Scenario: audits Python witnesses: structured fresh, stale scriptHash, legacy format, and malformed JSON
    Given a computations directory with a structured witness for calc_alpha.py whose scriptHash matches, with one assertion and a commitSha
    And a structured witness for calc_beta.py whose scriptHash does not match
    And a legacy witness with only git_sha and result
    And a witness file that is not valid JSON
    When auditPythonWitnesses reads the root
    Then it returns 4 entries
    When runAudit runs on the root for Python only
    Then it counts 4 Python witnesses: 2 structured, 2 legacy, 2 stale, 1 with assertions and 2 with a commit sha
    And it lists no Lean entries

  @test:scripts/tests/witness-audit.test.ts::witness-audit::gitFileShasPassesPathsAsData
  Scenario: gitFileShas passes paths with shell metacharacters to git as data
    Given a git repository with one commit holding files whose names contain $( ), ;, backticks, a space, a quote, *, & and |, and an accented letter
    And a file jX.lean that a glob pathspec would match
    When gitFileShas is asked for those names
    Then each name maps to the commit's sha, and there is one entry per name
    And the directory holds only the committed files, so no shell created anything
