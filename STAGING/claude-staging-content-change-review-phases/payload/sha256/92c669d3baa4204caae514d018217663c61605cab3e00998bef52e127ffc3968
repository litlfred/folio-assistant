# cat-harness-tools

What implements C@T Harness's Tool definitions — the MCP servers, their tool
registrars and routes. The definitions stay in `cat-harness/tools/`; this layer
runs them.

**Contents**

<!-- readme:toc:begin -->

- [Why a separate layer](#why-a-separate-layer)
- [Where it sits](#where-it-sits)
- [Status](#status)
- [Working on it from a plain clone](#working-on-it-from-a-plain-clone)

<!-- readme:toc:end -->

## Why a separate layer

The same split `bootstrap` and `bootstrap-tools` use: a contract can be read,
audited and published without the code that runs it. The owner ruled on
2026-09-30 that cat-harness's tools follow it (bean `w2gr`).

## Where it sits

It needs `cat-harness` and `bootstrap-tools`, and sits BELOW the content core,
which needs it (owner ruling C1, 2026-10-01). Nothing here may import the
content layers above; a server part that needs one moves up into it.

## Status

Step 3a: the standalone MCP server (`adapters/mcp-server/`). Step 3b brings the
HTTP server, the tool and route modules, and the document adapter's server
wrapper.

## Working on it from a plain clone

`@litlfred/cat-harness` and `@litlfred/bootstrap-tools` are not published to
any registry, so `bun install` in a lone clone fails with a 404 for both. They
are resolved as **workspaces** instead: `package.json` lists
`../cat-harnes[s]` and `../bootstrap-tool[s]`, which match a sibling checkout
when there is one and nothing when there is not. Clone the two layers this one
`needs` beside it:

```sh
mkdir work && cd work
git clone https://github.com/litlfred/cat-harness
git clone https://github.com/litlfred/bootstrap-tools
git clone https://github.com/litlfred/cat-harness-tools
cd cat-harness-tools
bun install
bun test scripts/tests/sdlc/stage-local-publisher.test.ts
```

`main` of `cat-harness` is the right sibling, since this repository's `main`
tracks it (see `.github/workflows/pr-tests.yml`). Inside a folio-assistant
index, or a folio with its layers mounted, the same globs match the mounted
directories and nothing needs cloning. Tests that read other instances (the
index's workflows, `bootstrap/`, content folios) still need that full mount.
