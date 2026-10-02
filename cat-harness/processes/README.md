<!-- kg:subgraph:begin -->
# processes

Executable BPMN processes and the DMN tables their gateways compute from. The diagrams are the source of truth, not illustrations of one: a lane binds a [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role), an activity names the [Skill](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#skill) to run through `<folio:skill ref>`, and `workflow_complete` refuses a step that is not enabled. WHERE A RUNNING INSTANCE GOT TO is not here — that is `beans/workflows/`, kind `workflow-state`, which is `state` rather than `content`. Two questions, two graphs.

Part of [C@T Harness](../README.md) 0.1.0, declared as `processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`ns.jsonld`](ns.jsonld) | cat-harness's diagram elements |  |
| [`processes.json`](processes.json) | data |  |
| [`content/`](content/) | 4 files | |
| [`kg/`](kg/) | 7 files | |
| [`library/`](library/) | 14 files | |
| [`process/`](process/) | 12 files | |
| [`sdlc/`](sdlc/) | 22 files | |
| [`ui/`](ui/) | 4 files | |
<!-- kg:subgraph:end -->
