<!-- kg:subgraph:begin -->
# core-scripts

Core's own executable surface, with every test beside its subject: the review-comment Tool and its move helper, the glossary extractors, the sample-import pair, and — since bean `yj6r`, 2026-09-30 — the glossary CLUSTER: `build-glossary.ts`, its `:refterm` codemod `codemod-refterm.ts`, and all three of their tests. They moved up out of `cat-harness/content/pipeline/` because walking a paper's blocks to collect `defines[]` and emit a `folio-glossary/v1` scheme is CONTENT machinery, and the harness (`needs: ["bootstrap"]`) was importing upward into this instance's `schemas/glossary.ts` and `scripts/glossary-page.ts` — an import against its own declaration, and a circular dependency between repositories after the split. The partition rules already classified `content/pipeline/` as core, so the classification did not change; the DIRECTORY caught up with it. They are still addressed as pipeline scripts by id, and `resolvePipelineScript` searches the folio, then the platform, then here. This sentence listed only the review-comment pair until then, by which point four other tools were already here — a directory description that names its founding file rather than its contents goes stale the first time anything lands. Core declared its `schemas/`, its `folios/`, its `voices/` and its `tools/` and left `scripts/` undeclared, which is the `ylj7` shape: the directories that hold what is DESCRIBED were declared and the one holding what RUNS was not. Declared where it is: `review-comments.ts` is invoked by path from `folio-staging.yml`, so relocating it is an invocation surface `check:workflow-paths` would have to re-guard for nothing the declaration does not already buy.

Part of [folio-assistant-core](../README.md) 0.1.0, declared as `core-scripts`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`build-glossary-skos.test.ts`](build-glossary-skos.test.ts) | a file |  |
| [`build-glossary-usage.test.ts`](build-glossary-usage.test.ts) | a file |  |
| [`build-glossary.ts`](build-glossary.ts) | a file |  |
| [`codemod-refterm.test.ts`](codemod-refterm.test.ts) | a file |  |
| [`codemod-refterm.ts`](codemod-refterm.ts) | a file |  |
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
| [`sample-import-check.ts`](sample-import-check.ts) | a file |  |
| [`sample-import-run.test.ts`](sample-import-run.test.ts) | a file |  |
| [`sample-import-run.ts`](sample-import-run.ts) | a file |  |
<!-- kg:subgraph:end -->
