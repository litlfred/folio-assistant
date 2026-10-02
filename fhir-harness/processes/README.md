<!-- kg:subgraph:begin -->
# fhir-harness-processes

The BPMN this layer OWNS, grouped by concern as the harness groups its own (`processes/<group>/`): `content/l3-fhir-pipeline.bpmn` and `content/ig-incremental-build.bpmn`, the FHIR IG pipeline and its incremental build. Moved up from cat-harness/processes/ by placement PR3 (bean `63wl`, owner rulings 2026-09-30), beside the IG skills they bind. `l3-fhir-pipeline.bpmn` still carries a documentary `bpmn:import` of smart-base's `l2-dak-authoring.bpmn` -- an upward reference one layer up, recorded rather than hidden (proposal §5, "residuals one layer up"). Declared WITH its files in one commit, per bean `dh4f`.

Part of [FHIR IG Harness](../README.md) 0.1.0, declared as `fhir-harness-processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`content/`](content/) | 2 files | |
<!-- kg:subgraph:end -->
