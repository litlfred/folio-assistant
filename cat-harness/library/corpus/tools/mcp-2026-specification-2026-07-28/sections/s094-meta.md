---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s094-meta
section_title: "`_meta`"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 322-447
source_sha256: 03586b10e3214c55
granularity: heading
---
### `_meta`

The `_meta` property/parameter is used by MCP to allow clients and servers
to attach additional metadata to their interactions.

Certain key names are reserved by MCP for protocol-level metadata, as specified below;
implementations **MUST NOT** make assumptions about values at these keys.

**Key name format:** valid `_meta` key names have two segments: an optional **prefix**, and a **name**.

**Prefix:**

- If specified, MUST be a series of labels separated by dots (`.`), followed by a slash (`/`).
  - Labels MUST start with a letter and end with a letter or digit; interior characters can be letters, digits, or hyphens (`-`).
  - Implementations SHOULD use reverse DNS notation (e.g., `com.example/` rather than `example.com/`).
- Any prefix where the second label is `modelcontextprotocol` or `mcp` is **reserved** for MCP use.
  - For example: `io.modelcontextprotocol/`, `dev.mcp/`, `org.modelcontextprotocol.api/`, and `com.mcp.tools/` are all reserved.
  - However, `com.example.mcp/` is NOT reserved, as the second label is `example`.

**Name:**

- Unless empty, MUST begin and end with an alphanumeric character (`[a-z0-9A-Z]`).
- MAY contain hyphens (`-`), underscores (`_`), dots (`.`), and alphanumerics in between.

**Reserved keys:**

The following `_meta` keys are reserved by this specification:

| Key                                          | Description                                                 | Defined in                                                              |
| -------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `progressToken`                              | Opts the request into progress notifications                | [Progress](/specification/2026-07-28/basic/patterns/progress)           |
| `io.modelcontextprotocol/protocolVersion`    | Protocol version for a request                              | Per-request protocol fields (below)                                     |
| `io.modelcontextprotocol/clientInfo`         | Client name and version                                     | Per-request protocol fields (below)                                     |
| `io.modelcontextprotocol/clientCapabilities` | Client capabilities relevant to a request                   | Per-request protocol fields (below)                                     |
| `io.modelcontextprotocol/logLevel`           | Minimum log level the server should emit for a request      | [Logging](/specification/2026-07-28/server/utilities/logging)           |
| `io.modelcontextprotocol/subscriptionId`     | Correlates a notification with its originating subscription | [Subscriptions](/specification/2026-07-28/basic/patterns/subscriptions) |
| `traceparent`, `tracestate`, `baggage`       | OpenTelemetry trace context propagation                     | OpenTelemetry trace context (below)                                     |

Official [extensions](/specification/2026-07-28/basic/versioning#extension-negotiation)
define additional `_meta` keys under the `io.modelcontextprotocol/` prefix, and
third-party extensions use their own vendor prefix.
In both cases the keys are specified in the extension's documentation.

**Per-request protocol fields:**

Client requests carry the following `io.modelcontextprotocol/*` fields in `_meta`;
fields marked as required **MUST** be included on every request. Servers use these
to identify the protocol version and capabilities in use without relying on any
prior connection state. See
[Versioning and Compatibility][lifecycle] for version negotiation rules.

| Key                                          | Type                 | Required | Description                                               |
| -------------------------------------------- | -------------------- | -------- | --------------------------------------------------------- |
| `io.modelcontextprotocol/protocolVersion`    | `string`             | Yes      | Protocol version for this request (e.g., `"2026-07-28"`)  |
| `io.modelcontextprotocol/clientInfo`         | `Implementation`     | No       | Client name and version                                   |
| `io.modelcontextprotocol/clientCapabilities` | `ClientCapabilities` | Yes      | Client capabilities relevant to this request              |
| `io.modelcontextprotocol/logLevel`           | `LoggingLevel`       | No       | Minimum log level the server should emit for this request |

A request missing any required field is malformed; the server **MUST** reject it with
JSON-RPC error code `-32602` (Invalid params). On HTTP, the response status **MUST** be
`400 Bad Request`.

Clients **SHOULD** include `io.modelcontextprotocol/clientInfo` on every request
unless specifically configured not to do so.

A server **MUST NOT** rely on capabilities the client has not declared. If
processing a request requires a capability the client did not include in
`io.modelcontextprotocol/clientCapabilities`, the server **MUST** return a
[`MissingRequiredClientCapabilityError`](/specification/2026-07-28/schema#missingrequiredclientcapabilityerror)
(`-32021`) whose `data.requiredCapabilities` lists the missing capabilities. On
HTTP, the response status **MUST** be `400 Bad Request`.

**Per-response protocol fields:**

Servers **SHOULD** include the following `io.modelcontextprotocol/*` field in
every result's `_meta`, unless specifically configured not to do so, to
identify themselves without relying on any prior connection state:

| Key                                  | Type             | Required | Description             |
| ------------------------------------ | ---------------- | -------- | ----------------------- |
| `io.modelcontextprotocol/serverInfo` | `Implementation` | No       | Server name and version |

<Note>
  `io.modelcontextprotocol/clientInfo` and `io.modelcontextprotocol/serverInfo`
  are self-reported by the sender and are not verified by the protocol. They are
  intended for display, logging, and debugging. Implementations **SHOULD NOT**
  use them to change the behavior of the client or server, and **SHOULD NOT**
  rely on them for security decisions.
</Note>

On notifications delivered via a [`subscriptions/listen`][subscriptions-listen] stream,
the server **MUST** include `io.modelcontextprotocol/subscriptionId` in `_meta` so the
client can correlate the notification with the originating subscription request.

[lifecycle]: /specification/2026-07-28/basic/versioning
[subscriptions-listen]: /specification/2026-07-28/basic/patterns/subscriptions

**OpenTelemetry trace context:**

As an exception to the prefix requirement above, the keys `traceparent`, `tracestate`, and
`baggage` are reserved for [OpenTelemetry](https://opentelemetry.io/) trace context propagation.
When present, their values MUST follow [W3C Trace Context](https://www.w3.org/TR/trace-context/)
and [W3C Baggage](https://www.w3.org/TR/baggage/) formats respectively.

This exception exists to maintain compatibility with existing implementations and
[OpenTelemetry semantic conventions for MCP](https://opentelemetry.io/docs/specs/semconv/gen-ai/mcp/).

Non-normative example of trace context in `_meta`:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "location": "New York"
    },
    "_meta": {
      "traceparent": "00-0af7651916cd43dd8448eb211c80319c-00f067aa0ba902b7-01"
    }
  }
}
```
