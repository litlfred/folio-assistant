---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s424-response
section_title: "Response"
file: "docs/specification/2026-07-28/server/discover.mdx"
lines: 33-61
source_sha256: 3fe1f5b5f1528014
granularity: heading
---
## Response

The server replies with its supported protocol versions, capabilities, and
identity. This operation supports [caching](/specification/2026-07-28/server/utilities/caching).

```json
{
  "jsonrpc": "2.0",
  "id": "discover-1",
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {}
    },
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "ExampleServer",
        "version": "1.0.0"
      }
    },
    "instructions": "This server provides weather and resource utilities.",
    "ttlMs": 3600000,
    "cacheScope": "public"
  }
}
```
