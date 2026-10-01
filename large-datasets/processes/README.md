<!-- kg:subgraph:begin -->
# large-datasets-processes

The BPMN this layer owns: `materialize-remote` (the shared subprocess -- purpose, then the five gates), `refresh-materialized` (a held copy against its moved upstream), `copy-out-materialized` (to work on somebody else's bytes) and `sample-import` (testing an import against a real sample). Moved here from cat-harness/processes/ on 2026-09-30 by owner ruling (bean `cjvs`, issue #1605): the 25 `<bootstrap.processes:skill ref>` activities naming `materialize-remote` or `copy-out-materialized` named skills that live only in large-datasets/skills/, while cat-harness needs only bootstrap -- so every one ran against the dependency arrow. Here they run with it; the remaining refs (`sample-import`, `adjudication`, and the call to `Process_Adjudication`) point down into cat-harness, which this layer reaches through folio-assistant-core.

Part of [large-datasets](../README.md) 0.1.0, declared as `large-datasets-processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`copy-out-materialized.bpmn`](copy-out-materialized.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Copy out materialized content — to work on somebody else's bytes |  |
| [`materialize-remote.bpmn`](materialize-remote.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Materialize remote content — the shared subprocess | "Sample import into a structured data store" |
| [`refresh-materialized.bpmn`](refresh-materialized.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Refresh materialized remote content | "Sample import into a structured data store" |
| [`sample-import.bpmn`](sample-import.bpmn) | a [Process](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#process): Sample import into a structured data store |  |
<!-- kg:subgraph:end -->
