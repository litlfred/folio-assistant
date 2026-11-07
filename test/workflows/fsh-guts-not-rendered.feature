Feature: No publish workflow's Jekyll source contains the fsh-guts trashcan
  The trashcan keeps content without publishing it. This reads every
  `source:` input, and every `--source` of a one-line `bundle exec jekyll
  build` step, in this repository's `.github/workflows/`.

  @test:test/workflows/fsh-guts-not-rendered.test.ts::fsh-guts_stays_out_of_the_render_pipeline::at_least_one_workflow_declares_a_Jekyll_source,_so_the_check_has_teeth
  Scenario: At least one workflow declares a Jekyll source, so the check has teeth
    Given the Jekyll source roots read from the workflow files
    Then there is more than zero of them

  @test:test/workflows/fsh-guts-not-rendered.test.ts::fsh-guts_stays_out_of_the_render_pipeline::no_Jekyll_source_root_contains_it
  Scenario: No Jekyll source root contains the trashcan
    Given the Jekyll source roots read from the workflow files
    And the declared fsh-guts directory, resolved relative to the repository root
    When each source root is checked for that directory on disk, repository-relative
    Then no source root contains it
