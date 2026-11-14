Feature: latex-tokens — the paper profile's rule for LaTeX reference tokens

  @test:adapters/paper/suggest/latex-tokens.test.ts::latex-tokens::oneRuleWithEveryPattern
  Scenario: one rule, with every pattern the runtime reads
    When latexReferenceTokens is called
    Then it returns exactly one rule, "latex-reference"
    And its find pattern is global
    And neither its valid pattern nor its trim pattern is global

  @test:adapters/paper/suggest/latex-tokens.test.ts::latex-tokens::shieldsOneArgCommandsOnly
  Scenario: shields a command with one braced argument, and nothing else
    Given the Markdown "See \cref{thm:a} and \emph{x}, not $x^2$ or \alpha."
    When the rule's shield pattern is matched globally
    Then it matches exactly "\cref{thm:a}" and "\emph{x}"

  @test:adapters/paper/suggest/latex-tokens.test.ts::latex-tokens::referenceWellFormedWithOneArg
  Scenario: a reference is well-formed with one argument, trailing punctuation aside
    When the rule finds the references in "By \cite{k}, \ref{a}. and (\eqref{e})"
    Then all three are well-formed once trailing punctuation is trimmed
    When it finds the references in "By \cite{k and \ref{} and \cref{a{b}}"
    Then none of the three is well-formed
    And in "\citep{k} is not one of them" it finds no reference
