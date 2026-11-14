Feature: language-trap-audit — rhetorical trap detectors, prose stripping, the report, and sidecar attestations

  @test:pipeline/language-trap-audit.test.ts::language-trap-audit_helpers::parsesKindAndLabel
  Scenario: parseKind and parseLabel extract builder kind and label from .ts source
    Given the source of a remark block labelled "rem:gauge-fixing"
    Then parseKind gives "remark" and parseLabel gives "rem:gauge-fixing"
    And remark is a prose kind and equation is not

  @test:pipeline/language-trap-audit.test.ts::language-trap-audit_helpers::proseStripsMathCodeTablesLinks
  Scenario: prose strips math, code fences, inline code, tables, and markdown links
    Given Markdown with a link, inline math, display math, a table and a final prose line
    When prose strips it
    Then it keeps the link text "a link" but not its URL
    And it drops "x^2" and the table's "col1"
    And it keeps "Final line of prose."

  @test:pipeline/language-trap-audit.test.ts::language-trap-audit_helpers::wordCountAndSentencesSplit
  Scenario: wordCount and sentences split prose cleanly
    Then wordCount of "One two three four." is 4 and of blank text is 0
    And sentences splits a three-sentence text into 3

  @test:pipeline/language-trap-audit.test.ts::findingsFor_across_LLM_rhetorical_trap_criteria::detectsNegationContrast
  Scenario: detects trap-negation-contrast ('not a X, but Y')
    Given a block saying the framework "is not a mere approximation, but a complete reformulation"
    When findingsFor checks it for trap-negation-contrast
    Then there is 1 finding and it fails
    And a block saying the framework "provides a direct reformulation" passes

  @test:pipeline/language-trap-audit.test.ts::findingsFor_across_LLM_rhetorical_trap_criteria::detectsPivotMetaRestatementWarmthSuperlative
  Scenario: detects trap-rhetorical-pivot, trap-meta-commentary, trap-thesis-restatement, trap-performed-warmth, trap-superlative
    Given a block with "The real question is", "It is worth noting", "In summary", "We are excited to begin this journey with you, dear reader" and "crucial and unprecedented"
    When findingsFor checks it
    Then trap-rhetorical-pivot, trap-meta-commentary, trap-thesis-restatement, trap-performed-warmth and trap-superlative all fail

  @test:pipeline/language-trap-audit.test.ts::findingsFor_across_LLM_rhetorical_trap_criteria::detectsEmDashAndTriplesByDensity
  Scenario: detects trap-em-dash and trap-triples when density exceeds threshold
    Given a block with four em dashes in one sentence and three lists of three
    When findingsFor checks it
    Then trap-em-dash and trap-triples fail

  @test:pipeline/language-trap-audit.test.ts::findingsFor_across_LLM_rhetorical_trap_criteria::detectsClosingAphorismAndNonspeakable
  Scenario: detects trap-closing-aphorism and trap-nonspeakable
    Given a block with two sentences of more than 65 words, ending "Ultimately, a proof is only as strong as its assumptions."
    When findingsFor checks it
    Then trap-closing-aphorism and trap-nonspeakable fail

  @test:pipeline/language-trap-audit.test.ts::findingsFor_across_LLM_rhetorical_trap_criteria::buildMdRendersCriteriaTable
  Scenario: buildMd renders markdown summary with criteria table
    Then there are 10 criteria and the em-dash threshold is above 0
    When buildMd renders the findings for a "not a heuristic, but a deduction" block
    Then the report contains "# Language-trap audit" and "`trap-negation-contrast`"

  @test:pipeline/language-trap-audit.test.ts::language-trap-audit_--write-sidecars_attestation_survival::writeSidecarsKeepsBothAttestations
  Scenario: language-trap-audit --write-sidecars keeps both attestations when prior report is absent
    Given a git repository declaring one folio directory, with one prose block and no prior report
    And an agent pass attestation and a human fail attestation stored for that block
    When language-trap-audit runs on it with --write-sidecars --quiet
    Then it exits 0 or 1
    And the block's QA report holds both attestations
    And the attestation store still reads as a hit holding both
