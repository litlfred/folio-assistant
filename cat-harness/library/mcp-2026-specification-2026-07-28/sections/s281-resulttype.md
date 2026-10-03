---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s281-resulttype
section_title: "`ResultType`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 255-264
source_sha256: bdfb232898c79aef
granularity: heading
---
### `ResultType`

<div class="tsd-signature"><span class="tsd-kind-type-alias">ResultType</span><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">&quot;complete&quot;</span> <span class="tsd-signature-symbol">|</span> <span class="tsd-signature-type">&quot;input&#x5F;required&quot;</span> <span class="tsd-signature-symbol">|</span> <span class="tsd-signature-type">string</span></div> <div class="tsd-comment tsd-typography"><p>Indicates the type of a <a href="#result" class="tsd-kind-interface">Result</a> object, allowing the client to
determine how to parse the response.</p> <p>complete - the request completed successfully and the result contains the final content.
input&#x5F;required - the request requires additional input and the result contains an <a href="#inputrequiredresult" class="tsd-kind-interface">InputRequiredResult</a> object with instructions for the client to provide additional input before retrying the original request.</p> </div>
</div>


<div class="type">
