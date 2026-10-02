---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s383-listrootsrequest
section_title: "`ListRootsRequest`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 1091-1104
source_sha256: bdfb232898c79aef
granularity: heading
---
### `ListRootsRequest`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">ListRootsRequest</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#listrootsrequest-method">method</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">&quot;roots/list&quot;</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#listrootsrequest-params">params</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-symbol">&#x7B;</span> <span class="tsd-kind-property">&#x5F;meta</span><span class="tsd-signature-symbol">?:</span> <a href="#metaobject" class="tsd-signature-type tsd-kind-type-alias">MetaObject</a> <span class="tsd-signature-symbol">}</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Sent from the server to request a list of root URIs from the client. Roots allow
servers to ask for specific directories or files to operate on. A common example
for roots is providing a set of repositories or directories a server should operate
on.</p> <p>This request is typically used when the server needs to understand the file system
structure or access specific locations that the client has permission to read from.</p> </div> <div class="tsd-comment tsd-typography"> <details class="tsd-tag-example"> <summary class="tsd-anchor-link">Example: List roots request<a href="#listrootsrequest-example-list-roots-request" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></summary><pre id="listrootsrequest-example-list-roots-request"><code class="json"><span class="hl-0">&#x7B;</span><br/><span class="hl-0">  </span><span class="hl-1">&quot;id&quot;</span><span class="hl-0">: </span><span class="hl-2">&quot;list-roots-example&quot;</span><span class="hl-0">,</span><br/><span class="hl-0">  </span><span class="hl-1">&quot;method&quot;</span><span class="hl-0">: </span><span class="hl-2">&quot;roots/list&quot;</span><br/><span class="hl-0">}</span> </code><button type="button">Copy</button></pre> </details> <div class="tsd-tag-deprecated"> <div class="tsd-anchor-link" data-typedoc-h="4">Deprecated</div><p>Deprecated as of protocol version 2026-07-28 (SEP-2577).
Remains in the specification for at least twelve months; see the
deprecated features registry.</p> </div></div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="listrootsrequest-method" data-typedoc-h="3"><span class="deprecated">method: &quot;roots/list&quot;</span><a href="#listrootsrequest-method" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> </section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="listrootsrequest-params" data-typedoc-h="3"><span class="deprecated">params?: &#x7B; &#x5F;meta?: MetaObject }</span><a href="#listrootsrequest-params" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> </section>
</div>


<div class="type">
