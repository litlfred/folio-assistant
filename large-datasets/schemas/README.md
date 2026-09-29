<!-- kg:subgraph:begin -->
# large-datasets-schemas

The `large-datasets` subgraph's schema nodes -- `source-descriptor` (how to enumerate a corpus and ask it for a subset) and `artifact-store` (where an artifact too large for the site tree goes, as a declaration rather than a hardcoded host). Repository-scoped, so the path resolves against the REPO ROOT and carries no `../` -- a `../` prefix resolved OUTSIDE the checkout and every consumer silently dropped the entry (caught by CI, 2026-09-20).

Part of [C@T Harness](../../cat-harness/README.md), declared as `large-datasets-schemas`, holding `schemas`, `cat-harness`.

| file | what it is | used by |
|---|---|---|
| [`artifact-store.ts`](artifact-store.ts) | a file |  |
| [`id-lookup.test.ts`](id-lookup.test.ts) | a file |  |
| [`id-lookup.ts`](id-lookup.ts) | a file |  |
| [`source-descriptor.test.ts`](source-descriptor.test.ts) | a file |  |
| [`source-descriptor.ts`](source-descriptor.ts) | a file |  |
<!-- kg:subgraph:end -->
