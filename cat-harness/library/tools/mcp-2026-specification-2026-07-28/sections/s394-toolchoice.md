---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s394-toolchoice
section_title: "`ToolChoice`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 1227-1236
source_sha256: bdfb232898c79aef
granularity: heading
---
### `ToolChoice`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">ToolChoice</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#toolchoice-mode">mode</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">&quot;none&quot;</span> <span class="tsd-signature-symbol">|</span> <span class="tsd-signature-type">&quot;required&quot;</span> <span class="tsd-signature-symbol">|</span> <span class="tsd-signature-type">&quot;auto&quot;</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Controls tool selection behavior for sampling requests.</p> </div> <div class="tsd-comment tsd-typography"> <div class="tsd-tag-deprecated"> <div class="tsd-anchor-link" data-typedoc-h="4">Deprecated</div><p>Deprecated as of protocol version 2026-07-28 (SEP-2577).
Remains in the specification for at least twelve months; see the
deprecated features registry.</p> </div></div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="toolchoice-mode" data-typedoc-h="3"><span class="deprecated">mode?: &quot;none&quot; | &quot;required&quot; | &quot;auto&quot;</span><a href="#toolchoice-mode" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Controls the tool use ability of the model:</p> <ul> <li><code>&quot;auto&quot;</code>: Model decides whether to use tools (default)</li> <li><code>&quot;required&quot;</code>: Model MUST use at least one tool before completing</li> <li><code>&quot;none&quot;</code>: Model MUST NOT use any tools</li> </ul> </div></section>
</div>


<div class="type">
