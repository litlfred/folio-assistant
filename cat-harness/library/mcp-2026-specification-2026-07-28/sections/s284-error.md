---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s284-error
section_title: "`Error`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 276-283
source_sha256: bdfb232898c79aef
granularity: heading
---
### `Error`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">Error</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#error-code">code</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">number</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#error-message">message</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#error-data">data</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">unknown</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="error-code" data-typedoc-h="3"><span>code: number</span><a href="#error-code" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>The error type that occurred.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="error-message" data-typedoc-h="3"><span>message: string</span><a href="#error-message" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>A short description of the error. The message SHOULD be limited to a concise single sentence.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="error-data" data-typedoc-h="3"><span>data?: unknown</span><a href="#error-data" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).</p> </div></section>
</div>


<div class="type">
