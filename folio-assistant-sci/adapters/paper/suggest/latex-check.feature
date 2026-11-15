Feature: the paper profile's suggest checks, held against a real LaTeX-bearing block of this library

  The block is LeanArchitect §3.4 (prose-sec-006 of arxiv-2601.22554v1). Every edit below first checks that the
  text it replaces is in the block.

  @test:adapters/paper/suggest/latex-check.test.ts::the_real_block::blockHasClaimedLatex
  Scenario: is the LaTeX-bearing one this suite claims
    Then the block contains "$N$", "\begin{theorem}", "\end{proof}", "\uses{lem:zero-add, lem:succ-add}", "\cref{" and "% Statement"

  @test:adapters/paper/suggest/latex-check.test.ts::the_real_block::blockHasNoSyntaxErrors
  Scenario: is well formed: no syntax errors as ingested
    When checkLatex checks the block with the paper's macros and the library's labels
    Then there are no errors

  @test:adapters/paper/suggest/latex-check.test.ts::the_real_block::danglingExampleLabelsWarn
  Scenario: its dangling example labels are warnings, never errors
    When checkLatex checks the block
    Then there are findings, and every one is a warning
    And one is about def:nat
    And none is about thm:add-comm, which the block's own \label defines

  @test:adapters/paper/suggest/latex-check.test.ts::round_trip::untouchedBlockReportsNothing
  Scenario: an untouched block reports nothing
    Then checkSuggestion of the block against itself finds nothing

  @test:adapters/paper/suggest/latex-check.test.ts::round_trip::protectRestoreRoundTrips
  Scenario: protecting then restoring gives the block back byte for byte
    When the block's LaTeX is protected
    Then the text changes
    And restoring it gives the block back exactly

  @test:adapters/paper/suggest/latex-check.test.ts::round_trip::environmentsKeptWhole
  Scenario: both environments are kept verbatim, whole
    When the block's LaTeX spans are listed
    Then one span is the whole theorem environment and one the whole proof environment
    And one is "\inputleannode{label}"

  @test:adapters/paper/suggest/latex-check.test.ts::a_valid_edit_is_accepted::acceptsMathRewrite
  Scenario: rewriting the math
    When "Addition in $N$ is commutative." is rewritten with \mathbb{N} and a \frac
    Then checkSuggestion finds nothing

  @test:adapters/paper/suggest/latex-check.test.ts::a_valid_edit_is_accepted::acceptsPaperMacroWithArgs
  Scenario: using a paper macro with its two arguments
    When "$\pair{a}{b}$" is added
    Then checkSuggestion finds nothing

  @test:adapters/paper/suggest/latex-check.test.ts::a_valid_edit_is_accepted::acceptsDeletingEnvironment
  Scenario: deleting a whole environment
    When the whole proof environment is deleted
    Then checkSuggestion finds nothing

  @test:adapters/paper/suggest/latex-check.test.ts::a_valid_edit_is_accepted::unknownLabelWarns
  Scenario: a reference to a label the KG lacks: a warning, never an error
    When def:nowhere is added to \uses{def:nat}
    Then the only finding is an unknown-label warning about def:nowhere

  @test:adapters/paper/suggest/latex-check.test.ts::a_valid_edit_is_accepted::unknownCiteWarns
  Scenario: a citation the bibliography lacks: a warning
    When \cite[§2]{docgen4} is added
    Then the only finding is an unknown-cite warning about docgen4

  @test:adapters/paper/suggest/latex-check.test.ts::an_unbalanced_edit_is_reported::unclosedBraceInMath
  Scenario: an unclosed brace in math
    When "$N$" becomes "$\mathbb{N$"
    Then the only finding is an unclosed-brace error
    And it is on the line of "Addition in $N$"

  @test:adapters/paper/suggest/latex-check.test.ts::an_unbalanced_edit_is_reported::strayClosingBrace
  Scenario: a stray closing brace
    When "\uses{def:nat}" gains an extra "}"
    Then the only finding is unmatched-close-brace

  @test:adapters/paper/suggest/latex-check.test.ts::an_unbalanced_edit_is_reported::environmentLeftOpen
  Scenario: an environment left open
    When "\end{proof}" is removed
    Then the only finding is unclosed-environment for proof

  @test:adapters/paper/suggest/latex-check.test.ts::an_unbalanced_edit_is_reported::environmentsClosedOutOfOrder
  Scenario: environments closed out of order
    When an itemize is opened inside the theorem and closed after it
    Then a mismatched-end finding names itemize
    And no finding is unknown-label

  @test:adapters/paper/suggest/latex-check.test.ts::an_unbalanced_edit_is_reported::macroShortOfArguments
  Scenario: a macro short of its arguments: built-in, preamble and paper
    Then "$\frac{a}$" gives missing-argument for frac
    And "$\pair{a}$" gives missing-argument for pair
    And "$\leanstatusmark{a}$" gives missing-argument for leanstatusmark

  @test:adapters/paper/suggest/latex-check.test.ts::an_unbalanced_edit_is_reported::unclosedDisplayMath
  Scenario: an unclosed display math
    When "$N$" becomes "$$N"
    Then the only finding is unclosed-display-math

  @test:adapters/paper/suggest/latex-check.test.ts::what_is_not_an_error::singleTokenArgsNotError
  Scenario: TeX's single-token arguments: \frac12
    Then "$\frac12 + \sqrt[3]x$" has no errors

  @test:adapters/paper/suggest/latex-check.test.ts::what_is_not_an_error::proseDollarPercentCodeBraces
  Scenario: a percent sign in prose, a dollar in prose, braces in code
    Then Markdown with "50%", "$5", unbalanced braces in a lean code fence and "}" in inline code has no findings

  @test:adapters/paper/suggest/latex-check.test.ts::what_is_not_an_error::escapedBracesOk
  Scenario: escaped braces
    Then "$\{ x \mid x > 0 \}$" has no findings

  @test:adapters/paper/suggest/latex-check.test.ts::what_is_not_an_error::unknownMacroNoArity
  Scenario: an unknown macro: no shape, so no arity complaint
    Then "$\mysterious$ and \inputleannode" has no findings

  @test:adapters/paper/suggest/latex-check.test.ts::the_macro_table::arityFromBody
  Scenario: argument counts from a body, as blueprint-layout counts them
    Then the arity of "\langle #1, #2 \rangle" is 2 and of "\mathrm{LM}" is 0

  @test:adapters/paper/suggest/latex-check.test.ts::the_macro_table::newcommandShapesFromPreamble
  Scenario: \newcommand shapes from the paper preamble, optional arguments apart
    When parseNewcommands reads the paper preamble
    Then \lean takes 1 argument, \leanok 0, \blockannot 3 with an optional one, and \chapterannot 2

  @test:adapters/paper/suggest/latex-check.test.ts::the_macro_table::paperMacrosWin
  Scenario: the paper's own macros win over the preamble and built-ins
    Then a paper macro frac with body "#1/#2/#3" takes 3 arguments

  @test:adapters/paper/suggest/latex-check.test.ts::cite_keys_from_the_KG::citeKeysFromIrisAndIds
  Scenario: reference nodes by their `references/<key>` IRI, and CSL entries by id
    Given nodes "references/milnor1965", a full references/garoufalidis2004 IRI, a library block IRI, and a CSL entry with id kassel1995
    Then the cite keys are garoufalidis2004, kassel1995 and milnor1965

  @test:adapters/paper/suggest/latex-check.test.ts::cite_keys_from_the_KG::heldKeyNotWarnedMissingIs
  Scenario: a key the bibliography holds is not warned about; one it lacks is
    Given a KG whose only cite key is docgen4
    Then adding \cite{docgen4} finds nothing
    And adding \cite{nowhere} gives one warning about nowhere

  @test:adapters/paper/suggest/latex-check.test.ts::macroTableFromKatex::katexTableBuiltinsAndArity
  Scenario: built-ins, then each page macro's arity from its body
    When macroTableFromKatex reads \LM, \pair and an invalid "\bad name"
    Then frac takes 2 arguments, LM 0 and pair 2
    And "bad name" is not in the table
    And "$\pair{a}$" checked with that table gives one error
