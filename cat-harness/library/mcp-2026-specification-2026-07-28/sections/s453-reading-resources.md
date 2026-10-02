---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s453-reading-resources
section_title: "Reading Resources"
file: "docs/specification/2026-07-28/server/resources.mdx"
lines: 134-180
source_sha256: 10538119019af5f4
granularity: heading
---
### Reading Resources

To retrieve resource contents, clients send a `resources/read` request. This operation
supports [caching](/specification/2026-07-28/server/utilities/caching).

**Request:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "file:///project/src/main.rs"
  }
}
```

**Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "resultType": "complete",
    "contents": [
      {
        "uri": "file:///project/src/main.rs",
        "mimeType": "text/x-rust",
        "text": "fn main() {\n    println!(\"Hello world!\");\n}"
      }
    ],
    "ttlMs": 60000,
    "cacheScope": "private"
  }
}
```

Servers **MAY** return multiple resource contents in response to a single
`resources/read` request. For example, a server could return the contents of
several files when a directory resource is read.

Servers **MAY** also respond to `resources/read` with an [`InputRequiredResult`](/specification/2026-07-28/basic/patterns/mrtr#inputrequiredresult) to indicate that additional input is needed before the resource can be read. This follows the [multi round-trip requests](/specification/2026-07-28/basic/patterns/mrtr#multi-round-trip-requests) mechanism. When retrying the request, clients include `inputResponses` and, if provided by the server, `requestState` in the request parameters.

Alternatively, if the scheme of `uri` is `https://`, clients may fetch the resource directly from the web. See the [Common URI Schemes section](#https%3A%2F%2F) for more information.
