<!-- kg:subgraph:begin -->
# smart-trust-openapi

The OpenAPI documents this instance holds, ingested by the cat-openapi harness from the sources `cat-openapi.config.json` names (bean `s4ta`). Today one: the trust network gateway's API, which the IG's published `openapi/` carries as a vendored Swagger UI and which `ingest-ig-artifacts.ts` deliberately does not treat as the IG's own API. Each document is held VERBATIM beside a `<id>.source.json` recording the repository, path and commit it was read from; every operation in it gets a page and an IRI, generated into `docs/api/` by `cat-openapi/scripts/gen-openapi-pages.ts`, whose loader fetches the document from here — hence `served`.

Part of [smart-trust](../README.md) 0.1.0, declared as `smart-trust-openapi`, holding `openapi`.

| file | what it is | used by |
|---|---|---|
| [`gateway.openapi.json`](gateway.openapi.json) | data |  |
| [`gateway.source.json`](gateway.source.json) | Digital Documentation Covid Certificate Gateway |  |
<!-- kg:subgraph:end -->
