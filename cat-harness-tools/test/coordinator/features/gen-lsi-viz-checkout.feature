# Specifies renderCommitted (scripts/gen-lsi-viz.ts): the committed LSI page
# over the checkout carries no value an index's content would move.
Feature: The committed LSI viewer page carries no value an index's content moves

  @test:test/coordinator/gen-lsi-viz-checkout.test.ts::the_LSI_viewer_page::the_committed_page_carries_no_value_an_index's_content_moves
  Scenario: The committed page has no index counts, fingerprints or per-index headings
    Given a fixture LSI index with 2 units, 3 terms, an instance, a graph and a fingerprint
    When the committed page is rendered over the checkout
    Then it shows neither count in bold
    And it does not contain "committed indexes" or "units indexed"
    And it has no heading for the fixture's instance and graph
    And it does not contain the fixture's fingerprint
