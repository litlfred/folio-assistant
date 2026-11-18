Feature: export-json guards every touch of the reference registry, so a folio with no bibliography exports

  @test:pipeline/export-json-no-registry.test.ts::export-json_guards_every_registry_touch::asksRegistryConfiguredNotCatch
  Scenario: asks whether a registry is configured rather than catching
    Given the source of export-json.ts
    Then it calls referenceRegistryConfigured
    And no catch is followed closely by referenceMap

  @test:pipeline/export-json-no-registry.test.ts::export-json_guards_every_registry_touch::paperReferencesFieldGuarded
  Scenario: the paper-level `references` field is guarded
    Given the source of export-json.ts
    Then the references field is "referenceRegistryConfigured() ? references : []"

  @test:pipeline/export-json-no-registry.test.ts::export-json_guards_every_registry_touch::chapterBibliographyGuarded
  Scenario: the per-chapter bibliography is guarded too
    Given the part of export-json.ts from "const bibliography" to "chapters.push"
    Then it calls referenceRegistryConfigured() and referenceMap.get

  @test:pipeline/export-json-no-registry.test.ts::export-json_guards_every_registry_touch::saysUnresolvedCitesInOutput
  Scenario: says so in the output rather than exporting an empty list silently
    Given the source of export-json.ts
    Then it contains "no reference registry configured" and "cites[] were NOT resolved"
