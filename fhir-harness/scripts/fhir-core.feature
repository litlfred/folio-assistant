# Specifies scripts/fhir-core.ts and schemas/fhir-core.ts: the stable FHIR
# releases' core StructureDefinitions, read from hash-pinned packages, kept as
# one graph per release keyed by canonical URL.
Feature: The FHIR core definitions of each stable release, read from a pinned package

  @test:scripts/fhir-core.test.ts::fhir-core::selection::keeps_types,_resources_and_root_types,_and_leaves_out_profiles,_extensions_and_logical_models
  Scenario: The graph holds the types and resources, not the profiles
    Given core StructureDefinitions of every kind
    Then a root type, a resource specialisation and a primitive type are kept
    And a constraint profile, a logical model and a definition outside the core canonical base are left out

  @test:scripts/fhir-core.test.ts::fhir-core::index::writes_a_manifest_keyed_by_canonical_URL,_sorted,_with_counts_and_each_file's_sha256
  Scenario: Indexing a release writes its manifest
    Given a pinned core package holding types, resources, a profile, an extension and a logical model
    When the release is indexed from the pinned URL
    Then the manifest lists the types and resources by canonical URL in order
    And it counts the three left out as excluded
    And each entry carries its base definition, and a root type carries none

  @test:scripts/fhir-core.test.ts::fhir-core::index::an_unreachable_package_is_recorded_as_unread_with_the_reason,_never_as_an_empty_graph
  Scenario: A package that cannot be fetched is unread, not empty
    Given the registry cannot be reached
    When the release is indexed
    Then its manifest says "unread" with the reason
    And it has no definitions field at all

  @test:scripts/fhir-core.test.ts::fhir-core::index::bytes_that_differ_from_the_pin_are_refused_and_the_release_is_unread
  Scenario: Bytes that are not the pinned package are refused
    Given the fetched tarball's hash is not the pin's
    When the release is indexed
    Then the release is unread and the reason names the sha1 mismatch

  @test:scripts/fhir-core.test.ts::fhir-core::index::a_tarball_in_--tgz-dir_is_used,_and_still_checked_against_the_pin
  Scenario: A local tarball is used and still checked
    Given the pinned tarball in a local directory
    When the release is indexed with --tgz-dir
    Then it is read without fetching

  @test:scripts/fhir-core.test.ts::fhir-core::materialise,_check_and_resolve::bodies_are_written_byte_for_byte_and_check_holds_them_to_the_manifest
  Scenario: Materialised bodies are the package's bytes and resolve by canonical URL
    Given an indexed release
    Then a canonical URL resolves as undetermined before materialising
    When its bodies are materialised
    Then each body is byte for byte the package's file and check reports no error
    And a versioned canonical resolves to its file, a type the release lacks is absent, and a profile is never written

  @test:scripts/fhir-core.test.ts::fhir-core::materialise,_check_and_resolve::an_edited_body,_or_a_file_no_entry_names,_fails_check
  Scenario: Check refuses an edited body or a stray file
    Given a materialised release with one body edited and one file no entry names
    When it is checked
    Then both are errors

  @test:scripts/fhir-core.test.ts::fhir-core::materialise,_check_and_resolve::an_unread_release_cannot_be_materialised_and_resolves_as_undetermined
  Scenario: An unread release stays undetermined
    Given an unread release
    Then materialising it fails and a canonical URL resolves as undetermined

  @test:scripts/fhir-core.test.ts::fhir-core::materialise,_check_and_resolve::a_manifest_that_names_a_package_other_than_the_pin_fails_check
  Scenario: A re-pin without a re-index is caught
    Given a manifest indexed from one package and a pin naming another
    When it is checked
    Then it is an error naming the pin

  @test:scripts/fhir-core.test.ts::fhir-core::node_kinds::the_kinds_the_validators_name_judge_the_files_as_the_schemas_do
  Scenario: The node kinds judge as the schemas do
    Given an indexed release and its pins
    Then the release kind accepts the manifest and refuses an extra key
    And it refuses an unread release that still lists definitions, and accepts one that lists none
    And the pins kind accepts the pins and refuses a release pinned twice

  @test:scripts/fhir-core.test.ts::fhir-core::the_committed_graph::the_committed_pins_and_manifests_check_clean,_one_stable_release_each
  Scenario: The committed graph is R4, R4B and R5, and checks clean
    Given this layer's fhir-core directory
    Then its pins and manifests check clean
    And each release holds Element, BackboneElement, DomainResource, Resource, Coding, Reference, Patient and string
    And only R5 holds Base
