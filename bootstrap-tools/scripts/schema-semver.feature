Feature: the bump classifier behind bootstrap:semver — what each change to a published schema requires

  Background:
    Given a small published-shaped base schema: a closed object with a required non-empty name, an optional kind of a or b, and an optional note
    And each case's bump is classified from the old version to the new, the base being the old version unless stated

  @test:scripts/schema-semver.test.ts::fieldMadeRequiredIsMajor
  Scenario: a field made required
    Given the base schema with "kind" also made required
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::closedFieldRemovedIsMajor
  Scenario: a field removed from a closed object
    Given the base schema with the "note" property removed
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::enumNarrowedIsMajor
  Scenario: an enum narrowed
    Given the base schema with kind's enum narrowed from a, b to a
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::lowerBoundRaisedIsMajor
  Scenario: a lower bound raised
    Given the base schema with name's minLength raised from 1 to 3
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::patternAddedIsMajor
  Scenario: a pattern added
    Given the base schema with a pattern added to note
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::strictnessTightenedIsMajor
  Scenario: strictness tightened: additionalProperties: false added
    Given the base schema without additionalProperties as the old version, and the base schema as the new
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::conditionalAddedIsMajor
  Scenario: a conditional added
    Given the base schema with an if/then conditional added
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::idChangedIsMajor
  Scenario: the $id changed
    Given the base schema with its $id changed to another file
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::schemaRemovedIsMajor
  Scenario: a published schema removed
    Given the base schema as the old version and no new version
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::unknownKeywordChangeIsMajor
  Scenario: an unrecognised keyword changed is graded breaking, not harmless
    Given the base schema with a dependentRequired keyword added to note
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::optionalFieldAddedIsMinor
  Scenario: an optional field added
    Given the base schema with an optional "extra" string property added
    Then the required bump is minor

  @test:scripts/schema-semver.test.ts::requiredRelaxedIsMinor
  Scenario: a required field relaxed
    Given the base schema with no required fields
    Then the required bump is minor

  @test:scripts/schema-semver.test.ts::enumWidenedIsMinor
  Scenario: an enum widened
    Given the base schema with "c" added to kind's enum
    Then the required bump is minor

  @test:scripts/schema-semver.test.ts::strictnessRelaxedIsMinor
  Scenario: strictness relaxed
    Given the base schema without additionalProperties false
    Then the required bump is minor

  @test:scripts/schema-semver.test.ts::schemaPublishedIsMinor
  Scenario: a new schema published
    Given no old version and the base schema as the new
    Then the required bump is minor

  @test:scripts/schema-semver.test.ts::requiredFieldAddedIsMajor
  Scenario: a field added AND made required is major, not minor
    Given the base schema with an "extra" property added and made required
    Then the required bump is major

  @test:scripts/schema-semver.test.ts::descriptionRewrittenIsPatch
  Scenario: a description rewritten
    Given the base schema with a description added to name
    Then the required bump is patch

  @test:scripts/schema-semver.test.ts::releaseIriBumpIsNone
  Scenario: a release IRI moving to the next version is not a change to what validates
    Given the schema with its $id under release 0.1.0 as the old version and under 0.2.0 as the new
    Then the required bump is none

  @test:scripts/schema-semver.test.ts::releaseIriToMajorIsNone
  Scenario: a release IRI moving from the full version to the major (owner, 2026-10-23) is not a change either
    Given the schema with its $id under 0.1.0 as the old version and under v0 as the new
    Then the required bump is none

  @test:scripts/schema-semver.test.ts::keyOrderIsNone
  Scenario: key order and indentation are not a change
    Given the base schema as the old version and its keys reversed, unindented, as the new
    Then the required bump is none

  @test:scripts/schema-semver.test.ts::foldTakesHighest
  Scenario: the fold takes the highest
    Given the differences from retitling the base schema, plus one extra minor difference
    When the required bump is folded from them
    Then it is minor

  @test:scripts/schema-semver.test.ts::unreadableBaseUndetermined
  Scenario: an unreadable base
    Given an old version that could not be read and the base schema as the new
    Then the required bump is could not determine

  @test:scripts/schema-semver.test.ts::unparsableBaseUndetermined
  Scenario: a base that does not parse
    Given an old version that is not valid JSON and the base schema as the new
    Then the required bump is could not determine

  @test:scripts/schema-semver.test.ts::unparsableHeadUndetermined
  Scenario: a head that does not parse
    Given the base schema as the old version and a new version that is not valid JSON
    Then the required bump is could not determine

  @test:scripts/schema-semver.test.ts::unresolvedRefUndetermined
  Scenario: a ref that does not resolve, read through git
    When bootstrap/schemas/graph.schema.json is read through git at a branch that does not exist
    Then the read is reported unreadable
    And classifying it against the current graph schema gives could not determine
