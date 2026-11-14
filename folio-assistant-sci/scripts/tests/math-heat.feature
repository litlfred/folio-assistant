Feature: math-heat — a per-chapter table of how much of a paper is proved, open and under review

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::provedCountsSorryFreeProvables
  Scenario: proved counts sorry-free provables only; a provable with no Lean file is not proved
    Given blocks in ch1: a sorry-free theorem, a lemma with sorries, a corollary with no Lean file, a definition and two conjectures, one external
    When computeMathHeat runs with no optional source
    Then ch1 has 3 provables, 1 proved and 1 conjecture

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::missingSourcesNullNotZero
  Scenario: with every optional source missing, those columns are null on every row, never 0
    When computeMathHeat runs with no Lean, register, beans or QA
    Then it says it has none of them
    And on every row sorries, axioms, open and unregistered conjectures, active beans and verdicts are null

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::noBlocksNoRows
  Scenario: no blocks read gives no rows, not a row of zeros
    When computeMathHeat runs with no blocks read
    Then there are no rows

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::leanCountsOnTheirChapter
  Scenario: lean-audit's counts land on their chapter; a chapter it does not list stays null
    When computeMathHeat runs with lean-audit counts of 4 sorries and 2 axioms for ch1
    Then ch1 has 4 sorries and 2 axioms
    And ch2's sorries and axioms are null

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::openConjecturesFollowRegister
  Scenario: open conjectures follow the register; famous ones are left out; one with no node is unregistered
    Given a register with conj:own attempted, conj:done proved and the external conj:famous open
    When computeMathHeat runs with it
    Then ch1 has 1 conjecture, 1 open and 0 unregistered
    And ch2 has 2 conjectures, 0 open and 1 unregistered

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::activeBeansDistinctPerChapter
  Scenario: active beans are distinct per chapter
    Given active beans b1 and b2 on thm:a, b1 on lem:b, and b3 on conj:new
    When computeMathHeat runs with them
    Then ch1's active beans are b1 and b2, ch2's are b3, and the paper root has none

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::verdictsSplitByQaState
  Scenario: verdicts split by QA state, and a block the QA file lacks is counted as no record
    Given QA states passing, failing, stale and unaudited for four of ch1's blocks
    When computeMathHeat runs with them
    Then ch1's verdicts are 1 failing, 1 stale, 1 unaudited, 1 passing and 2 with no record

  @test:scripts/tests/math-heat.test.ts::computeMathHeat::rowsByNameRootLast
  Scenario: rows are chapters by name, the paper root last
    When computeMathHeat runs
    Then the rows are ch1, ch2 and the paper root

  @test:scripts/tests/math-heat.test.ts::helpers::chapterOfFirstDirUnderPaper
  Scenario: chapterOf takes the first directory under the paper; a file at the paper root is in none
    Then the chapter of /r/content/qou/ch3-spectra/sec1/thm.ts is ch3-spectra
    And the chapter of /r/content/qou/intro.ts is the paper root

  @test:scripts/tests/math-heat.test.ts::helpers::activeBeansKeepsInProgressResolved
  Scenario: activeBeansByLabel keeps in-progress beans with a resolved block
    Given an in-progress bean a targeting thm:x twice and once with no label, and a todo bean b targeting thm:x
    Then activeBeansByLabel gives thm:x the bean a only

  @test:scripts/tests/math-heat.test.ts::helpers::readRegisterSkipsOtherJson
  Scenario: readRegister reads register nodes and skips other JSON
    Given a directory with a register node, a JSON file of another schema and a Markdown file
    Then readRegister returns only conj:a, open

  @test:scripts/tests/math-heat.test.ts::helpers::tableShowsUnknownAsQuestionMark
  Scenario: the table shows an unknown cell as ?, and says why
    Given the heat of one sorry-free theorem
    When formatMathHeat formats it with lean "no Lean tree" and qa "no --qa file given"
    Then the table shows "1/1"
    And it explains "? = no data (not zero):" with "lean: no Lean tree"
    And it says nothing about the register
