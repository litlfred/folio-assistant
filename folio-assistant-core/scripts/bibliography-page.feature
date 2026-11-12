Feature: the bibliography pages and their exports

  @test:scripts/bibliography-page.test.ts::collect::readsBothSourcesInOrder
  Scenario: reads both kinds of source, as one list in citation order
    Given a checkout with a references sub-graph and a catalogue sub-graph
    When the bibliography is collected
    Then nothing is invalid
    And the entries are aaronson2013, garoufalidis2004 and who-handbook in citation order
    And the sub-graphs are one references and one catalogue

  @test:scripts/bibliography-page.test.ts::collect::catalogueRecordBecomesReference
  Scenario: a catalogue record becomes a catalogue reference, linked to its record and its held copy
    When the who-handbook entry is read
    Then its provenance is catalogue, derived from its record and held at its library copy
    And it carries its ISBN

  @test:scripts/bibliography-page.test.ts::collect::refusesMisnamedAndBadNode
  Scenario: refuses a node whose file is not named for its key, and a bad node
    Given a reference file not named for its key and one with a bad id
    When the bibliography is collected
    Then both are reported invalid, the first naming its key

  @test:scripts/bibliography-page.test.ts::pages_and_exports::fiveExportsPerPage
  Scenario: one page with five exports for the whole KG, and for each sub-graph
    When the outputs are listed
    Then the whole KG and each sub-graph have an index and five exports
    And the exports are BibTeX, CSL-JSON, RIS, DC XML and JSON-LD

  @test:scripts/bibliography-page.test.ts::pages_and_exports::perAssetRouteExports
  Scenario: per-asset route (<route>/<sub-graph>/<asset>/) exports a library item and references extracted from it
    Given a library item with references extracted from it
    When the bibliography is collected and written
    Then the asset is listed with its entries
    And its page and its DC XML carry the item and the extracted citation

  @test:scripts/bibliography-page.test.ts::pages_and_exports::subgraphPageOwnRefsOnly
  Scenario: a sub-graph page holds its sub-graph's references only, and its exports match
    When the catalogue sub-graph's page and BibTeX are read
    Then they carry who-handbook and not garoufalidis2004

  @test:scripts/bibliography-page.test.ts::pages_and_exports::wholePageLinksSubgraphs
  Scenario: the whole-KG page links each sub-graph with its count
    When the whole-KG page is read
    Then it links each sub-graph with its count

  @test:scripts/bibliography-page.test.ts::pages_and_exports::entryCarriesOwnExports
  Scenario: each entry carries its own BibTeX, RIS and CSL-JSON export
    When the garoufalidis2004 entry is rendered
    Then it offers BibTeX, RIS and CSL-JSON downloads
    And its BibTeX is an article entry

  @test:scripts/bibliography-page.test.ts::rendering::citationFormat
  Scenario: a citation reads author (year). title. container, volume, pages
    When the garoufalidis2004 citation is rendered
    Then it reads author (year). title. container, volume, pages

  @test:scripts/bibliography-page.test.ts::rendering::htmlEscaped
  Scenario: HTML in a field is escaped
    When a title holding a script tag is rendered
    Then it is escaped

  @test:scripts/bibliography-page.test.ts::rendering::anchorsUrlSafe
  Scenario: anchors are URL-safe
    When the anchor of "a:b/c" is made
    Then it is "ref-a-b-c"

  @test:scripts/bibliography-page.test.ts::rendering::emptyPageSaysSo
  Scenario: an empty page says so and still offers its exports
    When a page with no entries is rendered
    Then it says "No references here yet." and links the BibTeX export

  @test:scripts/bibliography-page.test.ts::rendering::orderAuthorThenYear
  Scenario: order: first author, then year
    When the first two entries are compared
    Then the first sorts before the second

  @test:scripts/bibliography-page.test.ts::rendering::addReferenceFormControls
  Scenario: includes the ✍ + Add reference standalone node form controls and passes safeHref and escaped-markup checks
    When the add-reference form is rendered
    Then it carries the "✍ + Add reference (standalone node)" control and each of its fields

  @test:scripts/bibliography-page.test.ts::a_site_with_its_own_instance_(declared_at_the_checkout_root)_and_dependencies::rootInstanceIsOwn
  Scenario: the root layer is the site's own; a dependency's clashing sub-graph id gets its layer prefix
    Given a site whose root declares a layer, and a dependency with a clashing sub-graph id
    When the bibliography is collected
    Then nothing is invalid and the own layer is site-x
    And the dependency's sub-graph gets its layer prefix

  @test:scripts/bibliography-page.test.ts::a_site_with_its_own_instance_(declared_at_the_checkout_root)_and_dependencies::ownFirstDepsInClosedSection
  Scenario: the whole page lists the site's own references first and the dependencies in a labelled, closed section
    When the whole page is read
    Then the site's own references come first, then a closed dependencies section with the dependency's references
    And the section is labelled and lists sub-graphs by layer

  @test:scripts/bibliography-page.test.ts::a_site_with_its_own_instance_(declared_at_the_checkout_root)_and_dependencies::layerSubgraphPageOwnOnly
  Scenario: each layer's sub-graph page holds only that layer's references
    When each layer's sub-graph page is read
    Then each holds only its layer's references, the dependency's saying it is a dependency

  @test:scripts/bibliography-page.test.ts::a_site_with_its_own_instance_(declared_at_the_checkout_root)_and_dependencies::noRootInstanceOneList
  Scenario: with no layer at the root, the page stays one list
    When a checkout without a root layer is written
    Then its page has no dependencies section and lists by sub-graph

  @test:scripts/bibliography-page.test.ts::one_page,_one_id_per_entry_(bean_djj5)::firstKeepsRefKey
  Scenario: the first keeps ref-<key>, which a citation links; the next is qualified by its layer
    When a page with two entries of the same key is rendered
    Then the first keeps ref-<key> and the next is qualified by its layer

  @test:scripts/bibliography-page.test.ts::one_page,_one_id_per_entry_(bean_djj5)::ownEntryKeepsRefKey
  Scenario: on an own site's page the own entry keeps ref-<key>, wherever it sorts
    When the page is rendered for an own site
    Then the own entry keeps ref-<key> and the ids are distinct

  @test:scripts/bibliography-page.test.ts::one_instance's_own_bibliography,_for_its_page_inside_a_composed_site_(bean_djj5)::keepsInstanceAndNeeds
  Scenario: keeps the layer and what it needs, transitively, and makes it own
    When one layer's bibliography is taken
    Then it is its own, with its entries and the sub-graphs of what it needs

  @test:scripts/bibliography-page.test.ts::one_instance's_own_bibliography,_for_its_page_inside_a_composed_site_(bean_djj5)::pagesUnderInstance
  Scenario: its pages are served under /<instance>/
    When that bibliography's pages are written under /smart-trust
    Then their permalinks start /smart-trust/en/folio-assistant-core/bibliography/
