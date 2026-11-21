Feature: checkEditorializing over this instance's milnorlink library entry

  @test:scripts/tests/qa-checkers-voice.test.ts::checkEditorializing_—_proof_economy_is_not_an_opinion_(bean_2t41)::milnorlinkExemplarScoresOneFinding
  Scenario: the exemplar scores exactly ONE finding — not zero
    Given the milnorlink entry of this instance's declared libraries
    Then the entry is found
    When checkEditorializing runs over every .md file in its sections directory
    Then the hits add up to exactly 1
