<!-- kg:subgraph:begin -->
# uploads

The incoming queue of the document-ingestion pipeline — raw files as dropped, before ingestion. NOT L1 and NOT greppable as corpus: the corpus checklist searches library/ only, so a source still sitting here reads as absent to every consumer while the file is on disk. That is why it is a separate declaration from library/ rather than the same directory under two names.

Part of [C@T Harness](../README.md) 0.1.0, declared as `uploads`, holding `uploads`.

| file | what it is | used by |
|---|---|---|
| [`adr-madr-2026-09-22.zip`](adr-madr-2026-09-22.zip) | a file |  |
<!-- kg:subgraph:end -->
