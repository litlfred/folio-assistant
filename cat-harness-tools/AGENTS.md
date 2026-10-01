# AGENTS.md — cat-harness-tools

What **implements** the harness's Tool definitions: the MCP servers, their tool
registrars, and the routes that serve them. The definitions themselves — the
`tools` graph and its reader — stay in `cat-harness/tools/`.

## The one rule

**Definitions there, implementations here.** It is the split `bootstrap` and
`bootstrap-tools` already use, and the owner chose it for this layer on
2026-09-30 (bean `w2gr`, option A). A new tool's contract goes in the harness;
the code that runs it comes here.

## Which way the dependencies run

```
cat-harness → folio-assistant-core → cat-harness-tools
```

This layer may import the harness and core. **Core may not import this layer**
— the owner's ruling of 2026-10-01 — which is why core's document adapter was
cut into a server-free `DocumentContent` (it stays in core) and a server wrapper
(it comes here). sci's server half lives in a named subgraph of
`folio-assistant-sci`, not here.

## What is here

`adapters/mcp-server/` — the standalone MCP server and its Dockerfile, moved
in step 3a. `test/` — the tests of what is here. The HTTP server and the rest of
`cat-harness/src/` arrive in step 3b; until then this declaration names only
what exists, because a declared-but-absent directory is the `dh4f` defect.

The layout mirrors `cat-harness/` on purpose: as `src/` moves here, imports
between modules that move together stay the same.
