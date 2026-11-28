Feature: compute-lp-dual-present — a block's own LP witness must carry the dual certificate

  @test:scripts/tests/qa-checkers-lp-dual.test.ts::compute-lp-dual-present_—_fires_when_it_should::flagsOwnLpWitnessWithoutDuals
  Scenario: flags a block whose own LP script ships a witness with no dual fields
    Given a block labelled with an LP bound whose computation script is solve_operator_selection_lp.py
    And whose witness records no dual information
    When checkComputeLpDualPresent checks it
    Then it fails

  @test:scripts/tests/qa-checkers-lp-dual.test.ts::compute-lp-dual-present_—_fires_when_it_should::passesWithDualCertificate
  Scenario: passes the same block once the witness carries the certificate
    Given the same block with a witness carrying y0_star, y_star, primal_obj, dual_obj, duality_gap and active_set
    When checkComputeLpDualPresent checks it
    Then it passes

  @test:scripts/tests/qa-checkers-lp-dual.test.ts::compute-lp-dual-present_—_does_not_fire_on_OTHER_blocks'_references::lpTokenInRefFieldNotEvidence[${field}]
  Scenario Outline: an LP token in `<field>` is not evidence about this block
    Given a block that consumes an LP bound, whose computation solve_lp_thing.py ships a witness with no dual fields
    And its <field> field holds <value>
    When checkComputeLpDualPresent checks it
    Then it passes

    Examples:
      | field      | value                       |
      | uses       | ["prop:lp-duality-bound"]   |
      | cites      | ["prop:lp-duality-bound"]   |
      | interprets | "prop:lp-duality-bound"     |
      | examples   | ["ex:shadow-price-table"]   |
      | proofs     | ["proof:primal-dual-gap"]   |
      | defines    | ["def:lp-dual-witness"]     |

  @test:scripts/tests/qa-checkers-lp-dual.test.ts::compute-lp-dual-present_—_gating::naWithoutTsPath
  Scenario: n/a without a ts path
    When checkComputeLpDualPresent is called with no path
    Then the result is "n/a"

  @test:scripts/tests/qa-checkers-lp-dual.test.ts::compute-lp-dual-present_—_gating::passesWithoutWitness
  Scenario: passes a block with no witness at all
    Given a block about lp-duality with no computation
    When checkComputeLpDualPresent checks it
    Then it passes

  @test:scripts/tests/qa-checkers-lp-dual.test.ts::compute-lp-dual-present_—_gating::passesWhenLpOnlyContext
  Scenario: passes when the LP hint is only theoretical context, not the computation
    Given a block tagged "lp-duality" whose computation is mass_gap.py with a witness with no dual fields
    When checkComputeLpDualPresent checks it
    Then it passes
