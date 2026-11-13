Feature: the blueprint layout — a paper's blueprint/src/ in the layout leanblueprint builds

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::layoutHasLeanblueprintFiles
  Scenario: is the layout leanblueprint builds: web, print, content, macros, plastex.cfg
    Given the blueprint layout built from a chapter with a compiled definition and a stubbed lemma, a paper's title, authors and two macros, and an elaborated formal view
    Then its files are content.tex, extra_styles.css, latexmkrc, macros/common.tex, macros/print.tex, macros/web.tex, plastex.cfg, print.tex and web.tex
    And plastex.cfg names the plugins plastexdepgraph, plastexshowmore and leanblueprint
    And web.tex uses the blueprint package with showmore and dep_graph

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::contentHasLeanAndFormalUses
  Scenario: content is the export: generated \lean and formal \uses, editorial \uses gone
    Then content.tex contains \lean{Foo.Group} and \uses{def:group}
    And it does not mention the editorial use rem:why
    And the export removed 1 editorial use

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::marginAnnotationsReadThenStripped
  Scenario: the platform's margin annotations are read by the export, then stripped
    Then content.tex has no \blockannot, \sectionannot or \chapterannot
    And the export marked 1 block \leanok

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::everyEnvDeclaredTheoremFirst
  Scenario: every environment the renderer emits is declared, theorem first
    Then the first theorem declaration is \newtheorem{theorem}{Theorem}
    And macros/common.tex declares a \newtheorem for every environment the renderer emits except proof
    And \theoremstyle{definition} comes before \newtheorem{definition}

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::paperMacrosWithArity
  Scenario: the paper's macros, with their argument counts
    Then the arity of "\langle #1, #2 \rangle" is 2
    And macros/common.tex defines \LM with no argument and \pair with 2

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::titleAuthorsEscapedAndInPdfOnly
  Scenario: title and authors are escaped one by one; \and only in the PDF
    Then print.tex has the title "Rings \& Things\_2" and the authors joined by \and
    And web.tex has the authors joined by a comma

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::pdfGetsNoOpTwins
  Scenario: the PDF gets no-op twins of the web-only commands
    Then macros/print.tex mentions \lean, \leanok, \uses and \proves

  @test:pipeline/blueprint-layout.test.ts::the_blueprint_layout::everyFileSaysGenerated
  Scenario: every file says it is generated
    Then every file of the layout contains "GENERATED"
