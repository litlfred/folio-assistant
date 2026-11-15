Feature: paper-preamble.tex — defines every macro the paper renderer emits, and no folio's notation

  @test:adapters/paper/latex/paper-preamble.test.ts::paper-preamble.tex::definesEmittedMacro[${m}]
  Scenario Outline: defines \<m>, which the paper renderer emits
    Given the non-comment lines of paper-preamble.tex
    Then they define the macro \<m>

    Examples:
      | m                 |
      | blockannot        |
      | sectionannot      |
      | chapterannot      |
      | defterm           |
      | refterm           |
      | uses              |
      | proofstatuslegend |

  @test:adapters/paper/latex/paper-preamble.test.ts::paper-preamble.tex::fullPreambleNoBeginDocument
  Scenario: is a full preamble: a document class and no \begin{document}
    Given the non-comment lines of paper-preamble.tex
    Then they contain \documentclass
    And they do not contain \begin{document}

  @test:adapters/paper/latex/paper-preamble.test.ts::paper-preamble.tex::omitsFolioNotationMacro[${m}]
  Scenario Outline: does not define the folio notation macro \<m>
    Given the non-comment lines of paper-preamble.tex
    Then they do not define the macro \<m>

    Examples:
      | m         |
      | bigbowtie |
      | varTheta  |
      | pp        |
      | yng       |
      | unicode   |

  @test:adapters/paper/latex/paper-preamble.test.ts::paper-preamble.tex::omitsNotationUnicodeMaps
  Scenario: does not map 𝓑 or 𝔙, the two unicode maps that are notation
    Given the non-comment lines of paper-preamble.tex
    Then they have no \newunicodechar for 𝓑 or for 𝔙

  @test:adapters/paper/latex/paper-preamble.test.ts::paper-preamble.tex::omitsRemovedTypoMacros
  Scenario: does not restore any of the 16 typo macros qou removed
    Given the non-comment lines of paper-preamble.tex
    Then they define none of \pic, \xid, \xiZ, \xiA, \pid, \nuk, \varepsilonk, \varepsilonq, \foralln, \omegadV, \omegads, \Gammat, \psiK, \pia, \lambdaL and \inftydt
