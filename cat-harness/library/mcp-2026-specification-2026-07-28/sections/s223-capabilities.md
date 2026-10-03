---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s223-capabilities
section_title: "Capabilities"
file: "docs/specification/2026-07-28/client/sampling.mdx"
lines: 54-110
source_sha256: 32fe2bb69f5a7caa
granularity: heading
---
## Capabilities

Clients that support sampling **MUST** declare the `sampling` capability in
`_meta.io.modelcontextprotocol/clientCapabilities` on each request:

**Basic sampling:**

```json
{
  "_meta": {
    "io.modelcontextprotocol/clientCapabilities": {
      "sampling": {}
    }
  }
}
```

**With tool use support:**

```json
{
  "_meta": {
    "io.modelcontextprotocol/clientCapabilities": {
      "sampling": {
        "tools": {}
      }
    }
  }
}
```

**With context inclusion support (deprecated):**

```json
{
  "_meta": {
    "io.modelcontextprotocol/clientCapabilities": {
      "sampling": {
        "context": {}
      }
    }
  }
}
```

<Note>
  The `includeContext` parameter values `"thisServer"` and `"allServers"` are
  deprecated under the [feature lifecycle
  policy](/community/feature-lifecycle#deprecating-a-feature)
  ([SEP-2596](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2596));
  they will be removed no later than the Sampling feature itself. Servers
  **SHOULD** avoid using these values (e.g. can just omit `includeContext` since
  it defaults to `"none"`), and **SHOULD NOT** use them unless the client
  declares `sampling.context` capability. See the [deprecated features
  registry](/specification/2026-07-28/deprecated).
</Note>
