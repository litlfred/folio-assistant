<!-- kg:subgraph:begin -->
# smart-trust-openapi

The OpenAPI documents this instance holds, ingested by the cat-openapi harness from the sources `cat-openapi.config.json` names (bean `s4ta`). Today one: the trust network gateway's API, which the IG's published `openapi/` carries as a vendored Swagger UI and which `ingest-ig-artifacts.ts` deliberately does not treat as the IG's own API. Each document is held VERBATIM beside a `<id>.source.json` recording the repository, path and commit it was read from; every operation in it is a node of this graph, with a page and an IRI here (`gateway/<operationId>/`, `gateway/<operationId>.jsonld`), written by `cat-openapi/scripts/gen-openapi-pages.ts`; the pages fetch the document beside them, and are complete HTML, so `served` publishes all of it verbatim.

Part of [smart-trust](../README.md) 0.1.0, declared as `smart-trust-openapi`, holding `openapi`.

| file | what it is | used by |
|---|---|---|
| [`gateway.json`](gateway.json) | data |  |
| [`gateway.jsonld`](gateway.jsonld) | data |  |
| [`gateway.openapi.json`](gateway.openapi.json) | data |  |
| [`gateway.source.json`](gateway.source.json) | Digital Documentation Covid Certificate Gateway |  |
| [`assets/`](assets/) | 1 file | |
| [`gateway/`](gateway/) | 67 files | |
<!-- kg:subgraph:end -->
