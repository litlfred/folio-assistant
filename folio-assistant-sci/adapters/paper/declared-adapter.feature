Feature: the paper content adapter is declared by this instance and found by the harness

  @test:adapters/paper/declared-adapter.test.ts::paper_adapter_declaration::discoveredFromDeclarationLeadsAsSuperset
  Scenario: is discovered from this instance's declaration, and leads as the superset
    When the harness's built-in adapters are listed
    Then the paper adapter is from folio-assistant-sci, class PaperContentAdapter, extending document
    And it is the first adapter in the list

  @test:adapters/paper/declared-adapter.test.ts::paper_adapter_declaration::resolvesToExportedClass
  Scenario: resolves to the class this directory exports
    When the built-in adapter for "paper" is resolved
    Then there is no fallback reason
    And the constructor is this directory's PaperContentAdapter

  @test:adapters/paper/declared-adapter.test.ts::paper_adapter_declaration::suppliesPreambleWhenOmitted
  Scenario: supplies its print preamble template to generate-main-tex when --preamble is omitted (bean 4dj5)
    Then PaperContentAdapter's preamble path is PAPER_PREAMBLE_PATH, and that file exists
    And where the harness has resolveAdapterPreamble, it and the render target for "paper" give that path
    And where generate-main-tex has resolvePaperPreamble, it gives that path with no explicit preamble

  @test:adapters/paper/declared-adapter.test.ts::paper_adapter_declaration::cliInlinesPaperPreamble
  Scenario: generate-main-tex CLI with no --preamble inlines the paper adapter's template (bean 4dj5)
    Given generate-main-tex has resolvePaperPreamble (otherwise only that the preamble file exists is checked)
    And a temporary paper "Sample Paper" with one chapter
    When the generate-main-tex CLI runs on it with --out and no --preamble
    Then it exits 0
    And the generated main.tex contains "\documentclass[11pt,a4paper]{report}" and "Sample Paper"
