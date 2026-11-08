Feature: A staging-only visualisation reaches the preview and never the canonical deploy
  Read from the real workflow files: feature-staging.yml (the preview) and
  docs-site.yml (the canonical publisher). Commented-out lines are ignored.

  @test:test/workflows/staging-only-publish.test.ts::the_workflows_sit_on_the_right_side_of_the_default::the_preview_composes_with_--staging
  Scenario: The preview composes with --staging
    Given the uncommented lines of feature-staging.yml that call compose-docs.ts
    Then there is at least one such line
    And every one of them contains "--staging"

  @test:test/workflows/staging-only-publish.test.ts::the_workflows_sit_on_the_right_side_of_the_default::the_canonical_publisher_composes_WITHOUT_it
  Scenario: The canonical publisher composes without --staging
    Given the uncommented lines of docs-site.yml that call compose-docs.ts
    Then there is at least one such line
    And none of them contains "--staging"
