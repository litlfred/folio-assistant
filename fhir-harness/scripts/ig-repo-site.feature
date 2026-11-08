Feature: Building an IG repository's own site from its AST

  @test:scripts/ig-repo-site.test.ts::topMounts::topMountsNothingNeeds
  Scenario: the listed instances nothing else listed needs
    Given four listed instances where each needs the next
    Then the only top mount is the first

  @test:scripts/ig-repo-site.test.ts::topMounts::independentTopsBoth
  Scenario: two independent tops are both returned
    Then two instances that need nothing are both top mounts

  @test:scripts/ig-repo-site.test.ts::listedInstances::listedInstancesInOrder
  Scenario: the names index.config.json lists, in order; none without one
    Then a directory with no index.config.json lists no instances
    And one listing "b", "a" and an unnamed entry lists "b" then "a"

  @test:scripts/ig-repo-site.test.ts::notSource::notSourceMountsAndProducts
  Scenario: mounts the lock names and the Publisher's products are not the IG's source
    Given a lock mounting "base", "layer/sub" and "."
    Then the mounts' top directories, .git and the Publisher's product directories are not source
    And "input" and "." are source

  @test:scripts/ig-repo-site.test.ts::the_AST_gate_(ig-build-pipeline_rule_2)::validAstGoesOn
  Scenario: a valid AST goes on
    Then a valid AST passes the gate

  @test:scripts/ig-repo-site.test.ts::the_AST_gate_(ig-build-pipeline_rule_2)::staleRefusedNoFallback
  Scenario: a stale, cannot-tell or other verdict is refused, and never falls back to the Publisher
    Then a stale-inputs, cannot-tell or stale-toolchain AST is refused without accepting stale, and the message says it does not fall back

  @test:scripts/ig-repo-site.test.ts::the_AST_gate_(ig-build-pipeline_rule_2)::staleAcceptedPreviewOnly
  Scenario: a stale AST is accepted for a preview only, never for the root
    Then a stale AST is accepted for a preview when stale is accepted
    And for the root it is refused, saying it is for a preview only and naming ig-ast-build.sh

  @test:scripts/ig-repo-site.test.ts::the_AST_gate_(ig-build-pipeline_rule_2)::previewAcceptsStaleByDefault
  Scenario: a preview accepts a stale AST by default; SITE_ACCEPT_STALE_AST=0 refuses it
    Then accepting stale is on when the variable is unset or "1" and off when it is "0"
    And with "0" a preview's stale AST is refused and the message names "=0"

  @test:scripts/ig-repo-site.test.ts::the_AST_gate_(ig-build-pipeline_rule_2)::previewIsStagingBase
  Scenario: a preview is a base path under STAGING/
    Then a base path under STAGING is a preview
    And a root base path or none is not

  @test:scripts/ig-repo-site.test.ts::the_IG_API_sidecars_a_layer_above_leaves_in_the_work_directory::noSidecarsNothingBound
  Scenario: none there, or an empty directory: nothing is bound
    Then no work directory, a missing one or one with an empty sidecars directory binds no IG API

  @test:scripts/ig-repo-site.test.ts::the_IG_API_sidecars_a_layer_above_leaves_in_the_work_directory::sidecarsAndLabelFromDescriptor
  Scenario: the files and the label the descriptor gives; no descriptor, no label
    Given a work directory with one sidecar
    Then the IG API is its sidecars directory with 1 file
    Given a descriptor with the label " My API "
    Then the label is "My API"

  @test:scripts/ig-repo-site.test.ts::the_IG_API_sidecars_a_layer_above_leaves_in_the_work_directory::refusesEmptyLabel
  Scenario: a descriptor whose label is not a non-empty string is refused
    Given a descriptor whose label is empty
    Then reading the IG API throws about the label

  @test:scripts/ig-repo-site.test.ts::publisher_pages:_the_AST's_data,_never_the_Publisher's_HTML::servesAstDataAndIndex
  Scenario: serves each resource under ast-data/ and by the Publisher's name, the index and the sidecars; never replaces a site file
    Given an AST of a ValueSet and a CodeSystem, a site that already has the CodeSystem's JSON, an index and a sidecar
    When the AST data is served
    Then 2 resources are served, 1 by the Publisher's name, 1 kept, 1 sidecar and the index
    And the resources are under ast-data, the ValueSet is served by its Publisher name, and the site's CodeSystem file is kept
    And the index and the sidecar are served

  @test:scripts/ig-repo-site.test.ts::publisher_pages:_the_AST's_data,_never_the_Publisher's_HTML::noAstRefusedNamingStep
  Scenario: no AST: refused, naming the step that restores it
    Then publisher pages with no AST throw "no AST" naming the step that restores it

  @test:scripts/ig-repo-site.test.ts::publisher_pages:_the_AST's_data,_never_the_Publisher's_HTML::readsWorkDirIndexAndSidecars
  Scenario: the step reads the index and sidecars compose and the layer above left in the work directory
    Given a work directory holding the index and a sidecar a layer above left
    When publisher pages run
    Then 1 resource, 1 named, 1 sidecar and the index are served
    And the log says the Publisher's HTML is not taken

  @test:scripts/ig-repo-site.test.ts::layerSiteFilesServedNotOver
  Scenario: what the layer above wrote for the site root is served there, never over a path the site holds
    Given a layer above that wrote an OpenAPI page, a JSON file and an index page for the site root, and a site that already has an index page
    When the AST data is served
    Then 2 site files are served and the site's index page is kept
    And the OpenAPI page and JSON file are served and the site's index page is unchanged

  @test:scripts/ig-repo-site.test.ts::placeholderPageReplaced
  Scenario: a page of the IG's own holding the layer's placeholder is replaced by the layer's page; no other is
    Given a layer above with a hub page and another page, and a descriptor naming a placeholder
    And a site whose hub page holds the placeholder and whose other page does not
    When the AST data is served
    Then the hub page is filled with the layer's page and the other page is kept as the IG's own

  @test:scripts/ig-repo-site.test.ts::refusesShortPlaceholder
  Scenario: a placeholder too short to be a marker is refused
    Given a descriptor whose placeholder is "<p>"
    Then reading the IG API throws about the placeholder

  @test:scripts/ig-repo-site.test.ts::the_PlantUML_jar::plantumlJarPrecedence
  Scenario: the one given, else PLANTUML_JAR, else the cached pinned release; none that is not there
    Then a given jar that exists is used
    And a given jar that does not exist falls back to PLANTUML_JAR
    And with nothing given and nothing cached there is none
    And the cached pinned release is used when present

  @test:scripts/ig-repo-site.test.ts::the_guard:_no_published_page_wears_the_IG_Publisher's_chrome_(owner,_2026-10-14)::publisherChromeMarkers
  Scenario: each marker alone is the Publisher's chrome; a site page is not
    Then each Publisher stylesheet or generator marker alone is recognised as the Publisher's chrome
    And a site page with its own stylesheet is not

  @test:scripts/ig-repo-site.test.ts::the_guard:_no_published_page_wears_the_IG_Publisher's_chrome_(owner,_2026-10-14)::namesPagesWithChrome
  Scenario: publisherChromePages names every built page that carries it
    Given a site with its own index page, a page wearing the Publisher's chrome and a stylesheet file
    Then only the page wearing the chrome is named

  @test:scripts/ig-repo-site.test.ts::the_guard:_no_published_page_wears_the_IG_Publisher's_chrome_(owner,_2026-10-14)::refusesSiteWithChrome
  Scenario: the step refuses a site that carries one, whoever put it there
    Given a site holding an artifacts page wearing the Publisher's chrome
    Then publisher pages throw, naming the Publisher's chrome and the page

  @test:scripts/ig-repo-site.test.ts::builtPageByPermalink
  Scenario: builtPage: a source page by Jekyll's default permalink; never a file Jekyll does not publish
    Then Markdown pages build to .html and an HTML page keeps its name
    And an include and an image build to no page

  @test:scripts/ig-repo-site.test.ts::checkoutScriptsDeclared
  Scenario: the checkout scripts the platform asks for are the ones package.json declares
    Then the checkout scripts for ast, compose and publisher-pages run ig-repo-site.ts with those commands

  @test:scripts/ig-repo-site.test.ts::the_site's_folio-build.json::platformIsPinnedToolset
  Scenario: the platform is the toolset index.lock.json pins, else its first pin
    Then with no lock there is no platform commit
    And a lock pinning the toolset gives its ref
    And a lock without the toolset gives its first pin

  @test:scripts/ig-repo-site.test.ts::the_site's_folio-build.json::stampNamesRepoAndCommit
  Scenario: names the repository and its commit from the checkout when the runner says nothing
    Given a checkout with a lock and no runner variables
    Then the stamp names the instance, the platform commit, the repository, branch and head commit, and the build time

  @test:scripts/ig-repo-site.test.ts::the_site's_folio-build.json::publisherPagesWritesStamp
  Scenario: publisher-pages writes it at the root of the composed site, the marker of a folio root
    When publisher pages run for a site
    Then the stamp file is written at the site root and names the platform commit

  @test:scripts/ig-repo-site.test.ts::the_site's_folio-build.json::stampNamesAstSource
  Scenario: names the AST the artefact pages came from, so a stale preview's stamp does not claim the branch for them
    Given a work directory whose validity record says the AST is stale-inputs at revision "91b2b5a"
    When publisher pages run
    Then the stamp's AST is that commit with the verdict "stale-inputs" and the kind "full"
    And the log mentions the verdict and the revision

  @test:scripts/ig-repo-site.test.ts::siteTitledOnce
  Scenario: a page titled as the site is titled once (the IG's home page at the root)
    Given the thin IG layout and the harness layout
    Then a page titled as the site renders the title once
    And another page renders its title followed by the site title

  @test:scripts/ig-repo-site.test.ts::composedPageCarriesFolio
  Scenario: an IG page composed into a host carries the reader's folio (bean 95sk, R24)
    Given the thin IG layout under a host
    Then it carries the folio mount
    And its head links the host's docs-ui script and stylesheet

  @test:scripts/ig-repo-site.test.ts::the_IG's_TOC_on_its_thin_pages_(owner,_2026-11-02:_artifacts.html_had_no_TOC_in_the_rail)::thinPagesGetTocNav
  Scenario: every thin page gets the declaration and its label; other pages keep theirs
    Given a site whose index declares the TOC, four thin pages and another page
    When the TOC is stamped
    Then 4 pages are stamped, each with the declaration and label inside its head
    And the other page is unchanged
    And a second run stamps nothing

  @test:scripts/ig-repo-site.test.ts::the_IG's_TOC_on_its_thin_pages_(owner,_2026-11-02:_artifacts.html_had_no_TOC_in_the_rail)::noTocNothingStamped
  Scenario: no page declares the TOC: nothing to copy, nothing stamped
    Given a site where no page declares the TOC
    Then nothing is stamped
