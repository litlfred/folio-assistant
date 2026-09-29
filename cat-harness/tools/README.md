<!-- kg:subgraph:begin -->
# tools

Tool definitions, one subdirectory per contributing instance (tools/<stub>/) so a composed instance adds its own without colliding on a filename. tools/index.ts merges them and is the only path a consumer imports. Authored as .ts calling defineTool so a malformed node fails at tsc; the JSON-LD and JSON Schema renderings are generated.

Part of [C@T Harness](../README.md) 0.1.0, declared as `tools`, holding `tools`.

| file | what it is | used by |
|---|---|---|
| [`discover.ts`](discover.ts) | a file |  |
| [`index.ts`](index.ts) | a file |  |
| [`mcp.ts`](mcp.ts) | a file |  |
| [`sessions.ts`](sessions.ts) | a file |  |
| [`viewers.ts`](viewers.ts) | a file |  |
| [`templates/`](templates/) | 2 files | |
<!-- kg:subgraph:end -->
