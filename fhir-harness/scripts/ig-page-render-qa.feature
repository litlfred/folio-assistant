Feature: The QA report's page scan: every page as a reader sees it

  @test:scripts/ig-page-render-qa.test.ts::ig-page-render-qa::pagesAReaderMeets
  Scenario: the pages scanned are the ones a reader meets
    Given a built site with a root page, an artefact page, its JSON view, a mappings view and a redirect stub
    Then the root page and the artefact page are scanned, and the JSON view, the mappings view and the stub are not

  @test:scripts/ig-page-render-qa.test.ts::ig-page-render-qa::blockRules
  Scenario: a block's text is judged for markup shown as text
    Then "**Persona**" is bold left as text
    And "1. Plan" is a list marker in a paragraph and nothing in a heading
    And "[Reference]([Patient])", two drawn links, is not a link left as text
    And a "!" before a drawn link is an image left as text

  @test:scripts/ig-page-render-qa.test.ts::ig-page-render-qa::scansDrawnPagesInABrowser
  Scenario: pages drawn by a script are scanned after they draw
    Given a built site whose artefact page draws its content in the browser after loading
    When the site is scanned in a headless browser
    Then both pages are scanned, none left unfinished
    And the drawn bold and the image left as "!" are found, with the page and the block's text
    And code, links and plain text are not findings

  @test:scripts/ig-page-render-qa.test.ts::ig-page-render-qa::qaPanelLoadsResults
  Scenario: the QA report's panel loads the scan's results
    Then the "Page scan" section has a panel that loads the results file and the script that draws it
    And the script parses and sets no HTML
