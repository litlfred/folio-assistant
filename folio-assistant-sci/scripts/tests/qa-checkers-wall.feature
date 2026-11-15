Feature: checkWallSide — the §7c archimedean wall and its acknowledgement

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::ackInAuthorNotesPasses
  Scenario: §7c note in authorNotes → pass (no .md acknowledgement)
    Given a .lean defining f : Real := Real.pi and a .md with no acknowledgement
    And a .ts whose authorNotes say "archimedean specialisation over R (§7c)."
    When checkWallSide checks them
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::noAckFails
  Scenario: no acknowledgement anywhere → fail (checker not neutered)
    Given the same .lean and .md, and a .ts with no notes
    When checkWallSide checks them
    Then it fails

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::bracketInNoteNoTruncate
  Scenario: ']' inside a note body does not truncate extraction of a later §7c note
    Given a .ts whose note has "[ref](x)" and "[1]" before "archimedean specialisation over R."
    When checkWallSide checks it with the same .lean and .md
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::overMathbbRAckCaseInsensitive
  Scenario: 'over \\mathbb{R}' acknowledgement in .md matches case-insensitively
    Given a .md saying "Defined over $\mathbb{R}$ here." and a .ts with no notes
    When checkWallSide checks it with the same .lean
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::genericRLeanPasses
  Scenario: algebraic .lean (generic R) is unaffected → pass
    Given a .lean defining f over a generic CommRing R
    When checkWallSide checks it
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::fieldRWithNormNumNotMixed
  Scenario: generic [Field R] closing a literal with norm_num is NOT a mixed-signal fail (bring-residue pattern)
    Given a .lean with a def over [Field R] and a norm_num example over ℚ, and no ℝ or Real
    When checkWallSide checks it
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::realTypeWithGenericRFlaggedMixed
  Scenario: genuine ℝ-TYPE marker (Real.*) alongside generic-R is still flagged as mixed
    Given a .lean with a generic CommRing R variable and a def t : Real := Real.pi, and no acknowledgement
    When checkWallSide checks it
    Then it fails

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::spacedRealWithGenericRFlagged
  Scenario: broadened ℝ detection: `(x : ℝ)` spaced form alongside generic-R is flagged
    Given a .lean with a generic CommRing R variable and a def m (x : ℝ) : ℝ, and no acknowledgement
    When checkWallSide checks it
    Then it fails

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_§7c_acknowledgement_via_.ts_authorNotes::mixedWithAckPasses
  Scenario: mixed-signal ACK-ESCAPE: `(x : ℝ)` + generic-R WITH a §7c ack → pass
    Given the same .lean and a .md saying "Archimedean specialisation (§7c)."
    When checkWallSide checks them
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_ack_branch_keyed_on_hasRealType,_not_tactic-inclusive_isArchimedean::tacticOnlyPasses
  Scenario: tactic-only block (norm_num, NO ℝ / Real / generic-R) → pass (false-positive drop)
    Given a .lean proving ℕ and ℤ facts by norm_num and positivity, and no acknowledgement
    When checkWallSide checks it
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_ack_branch_keyed_on_hasRealType,_not_tactic-inclusive_isArchimedean::colonlessRealNoAckFails
  Scenario: colonless bare-ℝ return type `→ ℝ` (no `: ℝ` token), no ack → fail (broadening)
    Given a .lean defining energy : ℕ → ℝ, and no acknowledgement
    When checkWallSide checks it
    Then it fails

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_ack_branch_keyed_on_hasRealType,_not_tactic-inclusive_isArchimedean::colonlessRealWithAckPasses
  Scenario: colonless bare-ℝ `→ ℝ` WITH a §7c ack → pass (ack escape)
    Given the same .lean and a .md saying "Archimedean specialisation (§7c)."
    When checkWallSide checks them
    Then it passes

  @test:scripts/tests/qa-checkers-wall.test.ts::checkWallSide_—_ack_branch_keyed_on_hasRealType,_not_tactic-inclusive_isArchimedean::realExpNoAckFails
  Scenario: Real.exp (real-analysis fn, subsumed by \bReal\b) with no ack → fail
    Given a .lean defining k (t : ℝ) : ℝ := Real.exp (-t), and no acknowledgement
    When checkWallSide checks it
    Then it fails
