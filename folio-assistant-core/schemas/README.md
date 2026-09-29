<!-- kg:subgraph:begin -->
# folio-assist-core-schemas

The CONTENT layer's schema nodes, staged as a top-level directory ahead of the split (#223). Owner, 2026-09-20: 'not in cat-harness, in folio-assitant-core/ as a named subgraph.' A NAMED SUBGRAPH and not a second `schemas` entry: overrides match on the entry's id, so reusing `schemas` would REPLACE this instance's schema graph rather than add to it -- the same trap the `cat-harness-src` entry above documents from the other side. REPOSITORY-scoped, like `bootstrap/skills/`: it sits at the top of the checkout, not inside this instance, and is deliberately never overlaid by a dependency. This entry is the mirror of `folio-assistant-core/harness.json`'s own, and it has to be stated twice only because `resolveSkillDirs` has no caller -- when that is wired, THIS entry is the one to delete.

Part of [C@T Harness](../../cat-harness/README.md), declared as `folio-assist-core-schemas`, holding `schemas`, `cat-harness`.

| file | what it is | used by |
|---|---|---|
| [`adjudication.test.ts`](adjudication.test.ts) | a file |  |
| [`adjudication.ts`](adjudication.ts) | a file |  |
| [`catalogue.ts`](catalogue.ts) | a file |  |
| [`changeset.test.ts`](changeset.test.ts) | a file |  |
| [`changeset.ts`](changeset.ts) | a file |  |
| [`dublin-core.test.ts`](dublin-core.test.ts) | a file |  |
| [`dublin-core.ts`](dublin-core.ts) | a file |  |
| [`extraction.ts`](extraction.ts) | a file |  |
| [`fhir-artifact-index.ts`](fhir-artifact-index.ts) | a file |  |
| [`glossary.test.ts`](glossary.test.ts) | a file |  |
| [`glossary.ts`](glossary.ts) | a file |  |
| [`library-ref.test.ts`](library-ref.test.ts) | a file |  |
| [`library-ref.ts`](library-ref.ts) | a file |  |
| [`masked-region.test.ts`](masked-region.test.ts) | a file |  |
| [`materialization-compiled.test.ts`](materialization-compiled.test.ts) | a file |  |
| [`materialization.ts`](materialization.ts) | a file |  |
| [`remote-content.test.ts`](remote-content.test.ts) | a file |  |
| [`review-comment.test.ts`](review-comment.test.ts) | a file |  |
| [`review-comment.ts`](review-comment.ts) | a file |  |
| [`review-verdict.test.ts`](review-verdict.test.ts) | a file |  |
| [`review-verdict.ts`](review-verdict.ts) | a file |  |
<!-- kg:subgraph:end -->
