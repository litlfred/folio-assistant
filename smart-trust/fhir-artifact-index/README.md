<!-- kg:subgraph:begin -->
# smart-trust-artifact-index

The reconstructed artefact index, and the DAK API surface it points at. ONE directory rather than two on purpose: `dak/` sits INSIDE the declared graph because a sibling would be an undeclared directory holding the very bytes the index claims to have — the `dh4f` shape, where a consumer scans nothing and reports a clean run over it. `index.json` carries a `provenance` block naming the published file every field came out of, because no IG publishes an artefact index and each row was therefore assembled rather than transcribed.

Part of [smart-trust](../README.md) 0.1.0, declared as `smart-trust-artifact-index`, holding `fhir-artifact-index`.

| file | what it is | used by |
|---|---|---|
| [`index.json`](index.json) | smart.who.int.trust — artefact index |  |
| [`menu.json`](menu.json) | data |  |
| [`dak/`](dak/) | 69 files | |
<!-- kg:subgraph:end -->
