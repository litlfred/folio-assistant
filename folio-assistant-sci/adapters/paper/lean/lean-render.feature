Feature: lean-render — staging a doc-gen4 render under a folio's site before the rail pass

  @test:adapters/paper/lean/lean-render.test.ts::the_pieces::recognisesLakeBookkeeping
  Scenario: Lake bookkeeping is recognised
    Then QOU.html.hash and QOU.html.trace are build bookkeeping
    And QOU.html is not

  @test:adapters/paper/lean/lean-render.test.ts::the_pieces::moduleRootIsUpperFirstSegment
  Scenario: a module root is the upper-case first segment, bookkeeping included
    Then the module root of Mathlib/Algebra/Group.html and of Mathlib.html is Mathlib
    And the module root of QOU.html.hash is QOU
    And declarations/declaration-data.bmp and navbar.html have no module root

  @test:adapters/paper/lean/lean-render.test.ts::the_pieces::iframeAndRedirectDeclineRail
  Scenario: an iframe page and an empty-bodied redirect decline the rail; a module page does not
    Then a page with <base target="_parent"> declines the rail
    And a page with an empty body declines the rail
    And a page with a <main> body does not

  @test:adapters/paper/lean/lean-render.test.ts::the_pieces::optOutMetaWrittenOnce
  Scenario: the opt-out is the platform's meta, written once
    When withRailDeclined marks an empty page
    Then the page contains the platform's navbar-none meta
    And marking it again changes nothing

  @test:adapters/paper/lean/lean-render.test.ts::the_pieces::layoutShimKeyedOnRailOnce
  Scenario: the layout shim is keyed on the rail and written once
    When withRailOffset marks a page
    Then the page contains "body:has(nav.fa-nav)>nav.nav"
    And marking it again changes nothing

  @test:adapters/paper/lean/lean-render.test.ts::the_pieces::droppedModuleLinkToExternalDocs
  Scenario: a link into a dropped module goes to the external docs; kept, fragment-only and absolute links do not move
    Given QOU/Basic.html linking to Mathlib's Monoid, to ../QOU.html, to #x and to https://e.org/
    When rewriteDroppedLinks rewrites it keeping only QOU
    Then exactly 1 link is rewritten, the Mathlib one, to the default external docs
    And the links to ../QOU.html, #x and https://e.org/ are unchanged

  @test:adapters/paper/lean/lean-render.test.ts::stageLeanRender::fullFidelityByDefault
  Scenario: full fidelity by default: everything but Lake's bookkeeping, with the two rail-declining pages marked
    Given a miniature doc-gen4 render with QOU and Mathlib modules and three bookkeeping files
    When stageLeanRender stages it into a site
    Then it is staged at lean/ and the 3 bookkeeping files are skipped
    And lean/QOU.html.hash is absent while lean/Mathlib/Algebra.html is present
    And find/index.html and navbar.html decline the rail, and navbar.html carries the navbar-none meta
    And QOU/Basic.html carries the rail-offset mark
    And no module is dropped

  @test:adapters/paper/lean/lean-render.test.ts::stageLeanRender::modulesPrunesAndRepointsLinks
  Scenario: --modules prunes the rest and repoints every link into it, the iframe navbar included
    When stageLeanRender stages the render at docs/lean keeping the package "qou"
    Then Mathlib is dropped and docs/lean/Mathlib is absent
    And docs/lean/QOU/Basic.html is present
    And 2 links are rewritten, and the navbar links to Mathlib/Algebra.html on the external docs

  @test:adapters/paper/lean/lean-render.test.ts::stageLeanRender::refusesNonDocGenInput
  Scenario: an input that is not a doc-gen4 render is refused, never staged as nothing
    When stageLeanRender stages an empty directory
    Then it throws "not a doc-gen4 render"

  @test:adapters/paper/lean/lean-render.test.ts::stageLeanRender::refusesRouteLeavingSite
  Scenario: a route that leaves the site is refused
    When stageLeanRender stages the render with the route "../x"
    Then it throws, naming --route
