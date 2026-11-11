Feature: a checker that cannot read its evidence does not say pass

  @test:scripts/tests/checker-missing-evidence.test.ts::checkCanonicalScriptNotDeprecated::scriptNotOnDiskIsNa
  Scenario: n/a when the declared script is not on disk
    Given a block that names a script that is not on disk
    When checkCanonicalScriptNotDeprecated checks it
    Then the result is "n/a" with a note saying "not found"

  @test:scripts/tests/checker-missing-evidence.test.ts::checkCanonicalScriptNotDeprecated::noScriptDeclaredPasses
  Scenario: pass when the block declares NO script — vacuously satisfied
    Given a block that names no script
    When checkCanonicalScriptNotDeprecated checks it
    Then it passes

  @test:scripts/tests/checker-missing-evidence.test.ts::checkCanonicalScriptNotDeprecated::noManifestIsNa
  Scenario: n/a when there is no manifest to read at all
    Then checkCanonicalScriptNotDeprecated gives "n/a" for no path and for a path that does not exist

  @test:scripts/tests/checker-missing-evidence.test.ts::checkCanonicalScriptNotDeprecated::deprecatedScriptFails
  Scenario: still FAILS on a script that is actually deprecated
    Given a block naming a script whose docstring says "DEPRECATED"
    When checkCanonicalScriptNotDeprecated checks it
    Then it fails

  @test:scripts/tests/checker-missing-evidence.test.ts::checkCanonicalScriptNotDeprecated::liveScriptPasses
  Scenario: passes on a live script
    Given a block naming a script that is not deprecated
    When checkCanonicalScriptNotDeprecated checks it
    Then it passes

  @test:scripts/tests/checker-missing-evidence.test.ts::checkComputeLpDualPresent::missingWitnessIsNa
  Scenario: n/a when the witness file is missing
    Given an LP block whose witness file does not exist
    When checkComputeLpDualPresent checks it
    Then the result is "n/a" with a note saying "not found"

  @test:scripts/tests/checker-missing-evidence.test.ts::checkComputeLpDualPresent::unparsableWitnessIsNa
  Scenario: n/a — not pass — when the witness does not parse
    Given an LP block whose witness is not valid JSON
    When checkComputeLpDualPresent checks it
    Then the result is "n/a" with a note saying "does not parse"

  @test:scripts/tests/checker-missing-evidence.test.ts::checkComputeLpDualPresent::nonLpBlockPasses
  Scenario: pass for a block that is not an LP computation at all
    Given a block whose computation is plain.py with a witness holding only a value
    When checkComputeLpDualPresent checks it
    Then it passes

  @test:scripts/tests/checker-missing-evidence.test.ts::checkComputeLpDualPresent::noManifestLpIsNa
  Scenario: n/a when there is no manifest
    Then checkComputeLpDualPresent gives "n/a" for no path
