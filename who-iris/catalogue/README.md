<!-- kg:subgraph:begin -->
# who-iris-catalogue

The catalogue itself: `catalogue.json` declares the corpus and its measured size; `nodes/` holds one `folio-catalogue-node/v1` per community, collection or item; `records/` holds the `folio-dublin-core/v1` metadata an item node points at through `metadataRef`. TWELVE nodes today — 9 referenced, 3 materialized, 0 unknown — against 1,057,223 files upstream, and that gap IS the point. `bun run check:catalogue` verifies every node validates and every metadataRef, libraryId and parent path resolves; a Zod schema can require the reference and structurally cannot check the file is there.

Part of [WHO IRIS](../README.md), declared as `who-iris-catalogue`, holding `catalogue`.

| file | what it is | used by |
|---|---|---|
| [`catalogue.json`](catalogue.json) | WHO IRIS — Institutional Repository for Information Sharing |  |
| [`nodes/`](nodes/) | 13 files | |
| [`records/`](records/) | 3 files | |
<!-- kg:subgraph:end -->
