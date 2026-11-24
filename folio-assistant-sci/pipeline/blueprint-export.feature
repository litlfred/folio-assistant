Feature: the blueprint export writes formal \uses, removes the editorial ones, and takes \leanok from the rendered status

  @test:pipeline/blueprint-export.test.ts::blueprint_export::removesEditorialUses
  Scenario: every editorial \uses line is removed
    Given rendered TeX with a compiled definition, a drafted theorem Lagrange and its drafted proof, a compiled theorem Cauchy and its proof, and a remark, and an elaborated formal view
    When exportBlueprint exports it
    Then 2 editorial \uses lines are removed
    And no \uses names rem:motivation

  @test:pipeline/blueprint-export.test.ts::blueprint_export::leanFromRefOnStatementsOnly
  Scenario: \lean comes from the block's lean.ref, only on statements
    Then the export contains \lean{Foo.Group} and \lean{Foo.lagrange}
    And it writes 3 \lean commands

  @test:pipeline/blueprint-export.test.ts::blueprint_export::leanokStatementStatedProofCompiled
  Scenario: statement \leanok once stated (drafted or compiled); proof \leanok only when compiled
    Then Lagrange and its drafted proof carry one \leanok between them
    And Cauchy and its proof carry two

  @test:pipeline/blueprint-export.test.ts::blueprint_export::typeDepsInStatementValueInProof
  Scenario: type deps go in the statement, value deps in the proof that follows it
    Then Lagrange's statement has \uses{def:group}
    And its proof has \uses{thm:cauchy}

  @test:pipeline/blueprint-export.test.ts::blueprint_export::danglingTargetDroppedReported
  Scenario: a formal target with no \label here is dropped and reported, not emitted
    Then the export mentions neither def:not-rendered nor lem:cosets
    And those two are reported as dangling

  @test:pipeline/blueprint-export.test.ts::blueprint_export::formalSourceStamped
  Scenario: the formal source is stamped into the output
    Then the first line says source "elaborated"
    And --check finds no problems

  @test:pipeline/blueprint-export.test.ts::blueprint_export::noFormalCacheUnavailable
  Scenario: no formal cache: no \uses written, and --check says unavailable rather than passing
    When the export runs with no formal source and no dependencies
    Then no \uses is written
    And the first line says UNAVAILABLE
    And --check's first problem says "unavailable"

  @test:pipeline/blueprint-export.test.ts::blueprint_export::scanGraphFailsCheck
  Scenario: a scan graph is written but fails --check
    When the export runs with the formal source "scan"
    Then the first line says "NOT elaborated"
    And --check's first problem names "scan"

  @test:pipeline/blueprint-export.test.ts::blueprint_export::valueDepsWithoutProofReported
  Scenario: proof deps of a statement with no proof environment are reported
    When Cauchy's proof environment is removed and the export runs
    Then thm:cauchy is reported as having value deps without a proof

  @test:pipeline/blueprint-export.test.ts::blueprint_export::selfEdgeDropped
  Scenario: a self-edge is dropped: plasTeX's dependency graph recurses on it without end
    When Lagrange's type deps are itself and def:group
    Then the export has \uses{def:group}
    And no \uses names thm:lagrange
