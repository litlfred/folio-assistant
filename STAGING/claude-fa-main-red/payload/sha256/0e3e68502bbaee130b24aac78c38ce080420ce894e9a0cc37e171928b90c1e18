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
in step 3a. `src/` — the HTTP server and the rest of what was
`cat-harness/src/`, moved in step 3b. `test/` — the tests of what is here. The
declaration names only what exists, because a declared-but-absent directory is
the `dh4f` defect.

The layout mirrors `cat-harness/` on purpose: as `src/` moves here, imports
between modules that move together stay the same.

## The libraries of the layers below the kind are held here

`libraries/` holds this layer's own `software-library` nodes, and
`libraries/held/<layer>/` holds the nodes of each layer below the kind
(owner, 2026-10-30, bootstrap-tools#44: "A. Holder records, keyed by layer").
bootstrap-tools needs only bootstrap, so it may not name cat-harness's
`software-library` kind or declare a `libraries/` of its own. This layer owns
the writer and the gate (`scripts/libraries.ts`), so it records them, keyed by
the layer each node describes (`layer`, `software-library/1.2.0`). It is the
same rule core uses for the glossary schemes of the layers below its typology
(bean `q3n9`).

The held set is derived, not listed: every instance with a `package.json` that
declares no `software-library` directory and does not reach cat-harness
through `needs`. The nodes are derived at this layer's pins, so a re-pin of
bootstrap-tools runs `bun run cat libraries:derive` in the same PR, and
`libraries:check` fails until it does. Never hand-edit a held node, and never
add a `libraries/` to bootstrap-tools.
