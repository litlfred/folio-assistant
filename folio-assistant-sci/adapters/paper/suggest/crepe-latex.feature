Feature: Crepe's math editor over this library's paper blocks, unrepaired and with the paper profile's repairs

  @test:adapters/paper/suggest/crepe-latex.test.ts::the_library's_math_survives_Crepe::thereIsMathToTest
  Scenario: there is math to test
    Given every library section whose body, front matter stripped, has math
    Then there are at least 5
    And sec-006-latex-export.md is one of them

  @test:adapters/paper/suggest/crepe-latex.test.ts::the_library's_math_survives_Crepe::latexExportBlockRoundTrips
  Scenario: the LaTeX-export block round-trips byte for byte, repaired or not
    When sec-006-latex-export.md is loaded into Crepe without the repairs, and with them
    Then each time Crepe's Markdown is the input, byte for byte

  @test:adapters/paper/suggest/crepe-latex.test.ts::the_library's_math_survives_Crepe::repairedKeepsEveryMathSpan
  Scenario: with the repairs, every math span in every section comes back unchanged
    When each math section is loaded into Crepe with the repairs
    Then every math span of the input, except a "$, $" delimiter list, is in Crepe's Markdown

  @test:adapters/paper/suggest/crepe-latex.test.ts::the_library's_math_survives_Crepe::crepeOutputPassesSyntaxChecks
  Scenario: Crepe's own output for a section passes the syntax checks
    When each math section is loaded into Crepe with the repairs
    Then checkSuggestion finds no error between the input and Crepe's Markdown

  @test:adapters/paper/suggest/crepe-latex.test.ts::repair_1:_inline_math_gets_the_paper's_macros::unrepairedIgnoresInlineMacros
  Scenario: unrepaired, Crepe 7.22.2 ignores katexOptions.macros inline
    When "Inline $\LM(x)$." is loaded into Crepe without the repairs
    Then the HTML shows KaTeX's error colour #cc0000

  @test:adapters/paper/suggest/crepe-latex.test.ts::repair_1:_inline_math_gets_the_paper's_macros::repairedRendersMacroKeepsSource
  Scenario: repaired, the macro renders and the source is kept
    When "Inline $\LM(x)$." is loaded into Crepe with the repairs
    Then the HTML has no error colour and has an inline math node
    And the Markdown is the input

  @test:adapters/paper/suggest/crepe-latex.test.ts::repair_2:_LaTeX_outside_math_is_kept_verbatim::unrepairedEscapesOptionalArgs
  Scenario: unrepaired, Crepe escapes optional arguments into broken LaTeX
    When a theorem environment with [Fermat], and a \cite[p.~3], are loaded into Crepe without the repairs
    Then the Markdown contains "\begin{theorem}\[Fermat]" and "\cite\[p.\~3]"

  @test:adapters/paper/suggest/crepe-latex.test.ts::repair_2:_LaTeX_outside_math_is_kept_verbatim::repairedLatexRoundTrips
  Scenario: repaired, each comes back byte for byte
    When a theorem environment, a \cite and \eqref line, and a proof environment around paragraphs are each loaded with the repairs
    Then each Markdown is its input, byte for byte

  @test:adapters/paper/suggest/crepe-latex.test.ts::repair_2:_LaTeX_outside_math_is_kept_verbatim::editOutsideLatexLandsLatexUntouched
  Scenario: an edit outside the LaTeX still lands, and the LaTeX beside it is untouched
    Given the \cite line with "See" replaced by "Compare"
    When it is loaded with the repairs
    Then the Markdown is the edited line
    And checkSuggestion finds nothing between the original and it

  @test:adapters/paper/suggest/crepe-latex.test.ts::what_Crepe_changes_and_the_repairs_leave_alone::inlineDoubleDollarBecomesSingle
  Scenario: `$$x$$` written inline comes back as `$x$`
    When "Inline $$x^2$$ here." is loaded with the repairs
    Then the Markdown is "Inline $x^2$ here."

  @test:adapters/paper/suggest/crepe-latex.test.ts::what_Crepe_changes_and_the_repairs_leave_alone::displayAlignedRoundTrips
  Scenario: display math, with an aligned environment inside it, is Crepe's own and round-trips
    When display math holding an aligned environment is loaded without the repairs, and with them
    Then each time the Markdown is the input
