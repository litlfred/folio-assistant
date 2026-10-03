<!-- kg:subgraph:begin -->
# sci-sources

Source descriptors (`folio-source-descriptor/v1`): how to ENUMERATE Lean mathlib and ask it for a SUBSET, so an agent asked for part of it is not told the API by a human every time. Moved here from large-datasets' `sources/` on 2026-10-01 (owner ruling: large-datasets dissolves into cat-harness; bean `j7ql`), because a descriptor is ABOUT one corpus and the instance that holds or catalogues that corpus owns it — the schema stays in cat-harness. Its far-apart sibling, WHO IRIS, is in who-iris: a mathlib declaration needs its import closure (`subsetIsSelfContained: false`), one identifier system, a local module graph.

Part of [folio-assistant-sci](../README.md) 0.1.0, declared as `sci-sources`, holding `schemas`.

| file | what it is | used by |
|---|---|---|
| [`lean-mathlib.json`](lean-mathlib.json) | Lean 4 mathlib |  |
<!-- kg:subgraph:end -->
