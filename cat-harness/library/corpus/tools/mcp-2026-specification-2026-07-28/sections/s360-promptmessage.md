---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s360-promptmessage
section_title: "`PromptMessage`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 868-875
source_sha256: bdfb232898c79aef
granularity: heading
---
### `PromptMessage`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">PromptMessage</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#promptmessage-role">role</a><span class="tsd-signature-symbol">:</span> <a href="#role" class="tsd-signature-type tsd-kind-type-alias">Role</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#promptmessage-content">content</a><span class="tsd-signature-symbol">:</span> <a href="#contentblock" class="tsd-signature-type tsd-kind-type-alias">ContentBlock</a><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Describes a message returned as part of a prompt.</p> <p>This is similar to <a href="#samplingmessage" class="tsd-kind-interface">SamplingMessage</a>, but also supports the embedding of
resources from the MCP server.</p> </div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="promptmessage-role" data-typedoc-h="3"><span>role: Role</span><a href="#promptmessage-role" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> </section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="promptmessage-content" data-typedoc-h="3"><span>content: ContentBlock</span><a href="#promptmessage-content" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> </section>
</div>
