# scripts/translate-pot.ts fills the EMPTY msgstr entries of a layer's gettext catalogues with a
# self-hosted open MT engine, flags each `#, fuzzy`, refuses strings whose placeholders do not
# round-trip, and never overwrites a filled msgstr. Each Scenario names the test that executes it.
Feature: Machine translation of empty catalogue entries

  @test:scripts/tests/translate-pot.test.ts::the_catalogue_model_is_lossless::parse_then_serialize_is_the_identity,_comments_and_obsolete_entries_included
  Scenario: Parse then serialize is the identity, comments and obsolete entries included
    Given the case in the catalogue model is lossless
    When the catalogue is filled
    Then parse then serialize is the identity, comments and obsolete entries included

  @test:scripts/tests/translate-pot.test.ts::the_placeholder_guard::recognises_brace,_printf,_python,_liquid,_HTML,_entity,_code,_link_and_math_tokens
  Scenario: Recognises brace, printf, python, liquid, HTML, entity, code, link and math tokens
    Given the case in the placeholder guard
    When the catalogue is filled
    Then recognises brace, printf, python, liquid, HTML, entity, code, link and math tokens

  @test:scripts/tests/translate-pot.test.ts::the_placeholder_guard::a_translation_that_keeps_every_token_round-trips,_in_any_order
  Scenario: A translation that keeps every token round-trips, in any order
    Given the case in the placeholder guard
    When the catalogue is filled
    Then a translation that keeps every token round-trips, in any order

  @test:scripts/tests/translate-pot.test.ts::the_placeholder_guard::a_dropped,_added_or_altered_token_does_not_round-trip
  Scenario: A dropped, added or altered token does not round-trip
    Given the case in the placeholder guard
    When the catalogue is filled
    Then a dropped, added or altered token does not round-trip

  @test:scripts/tests/translate-pot.test.ts::the_placeholder_guard::mask_and_unmask_are_inverse,_even_when_the_engine_spaces_out_a_sentinel
  Scenario: Mask and unmask are inverse, even when the engine spaces out a sentinel
    Given the case in the placeholder guard
    When the catalogue is filled
    Then mask and unmask are inverse, even when the engine spaces out a sentinel

  @test:scripts/tests/translate-pot.test.ts::the_placeholder_guard::an_entry_whose_placeholders_do_not_survive_is_refused,_left_empty_and_NOT_flagged_fuzzy
  Scenario: An entry whose placeholders do not survive is refused, left empty and NOT flagged fuzzy
    Given the case in the placeholder guard
    When the catalogue is filled
    Then an entry whose placeholders do not survive is refused, left empty and NOT flagged fuzzy

  @test:scripts/tests/translate-pot.test.ts::the_placeholder_guard::a_string_with_nothing_but_tokens_is_refused_rather_than_copied
  Scenario: A string with nothing but tokens is refused rather than copied
    Given the case in the placeholder guard
    When the catalogue is filled
    Then a string with nothing but tokens is refused rather than copied

  @test:scripts/tests/translate-pot.test.ts::never_overwrite::a_non-empty_msgstr_is_untouched,_fuzzy_or_not;_only_the_empty_one_is_filled
  Scenario: A non-empty msgstr is untouched, fuzzy or not; only the empty one is filled
    Given the case in never overwrite
    When the catalogue is filled
    Then a non-empty msgstr is untouched, fuzzy or not; only the empty one is filled

  @test:scripts/tests/translate-pot.test.ts::never_overwrite::a_plural_with_any_form_filled_is_not_touched
  Scenario: A plural with any form filled is not touched
    Given the case in never overwrite
    When the catalogue is filled
    Then a plural with any form filled is not touched

  @test:scripts/tests/translate-pot.test.ts::never_overwrite::the_header_entry_is_never_filled
  Scenario: The header entry is never filled
    Given the case in never overwrite
    When the catalogue is filled
    Then the header entry is never filled

  @test:scripts/tests/translate-pot.test.ts::never_overwrite::a_second_run_over_its_own_output_changes_nothing
  Scenario: A second run over its own output changes nothing
    Given the case in never overwrite
    When the catalogue is filled
    Then a second run over its own output changes nothing

  @test:scripts/tests/translate-pot.test.ts::what_is_kept_intact::msgctxt,_comments_and_an_existing_flag_line_survive;_fuzzy_joins_the_flags
  Scenario: Msgctxt, comments and an existing flag line survive; fuzzy joins the flags
    Given the case in what is kept intact
    When the catalogue is filled
    Then msgctxt, comments and an existing flag line survive; fuzzy joins the flags

  @test:scripts/tests/translate-pot.test.ts::what_is_kept_intact::leading_and_trailing_whitespace,_and_line_structure,_come_back_verbatim
  Scenario: Leading and trailing whitespace, and line structure, come back verbatim
    Given the case in what is kept intact
    When the catalogue is filled
    Then leading and trailing whitespace, and line structure, come back verbatim

  @test:scripts/tests/translate-pot.test.ts::what_is_kept_intact::plural_forms_follow_the_target's_nplurals:_three_for_ru
  Scenario: Plural forms follow the target's nplurals: three for ru
    Given the case in what is kept intact
    When the catalogue is filled
    Then plural forms follow the target's nplurals: three for ru

  @test:scripts/tests/translate-pot.test.ts::what_is_kept_intact::markup_and_math_reach_the_engine_masked,_and_identical_strings_are_sent_once
  Scenario: Markup and math reach the engine masked, and identical strings are sent once
    Given the case in what is kept intact
    When the catalogue is filled
    Then markup and math reach the engine masked, and identical strings are sent once

  @test:scripts/tests/translate-pot.test.ts::engines_and_the_node::the_hosted_libretranslate.com_API_is_refused
  Scenario: The hosted libretranslate.com API is refused
    Given the case in engines and the node
    When the catalogue is filled
    Then the hosted libretranslate.com API is refused

  @test:scripts/tests/translate-pot.test.ts::engines_and_the_node::the_node_records_machine_generation_and_never_claims_official
  Scenario: The node records machine generation and never claims official
    Given the case in engines and the node
    When the catalogue is filled
    Then the node records machine generation and never claims official

  @test:scripts/tests/translate-pot.test.ts::engines_and_the_node::a_.po_made_from_a_.pot_carries_the_locale
  Scenario: A .po made from a .pot carries the locale
    Given the case in engines and the node
    When the catalogue is filled
    Then a .po made from a .pot carries the locale

  @test:scripts/tests/translate-pot.test.ts::the_CLI_over_a_translations_tree::fills_the_empty_entry,_keeps_the_filled_one,_and_writes_the_node
  Scenario: Fills the empty entry, keeps the filled one, and writes the node
    Given the case in the CLI over a translations tree
    When the catalogue is filled
    Then fills the empty entry, keeps the filled one, and writes the node

  @test:scripts/tests/translate-pot.test.ts::the_CLI_over_a_translations_tree::a_catalogue_signed_off_as_official_is_skipped
  Scenario: A catalogue signed off as official is skipped
    Given the case in the CLI over a translations tree
    When the catalogue is filled
    Then a catalogue signed off as official is skipped

  @test:scripts/tests/translate-pot.test.ts::the_CLI_over_a_translations_tree::--dry-run_writes_nothing
  Scenario: --dry-run writes nothing
    Given the case in the CLI over a translations tree
    When the catalogue is filled
    Then --dry-run writes nothing
