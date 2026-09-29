<!-- kg:subgraph:begin -->
# fhir-ig-skills

The `fhir-harness` instance's instruction bodies -- the FHIR IG layer's two packages, `fhir-ig-base` (build pipeline, publisher fork and reduction, Jekyll render) and `fhir-client` (client operations, SMART launch). Declared here for the reason `bootstrap-skills` above gives, and the id is deliberately the SAME one `fhir-harness/fhir-harness.json` uses for the same directory: where a sibling instance's id does not collide with one of this instance's own, reusing it keeps one name on one directory. Measured 2026-09-27 (bean `3x2o`): `fhir-client-operations.md` and `smart-launch.md` were committed under `docs/reference/skill-instructions/` and produced by NO source, so they were orphans no re-run could refresh -- 280 committed against 278 produced -- while the four `fhir-ig-base` bodies had never been published at all.

Part of [C@T Harness](../../cat-harness/README.md), declared as `fhir-ig-skills`, holding `skills`.

| file | what it is | used by |
|---|---|---|
| [`fhir-client/`](fhir-client/) | 3 files | |
| [`fhir-ig-base/`](fhir-ig-base/) | 5 files | |
<!-- kg:subgraph:end -->
