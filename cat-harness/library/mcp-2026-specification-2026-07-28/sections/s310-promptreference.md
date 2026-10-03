---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s310-promptreference
section_title: "`PromptReference`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 491-501
source_sha256: bdfb232898c79aef
granularity: heading
---
### `PromptReference`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">PromptReference</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#promptreference-name">name</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#promptreference-title">title</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#promptreference-type">type</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">&quot;ref/prompt&quot;</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Identifies a prompt.</p> </div> <section class="tsd-panel tsd-member tsd-is-inherited"> <div class="tsd-anchor-link" id="promptreference-name" data-typedoc-h="3"><span>name: string</span><a href="#promptreference-name" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Intended for programmatic or logical use, but used as a display name in past specs or fallback (if title isn't present).</p> </div><aside class="tsd-sources"> <p>Inherited from BaseMetadata.name</p></aside></section> <section class="tsd-panel tsd-member tsd-is-inherited"> <div class="tsd-anchor-link" id="promptreference-title" data-typedoc-h="3"><span>title?: string</span><a href="#promptreference-title" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
even by those unfamiliar with domain-specific terminology.</p> <p>If not provided, the name should be used for display (except for <a href="#tool" class="tsd-kind-interface">Tool</a>,
where <code>annotations.title</code> should be given precedence over using <code>name</code>,
if present).</p> </div><aside class="tsd-sources"> <p>Inherited from BaseMetadata.title</p></aside></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="promptreference-type" data-typedoc-h="3"><span>type: &quot;ref/prompt&quot;</span><a href="#promptreference-type" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> </section>
</div>


<div class="type">
