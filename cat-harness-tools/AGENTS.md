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
bootstrap → bootstrap-tools → cat-harness → cat-harness-tools → (the content layers)
```

This layer may import `cat-harness` and `bootstrap-tools`, and **nothing above
it** — the owner's ruling C1 of 2026-10-01 (epic `7x5n`, bean `rmi6`) put the
tools BELOW the content core. The content core may import this layer; this
layer does not name it, since a lower layer naming a higher one is itself the
wrong direction (`check:reference-direction`). The order is declared, not
written here: it is the `needs` of each `<instance>.json`, and
`check:import-direction` enforces it from them.

It was the other way round for a few hours: this layer needed the content
core, and the core was forbidden to import it, which is why core's document adapter was cut into a
server-free `DocumentContent` and a server wrapper. Under C1 the rule reads
*core must not depend on the MCP server*; any part of the server that needs
the core moves up into the core rather than coming here, and a content
package's own server half lives with that package.

## What is here

`adapters/mcp-server/` — the standalone MCP server and its Dockerfile, moved
in step 3a. `test/` — the tests of what is here. The HTTP server and the rest of
`cat-harness/src/` arrive in step 3b; until then this declaration names only
what exists, because a declared-but-absent directory is the `dh4f` defect.

The layout mirrors `cat-harness/` on purpose: as `src/` moves here, imports
between modules that move together stay the same.
