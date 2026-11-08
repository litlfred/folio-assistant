Feature: latex-known-macros.json — the list of macros and Unicode characters LaTeX knows

  @test:pipeline/latex-known-macros.test.ts::latex-known-macros::macrosAndUnicodeSortedUnique
  Scenario: loads valid JSON with sorted and deduplicated macros
    When latex-known-macros.json is read and parsed
    Then its macros and its unicode entries are both arrays
    And each is sorted
    And neither holds a duplicate

  @test:pipeline/latex-known-macros.test.ts::latex-known-macros::containsPhantomAndLessgtr
  Scenario: contains \phantom (LaTeX core) and \lessgtr (amssymb) (bean tdi0)
    When latex-known-macros.json is read and parsed
    Then its macros contain "\phantom" and "\lessgtr"
