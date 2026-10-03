---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s076-resulttype
section_title: "ResultType"
file: "docs/specification/2026-07-28/basic/index.mdx"
lines: 75-86
source_sha256: 03586b10e3214c55
granularity: heading
---
##### ResultType

The `resultType` field in a result indicates the type of the result being returned. MCP supports polymorphic result types,
allowing servers to return different structures based on the outcome of the request. The `resultType` field is a string that clients
can use to determine how to parse and handle the `result` object.

- A `resultType` of `"complete"` indicates the request completed successfully and the result contains the final content.
- A `resultType` of `"input_required"` indicates the request is incomplete and more information is needed to process the request. The result contains an [`InputRequiredResult`](/specification/2026-07-28/basic/patterns/mrtr#inputrequiredresult) object with additional information needed.
- Extensions **MAY** add additional `ResultType` values. The set of supported `ResultType` values **MUST** be created from the set defined in the core protocol and include any additional values of supported extensions that are advertised via capabilities.
- A `resultType` of any value unrecognized by the client **MUST** be considered invalid.
- For backward compatibility with servers implementing earlier protocol versions, which do not include `resultType`, clients **MUST** treat an absent `resultType` as `"complete"`.
