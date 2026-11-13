# The unreviewed-translation notice docs-ui.js draws on a folio page. Each
# Scenario names the test that executes it (skill test-engineer, "Every test
# has a Gherkin").
Feature: A translated page no person reviewed says so, prominently and in its own language

  @test:test/docs-ui-translation-notice.test.ts::the_unreviewed-translation_notice::an_unverified_French_page_shows_it_first,_full_width,_in_French_and_English,_linking_to_the_source
  Scenario: an unverified French page carries the notice first in its content, full width, in French then English
    Given a French page whose translation status is "unverified"
    When the page loads
    Then the first thing in the content is a full-width notice reading "Traduction automatique" and "Machine translation"
    And it links to the source-language page

  @test:test/docs-ui-translation-notice.test.ts::the_unreviewed-translation_notice::a_translated_page_with_no_status_fails_closed_and_shows_it
  Scenario: a translated page with no review status counts as not reviewed
    Given a French page that names its source and carries no translation status
    Then the notice is shown

  @test:test/docs-ui-translation-notice.test.ts::the_unreviewed-translation_notice::a_stale_translation_shows_it
  Scenario: a translation made from an earlier source counts as not reviewed
    Given a French page whose translation status is "stale"
    Then the notice is shown

  @test:test/docs-ui-translation-notice.test.ts::the_unreviewed-translation_notice::a_locale_with_no_notice_text_of_its_own_falls_back_to_English
  Scenario: a page in a language the notice has no words for reads the notice in English
    Given a German page whose translation status is "unverified"
    Then the notice reads "Machine translation" and no French

  @test:test/docs-ui-translation-notice.test.ts::the_unreviewed-translation_notice::a_verified_translation,_and_a_source-language_page,_show_none
  Scenario: a reviewed translation and a source-language page carry no notice
    Given a French page whose translation status is "verified", and an English source page
    Then neither carries the notice
