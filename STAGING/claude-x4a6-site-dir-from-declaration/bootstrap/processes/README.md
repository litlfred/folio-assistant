<!-- kg:subgraph:begin -->
# processes

bootstrap's [Processes](../schemas/README.md#process): `initialize-harness.bpmn`, the only one an [Actor](../schemas/README.md#actor) starts; `discussion.bpmn`, which it calls to ask the Requestor; and `log-message.bpmn`, which any step may call to record what it is doing. `ns.jsonld` defines the elements these diagrams add to BPMN (skill, role, precondition), written with the prefix `bootstrap.processes:`.

Part of [Bootstrap](../README.md) 0.1.0, declared as `processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`discussion.bpmn`](discussion.bpmn) | a [Process](../schemas/README.md#process): Determine the harness and repositories |  |
| [`discussion.svg`](discussion.svg) | the picture of `discussion.bpmn`, generated from it |  |
| [`initialize-harness.bpmn`](initialize-harness.bpmn) | a [Process](../schemas/README.md#process): Initialize a harness |  |
| [`initialize-harness.svg`](initialize-harness.svg) | the picture of `initialize-harness.bpmn`, generated from it |  |
| [`log-message.bpmn`](log-message.bpmn) | a [Process](../schemas/README.md#process): Log a message | "Initialize a harness" |
| [`log-message.svg`](log-message.svg) | the picture of `log-message.bpmn`, generated from it |  |
| [`ns.jsonld`](ns.jsonld) | data |  |
<!-- kg:subgraph:end -->
