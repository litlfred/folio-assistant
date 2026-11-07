Feature: ArchiMate depictions for glossary terms

  @test:scripts/glossary-archimate.test.ts::glossary-archimate::newestFirstReleaseBeforeDrafts
  Scenario: models sort newest first, a release before its drafts
    When model versions are sorted
    Then the newest comes first and a release before its drafts

  @test:scripts/glossary-archimate.test.ts::glossary-archimate::noModelNoDepictions
  Scenario: a repository with no ArchiMate model depicts nothing
    When depictions are asked of a repository with no model
    Then there are none
