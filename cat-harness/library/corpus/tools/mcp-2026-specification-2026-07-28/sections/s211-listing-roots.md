---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s211-listing-roots
section_title: "Listing Roots"
file: "docs/specification/2026-07-28/client/roots.mdx"
lines: 55-80
source_sha256: 016aea34d76ccce8
granularity: heading
---
### Listing Roots

To retrieve roots during the processing of a client request, servers send an `InputRequiredResult`
containing a `roots/list` request:

**Input request (delivered inside [`InputRequiredResult.inputRequests`](/specification/2026-07-28/basic/patterns/mrtr#inputrequests)):**

```json
{
  "method": "roots/list"
}
```

**Client result (returned inside `inputResponses` on the retried request):**

```json
{
  "roots": [
    {
      "uri": "file:///home/user/projects/myproject",
      "name": "My Project"
    }
  ]
}
```
