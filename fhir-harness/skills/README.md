<!-- kg:subgraph:begin -->
# fhir-ig-skills

Two packages. `fhir-client` is SMART on FHIR app launch (`smart-launch`) and FHIR resource operations (`fhir-client-operations`) through the SMARTerFHIR library, authored here against a pinned upstream commit because that repository ships no skill files (issue #556, bean `wlqd`). `fhir-ig-base` is the IG pipeline. `ig-build-pipeline` states what the layer runs and the list of things it refuses to know about, including the deploy phase's assignment. `ig-render-jekyll` states the three render contracts -- JSON only, navigation derived from `sushi-config.yaml`'s own ordered `pages:` and `menu:` maps rather than authored, and the LHS rail with the IG theme captured rather than discarded. `ig-publisher-reduction` is the five-phase transition to an AST-only Publisher, each phase carrying an exit criterion that is a measurement or a diff rather than an impression. `ig-publisher-fork` is the brief for an agent taking a local experimental fork, and says why a publisher-only fork cannot satisfy its central criterion: the Library/PlanDefinition/Measure edges are produced in `org.hl7.fhir.core`, not in the publisher.

Part of [FHIR IG Harness](../README.md) 0.1.0, declared as `fhir-ig-skills`, holding `skills`.

| file | what it is | used by |
|---|---|---|
| [`content/`](content/) | 5 files | |
| [`fhir-client/`](fhir-client/) | 3 files | |
| [`fhir-ig-base/`](fhir-ig-base/) | 5 files | |
| [`remote-packages/`](remote-packages/) | 1 file | |
| [`skill-definitions/`](skill-definitions/) | 4 files | |
<!-- kg:subgraph:end -->
