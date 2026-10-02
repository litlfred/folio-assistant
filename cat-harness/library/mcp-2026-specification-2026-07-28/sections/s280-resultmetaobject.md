---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s280-resultmetaobject
section_title: "`ResultMetaObject`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 241-254
source_sha256: bdfb232898c79aef
granularity: heading
---
### `ResultMetaObject`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">ResultMetaObject</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#resultmetaobject-iomodelcontextprotocolserverinfo">&quot;io.modelcontextprotocol/serverInfo&quot;</a><span class="tsd-signature-symbol">?:</span> <a href="#implementation" class="tsd-signature-type tsd-kind-interface">Implementation</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<span class="tsd-signature-symbol">&#x5B;</span><span class="tsd-kind-index-signature">key</span><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">]:</span> <span class="tsd-signature-type">unknown</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Extends <a href="#metaobject" class="tsd-kind-type-alias">MetaObject</a> with additional result-specific fields. All key naming rules from <code>MetaObject</code> apply.</p> </div> <div class="tsd-comment tsd-typography"> <div class="tsd-tag-see"> <div class="tsd-anchor-link" data-typedoc-h="4">See</div><ul> <li><a href="#metaobject" class="tsd-kind-type-alias">MetaObject</a> for key naming rules and reserved prefixes.</li> <li><a href="/specification/2026-07-28/basic/index#meta">General fields: <code>&#x5F;meta</code></a> for more details.</li> </ul> </div></div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="resultmetaobject-iomodelcontextprotocolserverinfo" data-typedoc-h="3"><span>&quot;io.modelcontextprotocol/serverInfo&quot;?: Implementation</span><a href="#resultmetaobject-iomodelcontextprotocolserverinfo" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Identifies the server software producing the response. Servers SHOULD
include this field on every response unless specifically configured not
to do so.</p> <p>The <a href="#implementation" class="tsd-kind-interface">Implementation</a> schema requires <code>name</code> and <code>version</code>; other
fields are optional.</p> <p>The value is self-reported by the server and is not verified by the
protocol. It is intended for display, logging, and debugging. Clients
SHOULD NOT use it to change their behavior, and SHOULD NOT rely on it for
security decisions.</p> </div></section>
</div>


<div class="type">
