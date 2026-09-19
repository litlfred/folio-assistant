<!-- Generated from skills/memory/the-commands-that-do-exist-here.md by `bun run agent-memory`. -->
<!-- Not injected into MEMORY.md; read on demand. Edits here are lost. -->

```sh
bun install
bun run src/index.ts --http      # the assistant (HTTP); --stdio for stdio MCP
bun test                         # unit tests
bunx playwright test             # e2e  (npm script: test:e2e)
eslint .
bun run src/index.ts --check-deps   # probe environment capabilities
bun run init-folio --help           # scaffold a new folio
bun run readme:sync[:check] | readme:sections
bun run check:ci-health | check:corpus-gate | check:workflow-policy
bun run typecheck | lint | gen:jsonld[:check] | render:bpmn[:check]
```
