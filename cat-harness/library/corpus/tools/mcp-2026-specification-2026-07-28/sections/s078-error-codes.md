---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s078-error-codes
section_title: "Error Codes"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 109-156
source_sha256: 03586b10e3214c55
granularity: heading
---
#### Error Codes

MCP uses the standard JSON-RPC 2.0 error codes (`-32700`, `-32600` to `-32603`)
for general protocol failures.

JSON-RPC 2.0 reserves the range `-32000` to `-32099` for implementation-defined
server errors. MCP partitions this range as follows:

- **`-32000` to `-32019` — legacy.** Codes in this sub-range were allocated by
  implementations before this policy was introduced. New codes **MUST NOT** be
  allocated in this sub-range, and new implementations **SHOULD NOT** use codes
  from this sub-range at all. Apart from `-32002` (see below), receivers
  **MUST NOT** assume any specific meaning for these codes.
- **`-32020` to `-32099` — reserved for the MCP specification.** Error codes
  in this sub-range are defined exclusively by the MCP specification and
  recorded in the [schema](/specification/2026-07-28/schema). Implementations
  **MUST NOT** emit any code from this sub-range that is not defined by this
  specification and **MUST** use defined codes only with their specified
  meanings.

MCP defines the following error codes:

| Code     | Name                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| `-32020` | [`HeaderMismatch`](/specification/2026-07-28/schema#headermismatcherror)                                   |
| `-32021` | [`MissingRequiredClientCapability`](/specification/2026-07-28/schema#missingrequiredclientcapabilityerror) |
| `-32022` | [`UnsupportedProtocolVersion`](/specification/2026-07-28/schema#unsupportedprotocolversionerror)           |

Codes defined by earlier protocol versions remain reserved and will not be
reused. Implementations of this protocol version **MUST NOT** emit these codes:

- `-32002` — resource not found (2025-11-25 and earlier; replaced by `-32602`).
  Clients [**SHOULD** still
  accept `-32002`](/specification/2026-07-28/server/resources#error-handling) from
  servers implementing earlier versions.
- `-32042` — URL elicitation required (2025-11-25 only).

Errors that are purely local to an implementation (for example, a request
timeout raised inside an SDK) are not currently assigned codes by this
specification. Implementations surfacing local errors in JSON-RPC-shaped
structures should ensure they cannot be mistaken for errors received from the
peer. Future versions of the specification may define standard codes for
common local error conditions in the reserved sub-range.

New error codes for purposes not defined by this specification **SHOULD** be
allocated outside the JSON-RPC reserved range (`-32768` to `-32000`); the
remainder of the integer space is available for application-defined errors.
