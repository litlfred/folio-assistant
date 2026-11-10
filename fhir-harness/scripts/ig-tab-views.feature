Feature: An artefact's tab views on the IG site

  @test:scripts/ig-tab-views.test.ts::artifactTabs:_which_views_an_artefact_gets,_at_the_Publisher's_file_names::profileTabs
  Scenario: a profile: its page, definitions, mappings, the JSON as .profile.json, and examples, claimed or not (owner, 2026-10-14: "1a")
    Given a profile with a resource this site serves
    Then its tabs are its page, definitions, mappings, the JSON as .profile.json and examples

  @test:scripts/ig-tab-views.test.ts::artifactTabs:_which_views_an_artefact_gets,_at_the_Publisher's_file_names::otherTabs
  Scenario: anything else: its page and the JSON view as .json
    Then a ValueSet's tabs are its page and its .json view
    And an example's JSON tab is its .json.html file

  @test:scripts/ig-tab-views.test.ts::artifactTabs:_which_views_an_artefact_gets,_at_the_Publisher's_file_names::noResourceNoTabs
  Scenario: none without a resource this site serves: every view is drawn from it
    Then a profile without a resource this site serves has no tabs

  @test:scripts/ig-tab-views.test.ts::thinArtifactView:_one_shell,_the_view_in_its_config::namesCanonicalAndAlternate
  Scenario: names its own file as canonical and the node as its alternate
    Given the definitions view of a profile
    Then it names its own file as canonical and the JSON-LD node as alternate

  @test:scripts/ig-tab-views.test.ts::thinArtifactView:_one_shell,_the_view_in_its_config::configNamesViewNoOrder
  Scenario: its config names the view and the resource; no reading order (that runs through the artefacts' own pages)
    Given the definitions view of a profile
    Then its config names the view, the node, the resource and the AST loader
    And it has no previous or next page

  @test:scripts/ig-tab-views.test.ts::thinArtifactView:_one_shell,_the_view_in_its_config::tabBarMarksCurrent
  Scenario: its tab bar links every view, the current one marked
    Given the definitions view of a profile
    Then it links every tab and marks the definitions tab as the current page

  @test:scripts/ig-tab-views.test.ts::thinArtifactView:_one_shell,_the_view_in_its_config::viewIsThin
  Scenario: is thin: the shared renderer, the rail linked, nothing of the resource in it
    Given the definitions view of a profile
    Then it loads the shared renderer and links the navbar rail
    And it holds none of the resource's text and is under 4000 characters

  @test:scripts/ig-tab-views.test.ts::gen-ig-pages_--ig-site_--publisher-data:_a_thin_page_per_view,_beside_the_artefact's::writesEachPublisherView
  Scenario: writes each view where the Publisher made one: definitions, mappings, JSON, and examples for every profile, claimed or not
    Given thin pages generated for an IG site with the Publisher's data
    Then the files are each artefact's page and its views where the Publisher made them
    And 4 are content pages, 4 JSON views and 2 examples views

  @test:scripts/ig-tab-views.test.ts::gen-ig-pages_--ig-site_--publisher-data:_a_thin_page_per_view,_beside_the_artefact's::everyPageThinNoChrome
  Scenario: every page is thin and wears none of the Publisher's chrome
    Given the generated thin pages
    Then each starts with a doctype, is under 4000 characters and matches no Publisher chrome marker
    And no page in the docs wears the Publisher's chrome

  @test:scripts/ig-tab-views.test.ts::gen-ig-pages_--ig-site_--publisher-data:_a_thin_page_per_view,_beside_the_artefact's::ownPageLinksTabs
  Scenario: the artefact's own page links its tabs
    Then the profile's own page links its definitions, mappings, JSON and examples views
    And the ValueSet's page links its JSON view

  @test:scripts/ig-tab-views.test.ts::gen-ig-pages_--ig-site_--publisher-data:_a_thin_page_per_view,_beside_the_artefact's::everyLinkResolves
  Scenario: every link, and every file a page's config names, resolves in the site
    Given the generated thin pages
    Then every link and every file named in a page's config exists in the site

  @test:scripts/ig-tab-views.test.ts::gen-ig-pages_--ig-site_--publisher-data:_a_thin_page_per_view,_beside_the_artefact's::viewsDrawFromJson
  Scenario: each view draws from the Publisher's JSON the site carries, never its HTML
    Then the mappings view draws from the profile's JSON and links the definitions view
    And the examples view draws from the artefact index

  @test:scripts/ig-tab-views.test.ts::gen-ig-pages_--ig-site_--publisher-data:_a_thin_page_per_view,_beside_the_artefact's::loaderListsEveryView
  Scenario: the narrative loader's list of this site's pages names every view, so a resource's narrative link to one stays
    Then the narrative loader's page list names every generated page
    And the resource loader script is copied

  @test:scripts/ig-tab-views.test.ts::the_narrative's_links_to_the_Publisher's_tab_file_names_land_on_the_thin_views::artifactsForNamesViews
  Scenario: artifactsFor names the views the generator wrote, beyond the artefacts' own pages
    Then the artefact pages include the generated views beyond the artefacts' own pages

  @test:scripts/ig-tab-views.test.ts::the_narrative's_links_to_the_Publisher's_tab_file_names_land_on_the_thin_views::relinksTabFileNames
  Scenario: relinkArtifacts points each at artifact/, anchors kept
    Given narrative links to a definitions view with an anchor, a profile JSON view and a mappings view
    When artefact links are relinked
    Then all 3 point at the artifact directory, anchors kept

  @test:scripts/ig-tab-views.test.ts::the_narrative's_links_to_the_Publisher's_tab_file_names_land_on_the_thin_views::stageRelinksTabLinks
  Scenario: stageIgSite relinks them in the IG's own pages
    Given an IG page linking a definitions view, a JSON view and a ValueSet page
    When the IG is staged with the artefact pages
    Then all three links point at the artifact directory

  @test:scripts/ig-tab-views.test.ts::stateFromOutput:_what_each_artefact's_own_JSON_states,_copied_into_the_index::copiesStatedProfileAndCode
  Scenario: copies meta.profile and a code concept from the Publisher's <Type>-<id>.json, and looks nothing up
    Given an index of a Composition whose JSON states a profile and a code, a ValueSet whose JSON states neither, and an artefact with no JSON
    When the stated fields are copied from the output
    Then 1 artefact is updated with its profile and code
    And the other two have no profiles

  @test:scripts/ig-tab-views.test.ts::the_shared_renderer_and_the_AST_loader_draw_the_views::scriptsParse
  Scenario: both parse as scripts
    Then the shared renderer and the AST loader both parse as scripts

  @test:scripts/ig-tab-views.test.ts::the_shared_renderer_and_the_AST_loader_draw_the_views::oneRendererBranches
  Scenario: one renderer: the views are branches of ig-artifact.js, chosen by the config's view
    Then the renderer branches on the config's view and defines the definitions, mappings and examples drawers
    And definitions come from the snapshot, else the differential

  @test:scripts/ig-tab-views.test.ts::the_shared_renderer_and_the_AST_loader_draw_the_views::noExamplesSaysSo
  Scenario: an examples view nothing claims says there are no examples
    Then the renderer says there are no examples when no artefact claims the profile

  @test:scripts/ig-tab-views.test.ts::the_shared_renderer_and_the_AST_loader_draw_the_views::jsonViewIsAstLoader
  Scenario: the JSON view is the AST loader's JSON, alone
    Then the renderer's JSON view uses the AST loader, which recognises the JSON view

  @test:scripts/ig-tab-views.test.ts::the_shared_renderer_and_the_AST_loader_draw_the_views::neitherReadsPublisherHtml
  Scenario: neither reads the Publisher's HTML
    Then neither the renderer nor the AST loader fetches an HTML file
