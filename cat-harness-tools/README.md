# cat-harness-tools

What implements C@T Harness's Tool definitions — the MCP servers, their tool
registrars and routes. The definitions stay in `cat-harness/tools/`; this layer
runs them.

**Contents**

<!-- readme:toc:begin -->

- [Why a separate layer](#why-a-separate-layer)
- [Where it sits](#where-it-sits)
- [Status](#status)

<!-- readme:toc:end -->

## Why a separate layer

The same split `bootstrap` and `bootstrap-tools` use: a contract can be read,
audited and published without the code that runs it. The owner ruled on
2026-09-30 that cat-harness's tools follow it (bean `w2gr`).

## Where it sits

It needs `folio-assistant-core`, which inherits `cat-harness`. Core does not
depend on it — the document adapter's server half comes here, and its content
half stays in core.

## Status

Step 3a: the standalone MCP server (`adapters/mcp-server/`). Step 3b brings the
HTTP server, the tool and route modules, and the document adapter's server
wrapper.
