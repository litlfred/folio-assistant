Feature: q-usage-archimedean-in-categorical-chapter — precision, noncomputable, and declaration-scoped attribution

  @test:scripts/tests/qa-checkers-q-usage.test.ts::checkQUsageArchimedeanInCategoricalChapter_—_precision::realInLeanCommentIsProse
  Scenario: Real.* inside a Lean comment is prose, not a wall crossing
    Given braids-and-knots and appendix-surreals configured as categorical chapters
    And a Lean file in appendix-surreals that mentions Real.exp and Real.log only in comments
    When the check runs on it
    Then it passes with no hits

  @test:scripts/tests/qa-checkers-q-usage.test.ts::checkQUsageArchimedeanInCategoricalChapter_—_precision::realInCodeStillReported
  Scenario: Real.* in real code is still reported
    Given a Lean file in appendix-surreals defining f (q : ℝ) := Real.exp q
    When the check runs on it
    Then it fails with at least one hit

  @test:scripts/tests/qa-checkers-q-usage.test.ts::checkQUsageArchimedeanInCategoricalChapter_—_precision::leanWithoutQOutOfScope
  Scenario: a Lean file that never mentions q is out of this criterion's scope
    Given a Lean file in braids-and-knots using Real.cos and Real.pi with no q
    When the check runs on it
    Then it passes

  @test:scripts/tests/qa-checkers-q-usage.test.ts::checkQUsageArchimedeanInCategoricalChapter_—_precision::qGateNotSuppressProseScan
  Scenario: the q-gate does NOT suppress the prose scan
    Given a Lean file with no q, and a .md quoting "a 203 ppm correction to the observed value"
    When the check runs on both
    Then it fails with a hit in the .md

  @test:scripts/tests/qa-checkers-q-usage.test.ts::checkQUsageArchimedeanInCategoricalChapter_—_`noncomputable`_is_not_archimedean::linarithOverQNotWallCrossing
  Scenario: linarith over ℚ in a file with no ℝ is not a wall crossing
    Given a Lean file with a noncomputable def and positivity and linarith proofs over ℚ, and no ℝ
    When the check runs on it
    Then it passes

  @test:scripts/tests/qa-checkers-q-usage.test.ts::checkQUsageArchimedeanInCategoricalChapter_—_`noncomputable`_is_not_archimedean::linarithBesideRealQFires
  Scenario: but linarith beside a genuine `q : ℝ` still fires
    Given a Lean file with trace (q : ℝ) and a linarith proof about it
    When the check runs on it
    Then it fails

  @test:scripts/tests/qa-checkers-q-usage.test.ts::declaration-scoped_attribution::blockNotAccountableForUnreached
  Scenario: a block is not accountable for declarations it does not reach
    Given Conjectures.lean whose surrealExp and surrealLog use Real.exp and Real.log, beside classes BigBangHeatDeath and KashaevSurreal
    And a block whose lean.ref is the class BigBangHeatDeath
    When the check runs on the block and the file
    Then it passes

  @test:scripts/tests/qa-checkers-q-usage.test.ts::declaration-scoped_attribution::blockAccountableForCalledHelpers
  Scenario: but IS accountable for the same-file helpers it calls
    Given a block whose lean.ref is the class KashaevSurreal, which calls surrealLog
    When the check runs on the block and the file
    Then a hit names Real.log

  @test:scripts/tests/qa-checkers-q-usage.test.ts::declaration-scoped_attribution::siblingLeanOwnedWhole
  Scenario: a SIBLING .lean is owned whole — adjacent theorems still count
    Given a block fer.ts whose ref names a theorem in fer.lean, and a def in that file using Real.sqrt q over ℝ
    When the check runs on the block and the file
    Then it fails

  @test:scripts/tests/qa-checkers-q-usage.test.ts::declaration-scoped_attribution::fileNamedAfterRefOwnedWhole
  Scenario: a file NAMED AFTER the ref is owned whole
    Given TrMHopf.lean holding the class TrMHopf and a theorem using Real.sqrt q
    And a block whose lean.ref is "qou:QOU.Braiding.TrMHopf"
    When the check runs on the block and the file
    Then it fails

  @test:scripts/tests/qa-checkers-q-usage.test.ts::declaration-scoped_attribution::unresolvableRefScansWholeFile
  Scenario: an unresolvable ref falls back to the whole file
    Given Lib.lean defining f (q : ℝ) := Real.exp q
    And a block whose lean.ref is "qou:QOU.NoSuchDeclaration"
    When the check runs on the block and the file
    Then it fails
