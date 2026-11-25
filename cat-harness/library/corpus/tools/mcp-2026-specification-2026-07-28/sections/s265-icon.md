---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s265-icon
section_title: "`Icon`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 89-102
source_sha256: bdfb232898c79aef
granularity: heading
---
### `Icon`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">Icon</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#icon-src">src</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#icon-mimetype">mimeType</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#icon-sizes">sizes</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">&#x5B;]</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#icon-theme">theme</a><span class="tsd-signature-symbol">?:</span> <span class="tsd-signature-type">&quot;light&quot;</span> <span class="tsd-signature-symbol">|</span> <span class="tsd-signature-type">&quot;dark&quot;</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>An optionally-sized icon that can be displayed in a user interface.</p> </div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="icon-src" data-typedoc-h="3"><span>src: string</span><a href="#icon-src" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>A standard URI pointing to an icon resource. May be an HTTP/HTTPS URL or a <code>data:</code> URI with Base64-encoded image data.</p> <p>Consumers SHOULD take steps to ensure URLs serving icons are from the
same domain as the client/server or a trusted domain.</p> <p>Consumers SHOULD take appropriate precautions when consuming SVGs as they can contain
executable JavaScript.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="icon-mimetype" data-typedoc-h="3"><span>mimeType?: string</span><a href="#icon-mimetype" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Optional MIME type override if the source MIME type is missing or generic.
For example: <code>&quot;image/png&quot;</code>, <code>&quot;image/jpeg&quot;</code>, or <code>&quot;image/svg+xml&quot;</code>.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="icon-sizes" data-typedoc-h="3"><span>sizes?: string&#x5B;]</span><a href="#icon-sizes" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Optional array of strings that specify sizes at which the icon can be used.
Each string should be in WxH format (e.g., <code>&quot;48x48&quot;</code>, <code>&quot;96x96&quot;</code>) or <code>&quot;any&quot;</code> for scalable formats like SVG.</p> <p>If not provided, the client should assume that the icon can be used at any size.</p> </div></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="icon-theme" data-typedoc-h="3"><span>theme?: &quot;light&quot; | &quot;dark&quot;</span><a href="#icon-theme" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Optional specifier for the theme this icon is designed for. <code>&quot;light&quot;</code> indicates
the icon is designed to be used with a light background, and <code>&quot;dark&quot;</code> indicates
the icon is designed to be used with a dark background.</p> <p>If not provided, the client should assume the icon can be used with any theme.</p> </div></section>
</div>


<div class="type">
