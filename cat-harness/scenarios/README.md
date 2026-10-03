<!-- kg:subgraph:begin -->
# scenarios

Scenarios — the [Roles](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role) an [Actor](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#actor) takes on, in `roles.json`, and the User Stories told as them, in `stories.json`. A [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role) IS a BPMN swimlane: it carries the [Skills](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#skill) its lane's activities need and the [Actor](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#actor) kinds that may play it; a lane names its [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role), and a story names the [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role) it is told as, so the [Role](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#role) lists neither (#1168). SPLIT OUT OF `skills/` on 2026-09-21 so that "give me the Scenarios" is a query on the kind rather than a match on a path.

Part of [C@T Harness](../README.md) 0.1.0, declared as `scenarios`, holding `scenarios`.

| file | what it is | used by |
|---|---|---|
| [`roles.json`](roles.json) | data |  |
| [`stories.json`](stories.json) | data |  |
| [`actors/`](actors/) | 36 files | |
| [`capabilities/`](capabilities/) | 28 files | |
<!-- kg:subgraph:end -->
