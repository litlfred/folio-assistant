Feature: glossary:page leaves a mounted layer's extracted schemes alone

  @test:scripts/glossary-page-mounts.test.ts::inMount::a_path_inside_a_mount,_and_the_mount_itself
  Scenario: a path inside a mount, and the mount itself, are in the mount
    Given the mounts core-layer and ig-layer under the checkout
    When ig-layer/x.json and ig-layer itself are tested
    Then both are in a mount

  @test:scripts/glossary-page-mounts.test.ts::inMount::a_sibling_whose_name_only_starts_like_a_mount_is_not_in_it
  Scenario: a sibling whose name only starts like a mount is not in it
    Given the mount ig-layer
    When ig-layer-2/x.json is tested
    Then it is not in a mount

  @test:scripts/glossary-page-mounts.test.ts::isMountedScheme::an_extracted_scheme_under_a_mounted_layer's_glossary/generated/_is_left_alone
  Scenario: an extracted scheme under a mounted layer's glossary/generated/ is left alone
    Given the mounted core-layer and its glossary/generated/ directory
    When core-layer/glossary/generated/some-ig/skills.glossary.json is tested
    Then it is a mounted scheme

  @test:scripts/glossary-page-mounts.test.ts::isMountedScheme::an_extracted_scheme_of_the_checkout's_own_layer_is_written
  Scenario: an extracted scheme of the checkout's own layer is written
    Given the checkout's own layer own, which is not mounted
    When own/glossary/generated/own/skills.glossary.json is tested
    Then it is not a mounted scheme

  @test:scripts/glossary-page-mounts.test.ts::isMountedScheme::any_other_file_in_a_mount_(the_site's_pages,_step_4)_is_not_this_filter's
  Scenario: any other file in a mount is not this filter's
    Given the mounted core-layer
    When core-layer/docs/page.md, which is outside every glossary/generated/ directory, is tested
    Then it is not a mounted scheme
