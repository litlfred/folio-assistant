---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s385-root
section_title: "`Root`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 1117-1129
source_sha256: bdfb232898c79aef
granularity: heading
---
### `Root`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">Root</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#root-uri">uri</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#root-name">name</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#root-&#x5F;meta">&#x5F;meta</a><span class="tsd-signature-symbol">?:</span> <a href="#metaobject" class="tsd-signature-type tsd-kind-type-alias">MetaObject</a><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Represents a root directory or file that the server can operate on.</p> </div> <div class="tsd-comment tsd-typography"> <details class="tsd-tag-example"> <summary class="tsd-anchor-link">Example: Project directory root<a href="#root-example-project-directory-root" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></summary><pre id="root-example-project-directory-root"><code class="json"><span class="hl-0">&#x7B;</span><br/><span class="hl-0">  </span><span class="hl-1">&quot;uri&quot;</span><span class="hl-0">: </span><span class="hl-2">&quot;file:///home/user/projects/myproject&quot;</span><span class="hl-0">,</span><br/><span class="hl-0">  </span><span class="hl-1">&quot;name&quot;</span><span class="hl-0">: </span><span class="hl-2">&quot;My Project&quot;</span><br/><span class="hl-0">}</span> </code><button type="button">Copy</button></pre> </details> <div class="tsd-tag-deprecated"> <div class="tsd-anchor-link" data-typedoc-h="4">Deprecated</div><p>Deprecated as of protocol version 2026-07-28 (SEP-2577).
Remains in the specification for at least twelve months; see the
deprecated features registry.</p> </div></div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="root-uri" data-typedoc-h="3"><span class="deprecated">uri: string</span><a href="#root-uri" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>The URI identifying the root. This <em>must</em> start with <code>file://</code> for now.
This restriction may be relaxed in future versions of the protocol to allow
other URI schemes.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="root-name" data-typedoc-h="3"><span class="deprecated">name?: string</span><a href="#root-name" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>An optional name for the root. This can be used to provide a human-readable
identifier for the root, which may be useful for display purposes or for
referencing the root in other parts of the application.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="root-&#x5F;meta" data-typedoc-h="3"><span class="deprecated">&#x5F;meta?: MetaObject</span><a href="#root-&#x5F;meta" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> </section>
</div>
