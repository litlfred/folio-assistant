---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s279-result
section_title: "`Result`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 230-240
source_sha256: bdfb232898c79aef
granularity: heading
---
### `Result`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">Result</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#result-&#x5F;meta">&#x5F;meta</a><span class="tsd-signature-symbol">?:</span> <a href="#resultmetaobject" class="tsd-signature-type tsd-kind-interface">ResultMetaObject</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#result-resulttype">resultType</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<span class="tsd-signature-symbol">&#x5B;</span><span class="tsd-kind-index-signature">key</span><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">]:</span> <span class="tsd-signature-type">unknown</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Common result fields.</p> </div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="result-&#x5F;meta" data-typedoc-h="3"><span>&#x5F;meta?: ResultMetaObject</span><a href="#result-&#x5F;meta" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> </section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="result-resulttype" data-typedoc-h="3"><span>resultType: string</span><a href="#result-resulttype" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Indicates the type of the result, which allows the client to determine
how to parse the result object.</p> <p>Servers implementing this protocol version MUST include this field.
For backward compatibility, when a client receives a result from a
server implementing an earlier protocol version (which does not include <code>resultType</code>), the client MUST treat the absent field as <code>&quot;complete&quot;</code>.</p> </div></section>
</div>


<div class="type">
