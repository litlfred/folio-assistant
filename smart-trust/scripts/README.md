<!-- kg:subgraph:begin -->
# smart-trust-scripts

The tests that pin smart-trust's GENERATED pages -- markdown rather than HTML wearing front matter, and every link resolving to a file. The generator itself moved to `fhir-harness/scripts/gen-ig-pages.ts` (#1767), because nothing in it was smart-trust's: it reads `fhir-artifact-index/`, which every ingested IG holds in the same shape, and smart-base now uses it too. `smart-trust:pages` still names this instance's label and chrome owner. The tests stay here because what they assert is a fact about THESE pages.

Part of [smart-trust](../README.md) 0.1.0, declared as `smart-trust-scripts`, holding `code`.

| file | what it is | used by |
|---|---|---|
| [`tests/`](tests/) | 1 file | |
<!-- kg:subgraph:end -->
