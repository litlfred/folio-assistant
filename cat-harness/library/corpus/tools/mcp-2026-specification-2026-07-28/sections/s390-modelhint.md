---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s390-modelhint
section_title: "`ModelHint`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 1172-1182
source_sha256: bdfb232898c79aef
granularity: heading
---
### `ModelHint`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">ModelHint</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#modelhint-name">name</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Hints to use for model selection.</p> <p>Keys not declared here are currently left unspecified by the spec and are up
to the client to interpret.</p> </div> <div class="tsd-comment tsd-typography"> <div class="tsd-tag-deprecated"> <div class="tsd-anchor-link" data-typedoc-h="4">Deprecated</div><p>Deprecated as of protocol version 2026-07-28 (SEP-2577).
Remains in the specification for at least twelve months; see the
deprecated features registry.</p> </div></div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="modelhint-name" data-typedoc-h="3"><span class="deprecated">name?: string</span><a href="#modelhint-name" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>A hint for a model name.</p> <p>The client SHOULD treat this as a substring of a model name; for example:</p> <ul> <li><code>claude-3-5-sonnet</code> should match <code>claude-3-5-sonnet-20241022</code></li> <li><code>sonnet</code> should match <code>claude-3-5-sonnet-20241022</code>, <code>claude-3-sonnet-20240229</code>, etc.</li> <li><code>claude</code> should match any Claude model</li> </ul> <p>The client MAY also map the string to a different provider's model name or a different model family, as long as it fills a similar niche; for example:</p> <ul> <li><code>gemini-1.5-flash</code> could match <code>claude-3-haiku-20240307</code></li> </ul> </div></section>
</div>


<div class="type">
