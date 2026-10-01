<!-- kg:subgraph:begin -->
# smart-base-artifact-index

The published IG's artefact index, reconstructed by `ingest:ig` from smart.who.int.base v0.3.0 (FHIR 4.0.1). 225 artefacts known, 47 materialized -- the DAK API surface, whose JSON Schemas and OpenAPI have no other home, against resource JSON that does. `dak/` sits INSIDE this directory rather than beside it, so one entry covers both the index and the bytes it points at; a sibling would be an undeclared directory holding the very bytes the index claims to have, which is the `dh4f` shape. NOTHING HERE IS AUTHORED: `ingest:ig:check` re-derives it and a hand-edit is a defect the next check either overwrites or reports. The four CDHI/CDSC ConceptMaps -- the v1-to-v2 crosswalks and the two hierarchy maps -- are indexed `referenced`: the index says where they are and holds none of their rows. Materializing one is `materialize-remote.bpmn`, not a flag. Issue #877, bean `cpmo`. AS OF BEAN `ajx9` IT ALSO HOLDS `chrome.json`, and that is a THIRD provenance in one directory rather than a second copy of an existing one: `index.json` is harvested from an IG's published output, `menu.json` (smart-trust's) is read from its `sushi-config.yaml`, and `chrome.json` is resolved from the `fhir.template` packages its `ig.ini` names -- `fhir.base.template` and `who.template.root`, separate repositories the IG merely depends on. An IG declares its appearance in NO file it owns, which is why the chrome could not be folded into either of the other two. It lives at smart-base so `smart-l1`, `smart-dak` and `smart-ig` inherit one answer instead of each re-copying it; `schemas/ig-chrome.ts` carries why the consumer NAMES this instance rather than walking `needs` to it, and the layering gap that forces it, which is `nsbb`'s.

Part of [SMART Base](../README.md) 0.1.0, declared as `smart-base-artifact-index`, holding `fhir-artifact-index`.

| file | what it is | used by |
|---|---|---|
| [`chrome.json`](chrome.json) | data |  |
| [`index.json`](index.json) | smart.who.int.base — artefact index |  |
| [`dak/`](dak/) | 138 files | |
<!-- kg:subgraph:end -->
