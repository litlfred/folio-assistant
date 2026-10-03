<!-- kg:subgraph:begin -->
# smart-immunizations-artifact-index

The reconstructed artefact index and the DAK API surface it points at. 40.6 MB of sidecars, materialised on the owner's explicit choice of 'everything' over the 11.3 MB schema+jsonld subset — 133x smart-trust's 332 KB, because this IG publishes 198 schemas and 188 display files against smart-trust's 19 and 14. `index.json` carries a `provenance` block naming the published file every field came out of, and `dakUnbound` records any sidecar an enumeration listed that bound to no artefact.

Part of [smart-immunizations](../README.md) 0.1.0, declared as `smart-immunizations-artifact-index`, holding `fhir-artifact-index`.

| file | what it is | used by |
|---|---|---|
| [`index.json`](index.json) | smart.who.int.immunizations — artefact index |  |
| [`dak/`](dak/) | 774 files | |
<!-- kg:subgraph:end -->
