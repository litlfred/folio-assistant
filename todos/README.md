<!-- kg:subgraph:begin -->
# todos

A PERSON's outstanding items — the human half of memory, as against `beans/`, which is the agent's workflow management. Not a second work plan: the two sit in different quadrants of one 2x2 (memory vs workflow management, human vs agent), and human workflow management is EMPTY, deliberately. `todos/todos.json` declares its nodes — `items` (raised about anything) and `feedback` (raised against a specific block, carrying the submitter's identity) — the same shape as `beans/beans.json`. REPOSITORY-scoped: it sits at the top of the checkout, not inside this instance, and it is deliberately never overlaid by a dependency.

Part of [C@T Harness](../cat-harness/README.md), declared as `todos`, holding `todos`.

| file | what it is | used by |
|---|---|---|
| [`todos.json`](todos.json) | data |  |
| [`boards/`](boards/) | 5 files | |
| [`items/`](items/) | 3 files | |
<!-- kg:subgraph:end -->
