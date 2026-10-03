<!-- kg:subgraph:begin -->
# processes

Executable BPMN processes and the DMN tables their gateways compute from. The diagrams are the source of truth, not illustrations of one: a lane binds a [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role), an activity names the [Skill](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#skill) to run through `<folio:skill ref>`, and `workflow_complete` refuses a step that is not enabled. WHERE A RUNNING INSTANCE GOT TO is not here — that is `beans/workflows/`, kind `workflow-state`, which is `state` rather than `content`. Two questions, two graphs. GROUPED BY CONCERN since placement PR3 (bean `63wl`): `processes.json` names the groups, each diagram sits in `processes/<group>/` and a DMN in `processes/<group>/decisions/` beside the diagrams that read it; the content-type diagrams moved up to the instances that own their skills (folio-assistant-core, folio-assistant-sci, fhir-harness), whose same-named `processes/<group>/` are members of these groups.

Part of [C@T Harness](../README.md) 0.1.0, declared as `processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`ns.jsonld`](ns.jsonld) | cat-harness's diagram elements |  |
| [`processes.json`](processes.json) | data |  |
| [`content/`](content/) | 4 files | |
| [`kg/`](kg/) | 7 files | |
| [`library/`](library/) | 14 files | |
| [`process/`](process/) | 12 files | |
| [`sdlc/`](sdlc/) | 25 files | |
| [`ui/`](ui/) | 4 files | |
<!-- kg:subgraph:end -->
