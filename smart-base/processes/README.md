<!-- kg:subgraph:begin -->
# smart-base-house-processes

The BPMN this layer OWNS as a house process, as against `methodologies/processes/`, which holds the executable half of a methodology adopted whole from the corpus. `l2-dak-authoring.bpmn` is the first: moved here from cat-harness/processes/ on 2026-10-01 by owner ruling (issue #1772 item 3), because placement PR1 had moved its `l2-dak-authoring` skill into `skills/content/authoring-who-smart-guidelines/` and the three activities naming it no longer resolved from cat-harness, which cannot reach this layer. Here the skill sits beside the diagram; the remaining refs (`content-plan`, `todo-manager`, `bpmn-authoring`, `dmn-authoring`, `content-review`, `content-validate`, `terminology-management`) point down, through `fhir-harness`. A TOP-LEVEL directory rather than a second file in `methodologies/processes/`, for the reason `folio-assistant-core-processes` gives: that nested shape is a baselined `check:layout-norms` exception, and a house process is not a methodology read out of `library/`. Declared WITH its file in one commit, per bean `dh4f`.

Part of [SMART Base](../README.md) 0.1.0, declared as `smart-base-house-processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`l2-dak-authoring.bpmn`](l2-dak-authoring.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): L2 DAK authoring |  |
<!-- kg:subgraph:end -->
