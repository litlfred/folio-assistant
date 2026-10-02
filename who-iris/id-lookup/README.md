<!-- kg:subgraph:begin -->
# id-lookup

The GENERATED prefix-sharded identifier lookup over this catalogue's REFERENCED nodes: `manifest.json` plus JSON shards keyed by id prefix, each under 64 KiB. Written by `cat-harness-tools/scripts/gen-id-lookup.ts` (`bun run id-lookup`, gated by `id-lookup:check`), which finds this directory by its id `id-lookup` and never by this instance's name; read by `cat-harness-tools/id-lookup/lookup.js`. Here rather than beside the generator because an instance hosts its own generated outputs (D3, bean `j7ql`, 2026-10-01). Edit the catalogue, never the shards: the generator replaces this directory whole.

Part of [WHO IRIS](../README.md) 0.1.0, declared as `id-lookup`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`manifest.json`](manifest.json) | data |  |
| [`collection/`](collection/) | 1 file | |
| [`community/`](community/) | 1 file | |
<!-- kg:subgraph:end -->
