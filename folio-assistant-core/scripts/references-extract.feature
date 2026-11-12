Feature: a document's reference lists split into its own bibliography

  @test:scripts/references-extract.test.ts::splitEntries::a numbered list splits on its own numbers, with the number on its own line
  Scenario: a numbered list
    When a reference list numbers its entries, with the number on a line of its own
    Then each number opens one entry and the wrapped lines join into it

  @test:scripts/references-extract.test.ts::splitEntries::an unnumbered list splits where an entry closes and the next opens
  Scenario: an unnumbered list
    When a reference list does not number its entries
    Then an entry ends where a line closes a citation and the next line opens with a capital

  @test:scripts/references-extract.test.ts::splitEntries::a page number and a running head between entries are skipped
  Scenario: page furniture between entries
    When a page number or a running head sits between two entries
    Then it is not part of either entry

  @test:scripts/references-extract.test.ts::joinLines keeps a wrapped web address whole
  Scenario: a web address wrapped over two lines
    When an entry's web address is broken at a line end
    Then the address is joined without a space

  @test:scripts/references-extract.test.ts::toReference::reads only what is unambiguous: address, year of the work (not of access), access date
  Scenario: only fields read without guessing
    When an entry is turned into a reference node
    Then it keeps the printed text, the address, the work's year and the access date
    And no title is parsed

  @test:scripts/references-extract.test.ts::toReference::a journal citation is an article, with its DOI
  Scenario: a journal article
    When an entry has a journal's year;volume:pages
    Then the node is an article-journal with its DOI

  @test:scripts/references-extract.test.ts::toReference::French access dates are access dates
  Scenario: an access date in French
    When an entry says consulté le
    Then that date is the access date and not the work's year

  @test:scripts/references-extract.test.ts::irisHandle reads handle and bitstream addresses
  Scenario: a cited IRIS item
    When an entry's address is an IRIS handle or bitstream
    Then the handle is read as the catalogue's item id

  @test:scripts/references-extract.test.ts::listsOf::a whole References section, and a chapter-end list under a heading inside a section
  Scenario: where a list is
    When a section is titled References, or a section holds a References heading
    Then each is a list, and an annex heading ends the one inside the section

  @test:scripts/references-extract.test.ts::listsOf::a contents line naming References is not a list
  Scenario: a contents page
    When a contents page names References with a page number
    Then no list is read from it

  @test:scripts/references-extract.test.ts::listsOf::a list at a page's foot reads on into the next page, which then holds no list of its own
  Scenario: a list over a page break
    When an entry is read one page per section and a list runs onto the next page
    Then it is one list, read once

  @test:scripts/references-extract.test.ts::listsOf::headings in the six UN languages
  Scenario: headings in other languages
    When the heading is Références, Referencias, Литература, المراجع or 参考文献
    Then the list under it is read
