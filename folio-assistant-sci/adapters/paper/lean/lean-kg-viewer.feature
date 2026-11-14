Feature: lean-kg-viewer — static guards on the published viewer's source

  @test:adapters/paper/lean/lean-kg-viewer.test.ts::lean-kg-viewer::thirdPartyScriptsPinnedWithSri
  Scenario: every third-party script is version-pinned and carries SRI + crossorigin
    Given the external script tags of lean-kg-viewer/index.html
    Then there is at least one
    And each src names an exact x.y.z version
    And each tag has a sha384 or sha512 integrity attribute and crossorigin="anonymous"

  @test:adapters/paper/lean/lean-kg-viewer.test.ts::lean-kg-viewer::domPurifyLoaded
  Scenario: DOMPurify is loaded
    Then one external script is DOMPurify's dist/purify.js or purify.min.js

  @test:adapters/paper/lean/lean-kg-viewer.test.ts::lean-kg-viewer::innerHtmlOnlyFromPurify
  Scenario: innerHTML is assigned only from DOMPurify's output
    Given the source of viewer.js
    Then it assigns innerHTML exactly once, from purify.sanitize(
    And it uses no outerHTML assignment, insertAdjacentHTML or document.write

  @test:adapters/paper/lean/lean-kg-viewer.test.ts::lean-kg-viewer::fallsBackToTextWithoutPurify
  Scenario: without DOMPurify the viewer falls back to text, not raw HTML
    Given the source of viewer.js
    Then it renders HTML only when both window.marked and window.DOMPurify exist
    And otherwise it sets the node's textContent
