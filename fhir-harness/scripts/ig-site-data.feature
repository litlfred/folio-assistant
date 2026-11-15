Feature: Populating site.data.fhir for an IG site

  @test:scripts/ig-site-data.test.ts::from_sushi-config.yaml_(what_the_IG_Publisher_reads)::fieldsFromSushiConfig
  Scenario: the ImplementationGuide fields and the package identity
    Given a sushi-config.yaml with id, canonical, name, title, status, version, FHIR version and publisher
    When the site data is built
    Then the package id defaults to the id, and the ImplementationGuide's id, url, name, title, version, status, publisher and FHIR versions are set
    And nothing is undetermined

  @test:scripts/ig-site-data.test.ts::from_published_IGs'_artifact_indexes::an_index_with_no_identity_file::indexFieldsFromIndex
  Scenario: writes what the index carries, from the index
    Given a published IG's artifact index with no identity file
    Then the package id, canonical, version and FHIR version come from the index, and the version's provenance names the index

  @test:scripts/ig-site-data.test.ts::from_published_IGs'_artifact_indexes::an_index_with_no_identity_file::listsUnsourcedFields
  Scenario: lists what it could not source instead of writing empty strings
    Given a published IG's artifact index with no identity file
    Then the id, name and publisher are undetermined
    And no empty string is written

  @test:scripts/ig-site-data.test.ts::from_published_IGs'_artifact_indexes::an_index_with_no_identity_file::noIdentityNoStatus
  Scenario: states no status: there is no ig-identity.json, and a chrome states none
    Given a published IG's artifact index with no identity file
    Then no status is stated and nothing is refused

  @test:scripts/ig-site-data.test.ts::from_published_IGs'_artifact_indexes::an_index_beside_its_own_ig-identity.json::statusFromIdentityFile
  Scenario: status comes from the IG's own identity file
    Given an artifact index beside its own identity file
    Then the status is "active", from the identity file

  @test:scripts/ig-site-data.test.ts::noSourceIsError
  Scenario: no source at all is an error, not an empty site.data.fhir
    Given a directory with no source
    Then building the site data throws "nothing to populate"

  @test:scripts/ig-site-data.test.ts::from_the_FHIR_AST_first_(owner_2026-10-09,_bean_jut3)::astSuppliesEveryField
  Scenario: the ImplementationGuide resource supplies every field, provenance naming the AST as a cache
    Given an AST holding the ImplementationGuide
    When the site data is built
    Then every field comes from the ImplementationGuide
    And the version's provenance names the AST as a cache
    And nothing is undetermined and nothing disagrees

  @test:scripts/ig-site-data.test.ts::from_the_FHIR_AST_first_(owner_2026-10-09,_bean_jut3)::sushiFillsGapsOnly
  Scenario: sushi-config fills only gaps; a field it states differently is a disagreement, the AST's value kept
    Given an AST whose ImplementationGuide has no publisher, and a sushi-config with another version and a publisher
    When the site data is built
    Then the AST's version "0.2.0" is kept and the publisher "Example Org" comes from sushi-config
    And the version difference is reported as a disagreement

  @test:scripts/ig-site-data.test.ts::from_the_FHIR_AST_first_(owner_2026-10-09,_bean_jut3)::astWithoutIgNotUsed
  Scenario: an AST with no ImplementationGuide is reported and not used; the build goes on from sushi-config
    Given an AST holding no ImplementationGuide and a sushi-config
    When the site data is built
    Then the AST is reported as not used, holding 0 ImplementationGuide resources
    And nothing is refused and the package id comes from sushi-config
