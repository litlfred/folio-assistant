---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s169-extension-negotiation
section_title: "Extension Negotiation"
file: "docs/specification/2026-07-28/basic/versioning.mdx"
lines: 80-125
source_sha256: bc02f271700bdecd
granularity: heading
---
## Extension Negotiation

Clients and servers can negotiate support for optional
[extensions](/docs/extensions/overview) beyond the core protocol. Extensions
are advertised in the `extensions` field of capabilities, which is a map of
extension identifiers to per-extension settings objects. Extension identifiers
**MUST** follow the [`_meta` key naming rules](/specification/2026-07-28/basic/index#meta),
with a mandatory prefix.

The following is an example of a client that advertises the
[MCP Apps extension](/extensions/apps/overview) identified as `io.modelcontextprotocol/ui`:

```json
{
  "capabilities": {
    "roots": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {
        "mimeTypes": ["text/html;profile=mcp-app"]
      }
    }
  }
}
```

An example of [Tasks extension](/extensions/tasks/overview) identified as `io.modelcontextprotocol/tasks`:

```json
{
  "capabilities": {
    "tools": {},
    "extensions": {
      "io.modelcontextprotocol/tasks": {}
    }
  }
}
```

Each extension specifies the schema of its settings object; an empty object
indicates support with no additional settings.

If one party supports an extension but the other does not, the supporting
party **MUST** either revert to core protocol behavior or reject the request
with an appropriate error. Extensions **SHOULD** document their expected
fallback behavior.
