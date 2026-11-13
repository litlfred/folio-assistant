# The instance a root-level library or upload queue belongs to is the root's
# declared name, not its clone folder (bean t5dm, issue #1904).
Feature: The instance a library directory is attributed to

  @test:scripts/tests/library/library-graph-instance.test.ts::instanceOf_(bean_t5dm)::a_root-level_directory_belongs_to_the_root's_declared_name,_whatever_the_clone_is_called
  Scenario: A root-level directory belongs to the declared name
    Given a repository cloned into folder "pr1290" that declares the name "folio-assistant"
    When the instance of its uploads directory is read
    Then it is "folio-assistant"

  @test:scripts/tests/library/library-graph-instance.test.ts::instanceOf_(bean_t5dm)::the_same_repository_cloned_under_two_folder_names_gives_one_answer
  Scenario: Two clones under different folder names give one answer
    Given the same declared repository cloned as "folio-assistant" and as "worktree-xyz"
    When the instance of each clone's uploads directory is read
    Then both answers are equal

  @test:scripts/tests/library/library-graph-instance.test.ts::instanceOf_(bean_t5dm)::a_sub-instance_is_its_path_inside_the_repository_—_unchanged_by_the_clone's_name
  Scenario: A sub-instance is named by its path inside the repository
    Given a repository cloned into folder "pr1290" holding who-iris/library
    When the instance of who-iris/library is read
    Then it is "who-iris"

  @test:scripts/tests/library/library-graph-instance.test.ts::instanceOf_(bean_t5dm)::a_root_that_declares_nothing_belongs_to_its_only_instantiated_harness,_not_its_folder
  Scenario: An undeclared root belongs to its only instantiated harness
    Given an undeclared root in folder "smart-trust" holding smart-base.config.json
    When the instance of its uploads directory is read
    Then it is "smart-base"

  @test:scripts/tests/library/library-graph-instance.test.ts::instanceOf_(bean_t5dm)::a_root_that_declares_nothing_and_decides_no_landing_harness_is_an_error,_not_a_guess
  Scenario: An undeclared root with no landing harness is an error
    Given an undeclared root in folder "bare-folio" with no harness config
    When the instance of its uploads directory is read
    Then it throws an error naming "issue #1904"
