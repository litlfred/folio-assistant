# Specifies schemas/ui/tile-count.ts: tileCounts, the one writer of a
# projection's tile-count field, and readTileCounts, its one reader, which
# reads a declared count as declared and an absent or malformed one as
# nothing, never as zero (issue #856, bean tis1).
#
# The two table-driven describe blocks in the test file ("ABSENT is not ZERO"
# with 8 inputs, and the 10 malformed entries of "a malformed entry is
# dropped") generate their test titles in a loop; the test-gherkin check does
# not see those titles, so they have no Scenario here.
Feature: A tile's declared count is read as declared, and an absent one is not zero

  @test:schemas/ui/tile-count.test.ts::a_declared_count_is_read_as_declared::count_and_unit_survive_the_round_trip
  Scenario: Count and unit survive the round trip
    Given tile counts written for "beans" as 466 "beans"
    When they are read back
    Then "beans" is count 466, unit "beans"

  @test:schemas/ui/tile-count.test.ts::a_declared_count_is_read_as_declared::ZERO_is_a_value,_not_a_missing_one
  Scenario: A count of zero is read as zero
    Given tile counts written for "library" as 0 "entries"
    When they are read back
    Then "library" is present with count 0

  @test:schemas/ui/tile-count.test.ts::a_declared_count_is_read_as_declared::ONE_projection_declares_for_TWO_directories
  Scenario: One projection declares counts for two directories
    Given tile counts written for "library" as 8 "entries" and "uploads" as 20 "waiting"
    When they are read back
    Then "library" is 8 "entries" and "uploads" is 20 "waiting"

  @test:schemas/ui/tile-count.test.ts::a_declared_count_is_read_as_declared::the_two_numbers_are_allowed_to_disagree,_which_is_why_they_are_separate
  Scenario: Two counts in one projection may differ
    Given tile counts written for "library" as 8 and "uploads" as 20
    When they are read back
    Then the two counts differ

  @test:schemas/ui/tile-count.test.ts::a_malformed_entry_is_dropped,_and_never_rounded_to_zero::NaN_in_particular_does_not_slip_through_a_`typeof`_check
  Scenario: A NaN count is dropped
    Given a tile-count field whose "beans" entry has count 0/0
    When it is read
    Then there is no entry for "beans"

  @test:schemas/ui/tile-count.test.ts::a_malformed_entry_is_dropped,_and_never_rounded_to_zero::a_bad_entry_does_not_silence_its_SIBLING
  Scenario: A malformed entry does not drop its sibling
    Given a tile-count field with "library" count "eight" and "uploads" count 20 "waiting"
    When it is read
    Then there is no entry for "library"
    And "uploads" is 20 "waiting"

  @test:schemas/ui/tile-count.test.ts::only_OWN_properties_are_counted::`constructor`_does_not_mint_a_tile_count
  Scenario: Inherited properties mint no count
    Given an empty tile-count field
    When it is read
    Then there is no entry for "constructor" or "toString"
    And there are no entries at all

  @test:schemas/ui/tile-count.test.ts::the_field_name_is_spelled_in_exactly_one_place::the_writer_and_the_reader_agree_by_construction
  Scenario: The writer writes only the field the reader reads
    Given tile counts written for "todos" as 3 "todos"
    Then the written object's only key is the tile-count field
    And reading it gives "todos" as 3 "todos"
