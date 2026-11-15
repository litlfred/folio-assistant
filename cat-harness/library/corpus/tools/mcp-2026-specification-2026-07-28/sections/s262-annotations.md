---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s262-annotations
section_title: "`Annotations`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 62-72
source_sha256: bdfb232898c79aef
granularity: heading
---
### `Annotations`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">Annotations</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#annotations-audience">audience</a><span class="tsd-signature-symbol">?:</span> <a href="#role" class="tsd-signature-type tsd-kind-type-alias">Role</a><span class="tsd-signature-symbol">&#x5B;]</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#annotations-priority">priority</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">number</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#annotations-lastmodified">lastModified</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Optional annotations for the client. The client can use annotations to inform how objects are used or displayed</p> </div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="annotations-audience" data-typedoc-h="3"><span>audience?: Role&#x5B;]</span><a href="#annotations-audience" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Describes who the intended audience of this object or data is.</p> <p>It can include multiple entries to indicate content useful for multiple audiences (e.g., <code>&#x5B;&quot;user&quot;, &quot;assistant&quot;]</code>).</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="annotations-priority" data-typedoc-h="3"><span>priority?: number</span><a href="#annotations-priority" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Describes how important this data is for operating the server.</p> <p>A value of 1 means &quot;most important,&quot; and indicates that the data is
effectively required, while 0 means &quot;least important,&quot; and indicates that
the data is entirely optional.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="annotations-lastmodified" data-typedoc-h="3"><span>lastModified?: string</span><a href="#annotations-lastmodified" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>The moment the resource was last modified, as an ISO 8601 formatted string.</p> <p>Should be an ISO 8601 formatted string (e.g., &quot;2025-01-12T15:00:58Z&quot;).</p> <p>Examples: last activity timestamp in an open file, timestamp when the resource
was attached, etc.</p> </div></section>
</div>


<div class="type">
