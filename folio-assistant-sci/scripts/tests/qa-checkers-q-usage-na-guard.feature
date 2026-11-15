Feature: the q-usage regime detector's na-guard ignores label metadata in the .ts manifest

  @test:scripts/tests/qa-checkers-q-usage-na-guard.test.ts::detectRegimes_—_the_word-boundary_q_na-guard_ignores_`.ts`_label_metadata::qInUsesLabelOnlyIsNa
  Scenario: q-free block whose only 'q' is a uses[] label → na (not symbolic)
    Given a .md with no q in it
    And a .ts whose only "q" is in the uses[] label "rem:toffoli-q-and"
    When detectRegimes classifies the block
    Then the regimes are exactly "na"

  @test:scripts/tests/qa-checkers-q-usage-na-guard.test.ts::detectRegimes_—_the_word-boundary_q_na-guard_ignores_`.ts`_label_metadata::qMathInMdStillDetected
  Scenario: real q-math in the .md is still detected (na-guard does not over-strip)
    Given a .md with the Hecke relation in q
    And a .ts with no q
    When detectRegimes classifies the block
    Then the regimes do not include "na"
    And they include "symbolic"

  @test:scripts/tests/qa-checkers-q-usage-na-guard.test.ts::detectRegimes_—_the_word-boundary_q_na-guard_ignores_`.ts`_label_metadata::qMathInTsTitleStillDetected
  Scenario: real q-math in a .ts title is still detected via MENTIONS_Q_RE
    Given a .md with no q
    And a .ts whose title is "The $q$-deformation"
    When detectRegimes classifies the block
    Then the regimes do not include "na"

  @test:scripts/tests/qa-checkers-q-usage-na-guard.test.ts::no_shipped_chapter-profile_default::loadingConfiguresNoChapterProfiles
  Scenario: loading the checker configures nothing
    Given the chapter-profile registry reset
    When the q-usage checker module is imported
    Then no chapter profiles are configured
    And there are no archimedean chapters
