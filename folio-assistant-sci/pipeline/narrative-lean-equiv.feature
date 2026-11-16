Feature: narrative–Lean equivalence — what a script can decide from a block's narrative, metadata and Lean

  @test:pipeline/narrative-lean-equiv.test.ts::extractKind::kindFromBuilderCall
  Scenario: reads the builder call
    Then extractKind of a definition(...) block is "definition"
    And of a conjecture(...) block is "conjecture"

  @test:pipeline/narrative-lean-equiv.test.ts::extractKind::kindNotFooledByAuthorNotes
  Scenario: is NOT fooled by a `kind:` inside authorNotes
    Given a definition(...) block whose authorNotes hold an entry of kind "note"
    Then extractKind is "definition"

  @test:pipeline/narrative-lean-equiv.test.ts::extractKind::kindFromTopLevelField
  Scenario: still honours an explicit top-level kind when there is no builder
    Then extractKind of a line kind: "remark" is "remark"

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdDeclaredKind::mdKindFromBoldDeclaration
  Scenario: reads a bold self-declaration
    Then "**Proposition.** Every gadget is flat." declares proposition
    And "**Conjecture.** *V is the valley.*" declares conjecture

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdDeclaredKind::mdKindFromEnvAndHeading
  Scenario: reads a LaTeX environment and a heading
    Then a \begin{theorem} environment declares theorem
    And a "### Lemma" heading declares lemma

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdDeclaredKind::mdKindParentheticalForm
  Scenario: carries the parenthetical form used in the corpus
    Then "**Proposition (conditional on [`conj:x`](#conj:x)).**" declares proposition

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdDeclaredKind::mdKindUndefinedWithoutDeclaration
  Scenario: is undefined when the narrative does not self-declare
    Then "The braid group acts on the tower." declares no kind

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdDeclaredKind::mdKindIgnoresFencedCode
  Scenario: ignores a kind word inside a fenced code block
    Then "**Theorem.**" inside a fenced code block, followed by prose, declares no kind

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdStatement::statementAfterBoldMarker
  Scenario: finds the sentence after a bold marker
    Then the statement of "**Theorem.** Every gadget is flat." is "Every gadget is flat."

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdStatement::statementFallsBackToFirstLine
  Scenario: falls back to the first substantive line
    Then the statement of a title, a quote and "The real claim." is "The real claim."

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdStatement::loneLabelNotStatement
  Scenario: a lone label line is a header, not a statement
    Then "**Theorem.**" alone has no statement

  @test:pipeline/narrative-lean-equiv.test.ts::extractMdStatement::headingsDirectivesOnlyUndefined
  Scenario: headings and directives only ⇒ undefined
    Then a narrative of only headings and a directive has no statement

  @test:pipeline/narrative-lean-equiv.test.ts::checkEquivalence_—_narrative_side::warnsNarrativeStrongerThanMetadata
  Scenario: warns when the narrative claims a stronger kind than the metadata
    Given a conjecture block whose narrative opens "**Proposition.**", and a Lean theorem
    When checkEquivalence checks it
    Then it warns, with evidence naming proposition and conjecture

  @test:pipeline/narrative-lean-equiv.test.ts::checkEquivalence_—_narrative_side::warnsRemarkStatingConjecture
  Scenario: warns when a remark's narrative states a conjecture
    Given a remark block whose narrative opens "**Conjecture.**"
    When checkEquivalence checks it
    Then it warns with a note saying "kind mismatch"

  @test:pipeline/narrative-lean-equiv.test.ts::checkEquivalence_—_narrative_side::noWarnWithinProvableFamily
  Scenario: does NOT warn on prose-style variation within the provable family
    Given a proposition block whose narrative opens "**Theorem.**"
    When checkEquivalence checks it
    Then it does not warn

  @test:pipeline/narrative-lean-equiv.test.ts::checkEquivalence_—_narrative_side::noWarnWithoutSelfDeclaration
  Scenario: does NOT warn when the narrative makes no self-declaration
    Given a proposition block whose narrative is plain prose
    When checkEquivalence checks it
    Then it does not warn

  @test:pipeline/narrative-lean-equiv.test.ts::checkEquivalence_—_narrative_side::warnsProvableWithEmptyNarrative
  Scenario: warns when a provable block's narrative states nothing at all
    Given a theorem block whose narrative is only a heading and a directive
    When checkEquivalence checks it
    Then it warns, with evidence saying "no statement"

  @test:pipeline/narrative-lean-equiv.test.ts::checkEquivalence_—_narrative_side::emptyNarrativeNonProvableIgnored
  Scenario: an empty narrative on a NON-provable block is not this check's business
    Given a remark block whose narrative is only a heading
    When checkEquivalence checks it
    Then its evidence does not say "no statement"
