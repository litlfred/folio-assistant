# Specifies schemas/process/device-screen.ts: parseDeviceScreen (a device
# screen as typed blocks, with no free markup), screenActors and
# screenExamples (the references check:journey-refs reads), the screen glyphs,
# isWide, and the block union against the block type table.
Feature: A device screen is typed data with no free markup

  Background:
    Given screen "S4" on a tablet owned by "nurse" for step J3a, with one block of each type: header, personCard for "baby", qr and statusBadge in the side column, two record lists (rows, and example "Bundle/ips"), passcode, consent, fields, alert, actions and note

  @test:schemas/process/device-screen.test.ts::device-screen:_a_screen_is_typed_data::a_screen_with_every_block_type_parses,_with_its_defaults
  Scenario: A screen with every block type parses, with its defaults
    When the screen is parsed
    Then its blocks cover exactly the block types
    And the passcode is not shown, the qr mode is "scan", the first button's style is "primary" and the header status tone is "success"

  @test:schemas/process/device-screen.test.ts::device-screen:_a_screen_is_typed_data::there_is_no_free_markup:_an_unknown_block_type,_an_unknown_field_and_an_unknown_icon_are_refused
  Scenario: Unknown block types, fields and icons are refused
    When the screen is parsed with an "html" block, with a note carrying an "html" field, with a note carrying icon "rocket", or with an extra top-level field
    Then each throws

  @test:schemas/process/device-screen.test.ts::device-screen:_a_screen_is_typed_data::the_device,_the_owner,_the_steps_and_a_passcode_are_what_they_say
  Scenario: The device, owner, steps and passcode are checked
    When the screen is parsed with device "watch", owner "Nurse Reem", no steps, passcode digits "48a9", or a qr example "not a key"
    Then each throws
    And the owner error mentions kebab case, the passcode error mentions digits and the example error mentions Type/id

  @test:schemas/process/device-screen.test.ts::device-screen:_a_screen_is_typed_data::a_record_list_has_rows_or_an_example;_ids_and_steps_appear_once
  Scenario: A record list needs rows or an example; block ids and steps appear once
    When the screen is parsed with a record list holding only a title, with two notes of id "a", or with its step twice
    Then each throws, saying rows or an example are needed, that block id "a" appears twice, and that the step appears twice

  @test:schemas/process/device-screen.test.ts::device-screen:_a_screen_is_typed_data::the_references_a_screen_makes,_for_check:journey-refs
  Scenario: A screen's actor and example references are listed
    When the screen is parsed and its references read
    Then its actors are "nurse" and "baby"
    And its examples are "Bundle/ips" twice

  @test:schemas/process/device-screen.test.ts::device-screen:_a_screen_is_typed_data::the_glyph_list_extends_the_journeys'_and_repeats_none;_the_wide_devices
  Scenario: The screen glyphs extend the journey glyphs without repeats, and the wide devices
    Then every journey glyph is a screen glyph
    And no screen glyph repeats
    And of phone, tablet, scanner, desktop and kiosk, the wide ones are tablet, desktop and kiosk

  @test:schemas/process/device-screen.test.ts::device-screen:_a_screen_is_typed_data::the_union_holds_exactly_the_block_types_the_table_lists
  Scenario: The block union holds exactly the block types of the table
    Then the number of options in the screen block union equals the number of block types
    And the options' type literals, in order, are exactly the block types of the table
