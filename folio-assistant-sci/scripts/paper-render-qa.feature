Feature: paper-render-qa — what a reader of the rendered paper would trip on, on the rendering QA axis

  @test:scripts/paper-render-qa.test.ts::paper_render_QA,_on_the_rendering_axis::leanNamespacesComeFromTheFolio
  Scenario: the Lean namespaces are the folio's own
    Given the folio's Lean library "MyPaper"
    Then "MyPaper.Foo.bar" reads as Lean and another folio's namespace does not

  @test:scripts/paper-render-qa.test.ts::paper_render_QA,_on_the_rendering_axis::findsEachCheckAndCountsIt
  Scenario: each check is found and counted in the shared vocabulary
    Given a chapter with Lean names in prose, a broken hyphen, a long definition and a placeholder link, and a log reporting a label twice
    Then each is reported, the placeholder link fails, and the counts are one fail and four warn

  @test:scripts/paper-render-qa.test.ts::paper_render_QA,_on_the_rendering_axis::aCleanBuildPassesAndNoLogIsNotApplicable
  Scenario: a clean build passes, and a check with no input is not applicable
    Given a clean chapter and no LaTeX log
    Then four checks pass and multiply-defined is n/a

  @test:scripts/paper-render-qa.test.ts::paper_render_QA,_on_the_rendering_axis::noRenderedPaperIsNotApplicableNotClean
  Scenario: no rendered paper is not applicable, not clean
    Given an output directory with no chapters
    Then every check is n/a and the record says why
