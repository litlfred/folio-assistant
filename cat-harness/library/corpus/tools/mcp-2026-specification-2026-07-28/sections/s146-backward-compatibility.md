---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s146-backward-compatibility
section_title: "Backward Compatibility"
file: "docs/specification/2026-07-28/basic/transports/stdio.mdx"
lines: 121-154
source_sha256: 6fd49766c40dc093
granularity: heading
---
## Backward Compatibility

A client that supports both modern (per-request-metadata) MCP versions and a
legacy version that requires an `initialize` handshake **SHOULD** probe with
[`server/discover`][server-discover] before sending any other request,
setting its preferred modern version in `_meta`. The probe has three
possible outcomes:

- The server returns a `DiscoverResult`: the server is modern. Select a
  mutually supported version from `supportedVersions` and continue.
- The server returns a recognized modern JSON-RPC error such as
  [`UnsupportedProtocolVersionError`][unsupported-version]: the server is
  modern but does not support the requested version. Use one of the versions
  in its advertised `supported` list. Do **not** fall back to `initialize`.
- The server returns any other error, or does not respond within a
  reasonable timeout: the server is legacy. Fall back to the `initialize`
  handshake.

The fallback **MUST NOT** be keyed to one specific error code: legacy servers
respond to unknown pre-`initialize` requests with implementation-defined
errors (commonly `-32601` or `-32602`) or not at all.

A client that only supports modern versions does not need to probe, but
probing is still **RECOMMENDED**: some legacy servers do not validate that a
request arrives after `initialize` and would process an era-ambiguous method
(such as `tools/call`) under legacy semantics. Probing yields a
deterministic failure instead.

See [Versioning: Backward Compatibility][lifecycle-compat] for the era model
and a compatibility matrix for implementors.

[server-discover]: /specification/2026-07-28/schema#discoverrequest
[unsupported-version]: /specification/2026-07-28/schema#unsupportedprotocolversionerror
[lifecycle-compat]: /specification/2026-07-28/basic/versioning#backward-compatibility-with-initialization-based-versions
