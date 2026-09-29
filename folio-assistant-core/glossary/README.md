<!-- kg:subgraph:begin -->
# glossary

Core's glossary (owner, 2026-09-23: "put glossary into folio-assistant-core", "part of general pracice w/ glossary/ page"): folio-glossary/v1 documents, each a SKOS concept scheme of local terms linked to external SKOS concepts by exactMatch/closeMatch, plus external concepts listed as members without being copied. A whole external scheme is referenced through remoteGraphs with graphKinds ["glossary"]. `dependents: reproduce` so every folio built on core gets its own glossary/, which is what makes a glossary general practice rather than a harness feature. Rendered on the glossary/ page with the swimlane ledger (cat-harness's `swimlane-glossary`) as one more source; checked by `check:glossary`.

Part of [folio-assistant-core](../README.md), declared as `glossary`, holding `glossary`.

| file | what it is | used by |
|---|---|---|
| [`cat-harness.glossary.json`](cat-harness.glossary.json) | Folio Assistant platform terms (cat-harness) |  |
| [`folio-assistant-core.glossary.json`](folio-assistant-core.glossary.json) | Folio Assistant platform terms |  |
| [`generated/`](generated/) | 18 files | |
<!-- kg:subgraph:end -->
