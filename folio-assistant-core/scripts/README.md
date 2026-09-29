<!-- kg:subgraph:begin -->
# core-scripts

The review-comment Tool and its move helper, with their tests beside them. Core declared its `schemas/`, its `folios/`, its `voices/` and its `tools/` and left `scripts/` undeclared, which is the `ylj7` shape: the directories that hold what is DESCRIBED were declared and the one holding what RUNS was not. Declared where it is: `review-comments.ts` is invoked by path from `folio-staging.yml`, so relocating it is an invocation surface `check:workflow-paths` would have to re-guard for nothing the declaration does not already buy.

Part of [folio-assistant-core](../README.md) 0.1.0, declared as `core-scripts`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`glossary-extract.ts`](glossary-extract.ts) | a file |  |
| [`glossary-page.ts`](glossary-page.ts) | a file |  |
| [`glossary-pot.test.ts`](glossary-pot.test.ts) | a file |  |
| [`glossary-pot.ts`](glossary-pot.ts) | a file |  |
| [`review-comment-move.test.ts`](review-comment-move.test.ts) | a file |  |
| [`review-comment-move.ts`](review-comment-move.ts) | a file |  |
| [`review-comments.test.ts`](review-comments.test.ts) | a file |  |
| [`review-comments.ts`](review-comments.ts) | a file |  |
| [`review-coverage.test.ts`](review-coverage.test.ts) | a file |  |
| [`review-coverage.ts`](review-coverage.ts) | a file |  |
<!-- kg:subgraph:end -->
