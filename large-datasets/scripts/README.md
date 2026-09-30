<!-- kg:subgraph:begin -->
# large-datasets-scripts

`gen-id-lookup.ts` builds the prefix-sharded identifier lookup over a catalogue's REFERENCED nodes (`bun run id-lookup`, gated by `id-lookup:check`), and `bench-id-lookup.ts` measures it at full WHO IRIS scale on a seeded synthetic corpus, in Chromium. Bean `4pm8`: the Pagefind decision waits on this measurement.

Part of [large-datasets](../README.md) 0.1.0, declared as `large-datasets-scripts`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`bench-id-lookup.ts`](bench-id-lookup.ts) | a file |  |
| [`gen-id-lookup.ts`](gen-id-lookup.ts) | a file |  |
<!-- kg:subgraph:end -->
