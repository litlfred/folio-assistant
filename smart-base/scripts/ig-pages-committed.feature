Feature: The committed WHO IG pages and data
  What fhir-harness's generic scripts produce for /smart-base/ and
  /smart-trust/ in this checkout: the banner, the landing page and artefact
  index node, the IG identities, and site.data.fhir.

  @test:smart-base/scripts/ig-pages-committed.test.ts::the_committed_pages:_the_banner's_identity_is_the_index's::smartTrustKeepsDraftWatermark
  Scenario: smart-trust, whose chrome IS its own, keeps its draft watermark
    Given the banner of smart-trust's committed docs/artifact/ActorDefinition-Holder.json.md
    Then it links ">smart.who.int.trust</a>"
    And it carries class "ig-status-draft"

  @test:smart-base/scripts/ig-pages-committed.test.ts::the_committed_pages:_the_banner's_identity_is_the_index's::smartBaseBannerNamesItselfNoStatus
  Scenario: smart-base names itself and asserts no status borrowed from smart-trust
    Given the banner of smart-base's committed docs/artifact/StructureDefinition-DAK.schema.json.md
    Then it links ">smart.who.int.base</a>" and contains "http://smart.who.int/base"
    And it does not contain "smart.who.int.trust" or any "ig-status-" class

  @test:smart-base/scripts/ig-pages-committed.test.ts::the_committed_pages:_the_landing_page::smartBaseNoLandingPageIndexNode
  Scenario: smart-base commits no landing page, and its artefact index is the thin page's node
    Then smart-base has no docs/index.md and no docs/artifacts.md
    And its docs/artifact/index.jsonld is a folio-ig-artifact-index-jsonld/v1 node identified "smart.who.int.base" and titled "WHO SMART Base"

  @test:smart-base/scripts/ig-pages-committed.test.ts::the_committed_pages:_the_landing_page::smartTrustNoLandingPageIndexNode
  Scenario: smart-trust commits no landing page, and its artefact index is the thin page's node
    Then smart-trust has no docs/index.md and no docs/artifacts.md
    And its docs/artifact/index.jsonld is a folio-ig-artifact-index-jsonld/v1 node identified "smart.who.int.trust" and titled "WHO SMART Trust"

  @test:smart-base/scripts/ig-pages-committed.test.ts::the_committed_identities::smartTrustIdentityValidates
  Scenario: smart-trust's validates and names its own package
    Given smart-trust's IG identity read from its fhir-artifact-index
    Then it exists, validates against the IG identity schema, and its id is "smart.who.int.trust"

  @test:smart-base/scripts/ig-pages-committed.test.ts::the_committed_identities::smartBaseHasNoIdentity
  Scenario: smart-base has none, so it states no status (the third state)
    Then reading smart-base's IG identity from its fhir-artifact-index finds none

  @test:smart-base/scripts/ig-pages-committed.test.ts::site.data.fhir_from_smart-base's_committed_artifact_index::writesWhatIndexCarries
  Scenario: writes what the index carries, from the index
    Given site.data.fhir built from smart-base
    Then its packageId is "smart.who.int.base" and its canonical "http://smart.who.int/base"
    And its IG version is "0.3.0" and its FHIR versions are ["4.0.1"]
    And the IG version's provenance is "fhir-artifact-index/index.json"

  @test:smart-base/scripts/ig-pages-committed.test.ts::site.data.fhir_from_smart-base's_committed_artifact_index::listsUndeterminedNotEmptyStrings
  Scenario: lists what it could not source instead of writing empty strings
    Given site.data.fhir built from smart-base
    Then the undetermined fields include "ig.id", "ig.name" and "ig.publisher"
    And the data contains no empty string

  @test:smart-base/scripts/ig-pages-committed.test.ts::site.data.fhir_from_smart-base's_committed_artifact_index::smartBaseStatesNoStatus
  Scenario: states no status: smart-base has no ig-identity.json, and the template's chrome states none
    Given site.data.fhir built from smart-base
    Then it has no IG status and nothing refused

  @test:smart-base/scripts/ig-pages-committed.test.ts::site.data.fhir_from_smart-trust's_index,_which_carries_its_own_ig-identity.json::statusFromOwnIdentityFile
  Scenario: status comes from the IG's own identity file
    Given site.data.fhir built from smart-trust
    Then its IG status is "draft", with provenance "fhir-artifact-index/ig-identity.json"
