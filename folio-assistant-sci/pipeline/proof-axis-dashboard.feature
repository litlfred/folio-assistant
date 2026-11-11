Feature: proof-axis-dashboard — listing the Lean files that still contain a sorry

  @test:pipeline/proof-axis-dashboard.test.ts::proof-axis-dashboard_leanFilesWithSorry::listsSorryLeanFilesSkipsLeanDirs
  Scenario: lists *.lean files with a whole-word sorry, skips /lean/ paths, and treats the root as data
    Given a temporary root whose name contains shell metacharacters
    And ch1/A.lean with "by sorry", ch1/B.lean with only "sorryless" in a comment
    And "ch$(x)/C`d`.lean" with "sorry", ch2/lean/D.lean with "sorry", and ch2/E.md with "sorry"
    When leanFilesWithSorry reads the root
    Then it lists exactly "ch$(x)/C`d`.lean" and ch1/A.lean, sorted
    And for a root that does not exist it lists nothing
