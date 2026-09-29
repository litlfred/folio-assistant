<!-- kg:subgraph:begin -->
# folio-assistant-core-library

The core layer's library -- `arxiv-2510.21603v1` (Doc-Researcher), and nothing else. Same staging arrangement and the same reason as `who-iris-library` and `folio-assistant-sci-library` above: the consumers that scan libraries -- `check:l1-complete`, the narrative queue, `gen-library-jsonld`, `ingest-document`'s own destination list -- run from THIS root, and a library they cannot see is a corpus they report a clean pass over (the `dh4f` defect). `ingest-document` is what proved it: with the directory declared ONLY in `folio-assistant-core.json` it refused the destination as matching none, because it reads the list from here. Declared in both, exactly as the four siblings are.

Part of [C@T Harness](../../cat-harness/README.md) 0.1.0, declared as `folio-assistant-core-library`, holding `library`.

| file | what it is | used by |
|---|---|---|
| [`image-verdicts.json`](image-verdicts.json) | data |  |
| [`arxiv-2510.21603v1/`](arxiv-2510.21603v1/) | 165 files | |
<!-- kg:subgraph:end -->
