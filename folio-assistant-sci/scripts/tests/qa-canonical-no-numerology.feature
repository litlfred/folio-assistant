Feature: canonical-no-numerology — a numerical match is not asserted as significant

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::flagsNumerologyAsSignificant
  Scenario: flags numerology asserted as significant
    Given a block saying the predicted ratio "miraculously agrees" with the measured value
    When checkCanonicalNoNumerology checks it
    Then it fails

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::flagsHappensToEqual
  Scenario: flags a bare happens-to-equal claim
    Given a block saying the constant "happens to equal" the observed slope, which supports it
    When checkCanonicalNoNumerology checks it
    Then it fails

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::passesDisclaimedCoincidence
  Scenario: does NOT flag prose that disclaims the coincidence
    Given a block calling it "a numerical coincidence at an unrelated anchor, not a parameter-free evaluation"
    When checkCanonicalNoNumerology checks it
    Then it passes

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::seesWrappedDisclaimer
  Scenario: sees a disclaimer that wraps onto a later line
    Given a paragraph whose "numerical coincidence" line is followed by "it does not determine the constant" on the next line
    When checkCanonicalNoNumerology checks it
    Then it passes

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::otherParagraphDisclaimerNoLaunder
  Scenario: a disclaimer in a DIFFERENT paragraph does not launder a claim
    Given a paragraph saying the ratio "miraculously agrees", and a disclaimer only in the next paragraph
    When checkCanonicalNoNumerology checks it
    Then it fails

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::negationAloneNoSuppress
  Scenario: negation alone does not suppress a boast
    Given a block saying the agreement "is not accidental" and the match "is miraculous"
    When checkCanonicalNoNumerology checks it
    Then it fails

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::reportsPhraseLine
  Scenario: reports the line the phrase is actually on
    Given a block whose fourth line says "the fit is miraculous here"
    When checkCanonicalNoNumerology checks it
    Then it fails
    And its first hit is on line 4

  @test:scripts/tests/qa-canonical-no-numerology.test.ts::checkCanonicalNoNumerology::cleanProsePasses
  Scenario: clean prose passes
    Given a block saying "The bound follows from the lemma."
    When checkCanonicalNoNumerology checks it
    Then it passes
