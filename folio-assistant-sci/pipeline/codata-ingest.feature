Feature: CODATA ingestion — NIST's fixed-width table becomes exact, addressable values

  @test:pipeline/codata-ingest.test.ts::parsing_NIST's_table::parsesValueAsDecimalString
  Scenario: grouping spaces go, the exponent stays, the value stays a decimal STRING
    Given four real rows of NIST's CODATA 2022 table
    When parseCodataAscii parses them
    Then electron-mass is quantity "electron mass", value "9.1093837139e-31", uncertainty "0.0000000028e-31", unit "kg", not exact

  @test:pipeline/codata-ingest.test.ts::parsing_NIST's_table::inverseAlphaIs2022Value
  Scenario: CODATA 2022 1/alpha — not the 2018 value 137.035999084
    Given the parsed sample rows
    Then inverse-fine-structure-constant has value "137.035999177" and no unit

  @test:pipeline/codata-ingest.test.ts::parsing_NIST's_table::exactHasNoUncertainty
  Scenario: (exact) is exact, with no uncertainty
    Given the parsed sample rows
    Then speed-of-light-in-vacuum has value "299792458", no uncertainty, is exact, and has unit "m s^-1"

  @test:pipeline/codata-ingest.test.ts::parsing_NIST's_table::slugsMechanicalCollisionRefused
  Scenario: slugs are mechanical, and a collision is refused
    Then the slug of "electron mass energy equivalent in MeV" is "electron-mass-energy-equivalent-in-mev"
    And parsing rows named "a-b" and "a b" throws "names both"

  @test:pipeline/codata-ingest.test.ts::the_committed_library/codata-2022_entry::entryCarriesWholeTableWithProvenance
  Scenario: carries the whole table, with its provenance
    Given the committed library/codata-2022 values.json and tabular.jsonld
    Then values.json has as many values as the sheet has rows, and that is more than 300
    And the source edition is "CODATA 2022", its primary URL is on physics.nist.gov, it was obtained from SciPy, and its sha256 is 64 hex digits

  @test:pipeline/codata-ingest.test.ts::the_committed_library/codata-2022_entry::entryHoldsPublishedValues
  Scenario: known CODATA 2022 values, as published
    Given the committed library/codata-2022 values.json
    Then electron-mass-energy-equivalent-in-mev is "0.51099895069"
    And inverse-fine-structure-constant is "137.035999177"
    And planck-constant is "6.62607015e-34"

  @test:pipeline/codata-ingest.test.ts::the_committed_library/codata-2022_entry::sampleRebuildsToEntryRecords
  Scenario: the sample rows rebuild to the same records the entry holds
    When buildCodataEntry builds an entry from the sample rows
    Then every record in its values.json equals the committed entry's record of the same slug
