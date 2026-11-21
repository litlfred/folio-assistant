---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s174-minor-changes
section_title: "Minor changes"
file: "docs/specification/2026-07-28/changelog.mdx"
lines: 30-68
source_sha256: b327e576f4c96b34
granularity: heading
---
## Minor changes

1. Add `extensions` field to `ClientCapabilities` and `ServerCapabilities` to support optional [extensions](/docs/extensions/overview) beyond the core protocol.
2. Document OpenTelemetry trace context propagation conventions for `_meta` keys (`traceparent`, `tracestate`, `baggage`) ([SEP-414](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/414)).
3. Servers **SHOULD** return tools from `tools/list` in a deterministic order to enable client-side caching and improve LLM prompt cache hit rates.
4. Require standard MCP request headers (`Mcp-Method`, `Mcp-Name`) on Streamable HTTP POST requests, and add support for custom headers from tool parameters via `x-mcp-header` ([SEP-2243](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2243)).
5. Require `ttlMs` and `cacheScope` fields on results returned by `tools/list`, `prompts/list`, `resources/list`, `resources/read`, and `resources/templates/list` via a new `CacheableResult` interface. `ttlMs` is a freshness hint (in milliseconds) allowing clients to cache responses and reduce polling; `cacheScope` (`"public"` or `"private"`) controls whether shared intermediaries may cache the response. Both fields complement existing `listChanged` notifications ([SEP-2549](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2549)).
6. Change resource not found error code from `-32002` to `-32602` (Invalid Params) to align with JSON-RPC specification.
7. Authorization servers **SHOULD** include the `iss` parameter in authorization responses per
   [RFC 9207](https://datatracker.ietf.org/doc/html/rfc9207), and MCP clients **MUST** validate a
   present `iss` against the recorded issuer before redeeming the authorization code
   ([SEP-2468](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2468)).
8. Require MCP clients to specify an appropriate `application_type` during Dynamic Client
   Registration to avoid OpenID Connect redirect URI conflicts
   ([SEP-837](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/837)).
9. Clarify that client credentials are bound to the authorization server that issued them:
   clients **MUST** key persisted credentials by the issuer identifier, **MUST NOT** reuse them
   with a different authorization server, and **MUST** re-register when the authorization server
   changes ([SEP-2352](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2352)).
10. Loosen `inputSchema` and `outputSchema` to allow any JSON Schema 2020-12 keywords, and
    `structuredContent` to allow any JSON value. Add `$ref` resolution requirements and
    composition-keyword resource bounds
    ([SEP-2106](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2106)).
11. Remove the `notifications/elicitation/complete` notification and the
    `elicitationId` field of URL mode elicitation requests, both introduced in
    `2025-11-25`. Under the
    [Multi Round-Trip Requests](/specification/2026-07-28/basic/patterns/mrtr) pattern, the
    client learns the outcome of an out-of-band interaction by retrying the original
    request, so a server-initiated completion signal — and the identifier used to
    correlate it — no longer fit the protocol. Servers needing to correlate an
    elicitation across retries encode their own identifier in `requestState`.
12. Define an [error code allocation policy](/specification/2026-07-28/basic/index#error-codes)
    partitioning the JSON-RPC server-error range: `-32000` to `-32019` remains
    implementation-defined (existing SDK usage is grandfathered), `-32020` to `-32099` is
    reserved for the MCP specification. Renumber the error codes introduced in this draft
    accordingly — `HeaderMismatch` `-32001` → `-32020`, `MissingRequiredClientCapability`
    `-32003` → `-32021`, `UnsupportedProtocolVersion` `-32004` → `-32022` — and add
    `HeaderMismatchError` to the schema, which previously existed only in transport prose.
