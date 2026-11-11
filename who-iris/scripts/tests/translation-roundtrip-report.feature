Feature: The translation round-trip report and the attestations it is built from
  The untainted round-trip report is derived from the agents' rulings, kept as
  translation-qa attestations, and today's translation catalogues for ar, es,
  fr, ru and zh.

  @test:scripts/tests/translation-roundtrip-report.test.ts::translation_round-trip_report::buildsFromAttestations
  Scenario: it builds from the attestations and today's catalogues
    When the report is built
    Then its schema is "qa-results/v1"
    And its totals are keyed by exactly ar, es, fr, ru and zh

  @test:scripts/tests/translation-roundtrip-report.test.ts::translation_round-trip_report::backTranslatorsUseReadWriteOnly
  Scenario: every back-translator reports Read and Write only
    When the report is built
    Then every locale's family summary contains "Back-translator tools: Read,Write."

  @test:scripts/tests/translation-roundtrip-report.test.ts::translation_round-trip_report::rulingsMayRunAheadButNotBehind
  Scenario: rulings may be recorded ahead of the strings, never behind them
    Given rulings indexed 0, 1 and 2 for a catalogue of 2 strings
    Then the rulings used are those indexed 0 and 1
    And 2 rulings for 3 strings is an error that says to re-run the agents
    And rulings indexed 0 and 2 for 2 strings is an error that says they are not in catalogue order

  @test:scripts/tests/translation-roundtrip-report.test.ts::translation_round-trip_report::parsePoJoinsLinesSkipsHeader
  Scenario: parsePo joins continuation lines and skips the header
    Given a PO text with a header entry and one entry whose msgid "a " continues on the next line with "b"
    When it is parsed as "x.po"
    Then the result is the single entry with catalogue "x.po", msgid "a b" and msgstr "c"

  @test:scripts/tests/translation-roundtrip-report.test.ts::the_agents'_rulings_are_attestations::attestationPerCatalogueAndLocale
  Scenario: one translation-qa file per catalogue and locale, a ruling for every string, each a judgement
    Given each of the five locales and each of the catalogues site/iris-site.po and glossary/who-iris--who-terms.po
    Then a translation-qa attestations file exists for that catalogue and locale
    And its schema is "qa-attestations/v1", its family "translation-qa" and its locale that locale
    And its subject is the translation catalogue at translations/<locale>/<catalogue>
    And its first entries are indexed one per string of that translated catalogue, in order (rulings for strings not on this branch yet may follow)
    And the run and every entry have a reviewer of kind "agent"
    And the run's back-translation trailer says tools used were "Read,Write"

  @test:scripts/tests/translation-roundtrip-report.test.ts::the_agents'_rulings_are_attestations::derivedReportNotCommitted
  Scenario: the derived report is no longer committed beside them
    When git lists the tracked files under test/results
    Then the list is empty
