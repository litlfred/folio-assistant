<!-- kg:subgraph:begin -->
# large-datasets-processes

The `large-datasets` subgraph's BPMN -- `materialize-remote`, `refresh-materialized`, `copy-out-materialized` and `sample-import`, moved out of cat-harness/processes/ on 2026-09-30 (bean `cjvs`, issue #1605) because their steps name skills cat-harness cannot reach; `subscribe-kg` (epic fnx4, issue #1719) was drawn here for the same reason, since it calls `Process_MaterializeRemote`. Declared in large-datasets.json as that instance's own `processes` graph, and here as well, repository-scoped, for the reason `folio-assistant-core-processes` is: the consumers that scan for diagrams run from this root, and `workflowDirs` resolves only from a DECLARED directory (bean `g43o`).

Part of [C@T Harness](../../cat-harness/README.md) 0.1.0, declared as `large-datasets-processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`copy-out-materialized.bpmn`](copy-out-materialized.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Copy out materialized content — to work on somebody else's bytes |  |
| [`materialize-remote.bpmn`](materialize-remote.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Materialize remote content — the shared subprocess |  |
| [`refresh-materialized.bpmn`](refresh-materialized.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Refresh materialized remote content |  |
| [`sample-import.bpmn`](sample-import.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Sample import into a structured data store |  |
| [`subscribe-kg.bpmn`](subscribe-kg.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Subscribe to an external knowledge graph |  |
<!-- kg:subgraph:end -->
