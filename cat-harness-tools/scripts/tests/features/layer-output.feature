# A mounted layer's computed files go to build/layers/<instance>/, a local
# layer's stay inside it, and a reader sees the computed file over the pinned
# bytes (cat-tools-sm8r). Each Scenario names the test that executes it.
Feature: The layer output resolver

  @test:scripts/tests/layer-output.test.ts::mountedInstances::reads_the_lock's_instances_and_their_mount_paths
  Scenario: The lock's instances and their mount paths are the mounted instances
    Given a lock naming upper-ig and lower at their paths
    When the mounted instances are read
    Then they are upper-ig at upper-ig and lower at lower, in lock order

  @test:scripts/tests/layer-output.test.ts::mountedInstances::no_lock:_nothing_is_mounted
  Scenario: With no lock nothing is mounted
    Given a checkout with no index.lock.json
    When the mounted instances are read
    Then there are none

  @test:scripts/tests/layer-output.test.ts::mountedInstances::a_lock_that_does_not_parse_throws_rather_than_reading_as_'nothing_mounted'
  Scenario: A lock that does not parse throws
    Given an index.lock.json that is not JSON
    When the mounted instances are read
    Then it throws saying the mounts cannot be determined

  @test:scripts/tests/layer-output.test.ts::outputPathFor::a_mounted_instance_writes_under_build/layers/<instance>/
  Scenario: A mounted instance writes under build/layers/<instance>/
    Given upper-ig is mounted
    When the output path of one of its files is resolved
    Then it is that file under the layer output root's upper-ig directory

  @test:scripts/tests/layer-output.test.ts::outputPathFor::a_local_instance_writes_inside_itself,_as_before
  Scenario: A local instance writes inside itself
    Given an instance the lock does not name, and an instance at the checkout root
    When the output path of a file in each is resolved
    Then each is the file in the instance's own directory

  @test:scripts/tests/layer-output.test.ts::readPathFor::the_computed_file_wins_over_the_pinned_bytes
  Scenario: The computed file wins over the pinned bytes
    Given a mounted file both pinned in the mount and computed under the output root
    When its read path is resolved
    Then it is the computed file

  @test:scripts/tests/layer-output.test.ts::readPathFor::with_nothing_computed,_the_reader_falls_back_to_the_mount
  Scenario: With nothing computed the reader falls back to the mount
    Given a mounted instance with no computed file
    When a file's read path is resolved
    Then it is the file in the mount

  @test:scripts/tests/layer-output.test.ts::outputTwinOf_/_readPathAt_—_a_reader_holding_an_absolute_path::a_path_in_a_mounted_layer_has_a_twin_under_the_output_root;_a_local_or_outside_path_has_none
  Scenario: Only a path in a mounted layer has an output twin
    When the output twin is asked of a path inside upper-ig and of upper-ig itself
    Then each is the same path under the output root
    And a sibling directory sharing the prefix, a local instance's path, and a path outside the checkout have none

  @test:scripts/tests/layer-output.test.ts::outputTwinOf_/_readPathAt_—_a_reader_holding_an_absolute_path::the_twin_when_it_exists,_else_the_path_itself_—_no_writer_at_the_output_root_changes_nothing
  Scenario: An absolute path reads its twin when the twin exists, else itself
    Given a file in upper-ig with no computed twin
    When its read path is resolved it is the file itself
    And once the twin is written, the file and its directory each resolve to the twin
    And a local instance's file resolves to itself
