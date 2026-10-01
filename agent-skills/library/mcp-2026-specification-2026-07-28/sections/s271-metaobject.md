---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s271-metaobject
section_title: "`MetaObject`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 145-152
source_sha256: bdfb232898c79aef
granularity: heading
---
### `MetaObject`

<div class="tsd-signature"><span class="tsd-kind-type-alias">MetaObject</span><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">Record</span><span class="tsd-signature-symbol">&lt;</span><span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">,</span> <span class="tsd-signature-type">unknown</span><span class="tsd-signature-symbol">&gt;</span></div> <div class="tsd-comment tsd-typography"><p>Represents the contents of a <code>&#x5F;meta</code> field, which clients and servers use to attach additional metadata to their interactions.</p> <p>Certain key names are reserved by MCP for protocol-level metadata; implementations MUST NOT make assumptions about values at these keys. Additionally, specific schema definitions may reserve particular names for purpose-specific metadata, as declared in those definitions.</p> <p>Valid keys have two segments:</p> <p><strong>Prefix:</strong></p> <ul> <li>Optional — if specified, MUST be a series of <em>labels</em> separated by dots (<code>.</code>), followed by a slash (<code>/</code>).</li> <li>Labels MUST start with a letter and end with a letter or digit. Interior characters may be letters, digits, or hyphens (<code>-</code>).</li> <li>Implementations SHOULD use reverse DNS notation (e.g., <code>com.example/</code> rather than <code>example.com/</code>).</li> <li>Any prefix where the second label is <code>modelcontextprotocol</code> or <code>mcp</code> is <strong>reserved</strong> for MCP use. For example: <code>io.modelcontextprotocol/</code>, <code>dev.mcp/</code>, <code>org.modelcontextprotocol.api/</code>, and <code>com.mcp.tools/</code> are all reserved. However, <code>com.example.mcp/</code> is NOT reserved, as the second label is <code>example</code>.</li> </ul> <p><strong>Name:</strong></p> <ul> <li>Unless empty, MUST start and end with an alphanumeric character (<code>&#x5B;a-z0-9A-Z]</code>).</li> <li>Interior characters may be alphanumeric, hyphens (<code>-</code>), underscores (<code>&#x5F;</code>), or dots (<code>.</code>).</li> </ul> </div> <div class="tsd-comment tsd-typography"> <div class="tsd-tag-see"> <div class="tsd-anchor-link" data-typedoc-h="4">See</div><p><a href="/specification/2026-07-28/basic/index#meta">General fields: <code>&#x5F;meta</code></a> for more details.</p> </div></div>
</div>


<div class="type">
