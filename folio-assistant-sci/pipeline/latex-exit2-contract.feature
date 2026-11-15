Feature: the LaTeX checkers exit 2 (could not determine) where there is no folio content

  @test:pipeline/latex-exit2-contract.test.ts::LaTeX_family_exit-2_contract_(Finding_1_on_jh2j)::validateTexExits2WithoutSnippets
  Scenario: validate-tex exits 2 on could-not-determine (no snippets in platform)
    Given the platform checkout root as the working directory
    When validate-tex.ts is run with bun
    Then it exits with code 2

  @test:pipeline/latex-exit2-contract.test.ts::LaTeX_family_exit-2_contract_(Finding_1_on_jh2j)::auditTexSourceExits2WithoutContent
  Scenario: audit-tex-source exits 2 on could-not-determine (no content files in platform)
    Given the platform checkout root as the working directory
    When audit-tex-source.ts is run with bun
    Then it exits with code 2
