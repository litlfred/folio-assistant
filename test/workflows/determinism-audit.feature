Feature: The determinism audit tells deterministic producers apart from the rest
  `.github/scripts/determinism-audit.sh` is run for real, with CI=true, in a
  throwaway git repository whose .gitignore ignores out/ and which has an
  index.config.json with no instances. Producers are given in
  AUDIT_PRODUCERS, one per line, and the report is read from OUT/report.md.

  @test:test/workflows/determinism-audit.test.ts::determinism_audit::deterministic,_clock-stamping_and_failing_producers_are_told_apart
  Scenario: Deterministic, clock-stamping and failing producers are told apart
    Given a producer "same" that writes "fixed" to out/a.txt
    And a producer "clock" that writes the current time in nanoseconds to out/t.txt
    And a producer "broken" that exits 7
    When the audit runs with an output directory outside the checkout
    Then the report contains "## `same` — DETERMINISTIC"
    And the report says "## `clock` — 1 of 1 files DIFFER"
    And the report contains "## `broken` — COULD NOT DETERMINE"
    And the audit exits 3

  @test:test/workflows/determinism-audit.test.ts::determinism_audit::a_producer's_writes_into_an_ignored_mount_are_put_back_by_every_reset
  Scenario: A producer's writes into an ignored mount are put back by every reset
    Given the repository also ignores mnt/, and mnt/f holds "a"
    And a producer "append" that appends "a" to mnt/f
    When the audit runs
    Then the report contains "## `append` — DETERMINISTIC"
    And mnt/f still holds "a"
    And the audit exits 0

  @test:test/workflows/determinism-audit.test.ts::determinism_audit::a_prerequisite's_writes_are_not_the_producer's,_and_a_failure's_log_is_in_the_report
  Scenario: A prerequisite's writes are not the producer's, and a failure's log is in the report
    Given a producer "reads" that copies out/in.txt to out/copy.txt, whose prerequisite stamps the time into out/clock.txt and writes "fixed" to out/in.txt
    And a producer "noisy" that prints "the reason it failed" to stderr and exits 4
    When the audit runs
    Then the report contains "## `reads` — DETERMINISTIC"
    And the report contains "## `noisy` — COULD NOT DETERMINE"
    And the report contains "the reason it failed"

  @test:test/workflows/determinism-audit.test.ts::determinism_audit::a_declared_run_record_is_carried,_not_compared;_the_rest_must_still_match
  Scenario: A declared run record is carried, not compared, and the rest must still match
    Given a producer "stamped" that writes "fixed" to out/a.txt and the time to out/run.json, declaring out/run.json a run record
    And a producer "leaks" that writes the time to out/b.txt and to out/run.json, declaring out/run.json a run record
    When the audit runs
    Then the report contains "## `stamped` — DETERMINISTIC"
    And the report contains "1 run record(s) differ and are carried as provenance, not compared: `out/run.json`"
    And the report says "## `leaks` — 1 of 2 files DIFFER"
    And the report contains "| `out/b.txt` |"
    And the audit exits 1

  @test:test/workflows/determinism-audit.test.ts::determinism_audit::its_output_must_live_outside_the_checkout,_where_the_reset_cannot_delete_it
  Scenario: Its output must live outside the checkout, where the reset cannot delete it
    Given OUT is set to build/det inside the throwaway checkout
    When the audit runs with the producer "x|true"
    Then it exits 2
    And its stderr contains "must be outside the checkout"
