---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s408-subscriptionslistenresult
section_title: "`SubscriptionsListenResult`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 1381-1395
source_sha256: bdfb232898c79aef
granularity: heading
---
### `SubscriptionsListenResult`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">SubscriptionsListenResult</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionslistenresult-resulttype">resultType</a><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionslistenresult-&#x5F;meta">&#x5F;meta</a><span class="tsd-signature-symbol">:</span> <a href="#subscriptionslistenresultmetaobject" class="tsd-signature-type tsd-kind-interface">SubscriptionsListenResultMetaObject</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<span class="tsd-signature-symbol">&#x5B;</span><span class="tsd-kind-index-signature">key</span><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">]:</span> <span class="tsd-signature-type">unknown</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>The response to a <a href="#subscriptionslistenrequest" class="tsd-kind-interface">subscriptions/listen</a>
request, signalling that the subscription has ended gracefully (for example,
during server shutdown). Because the listen stream is long-lived, this result
is sent only when the server tears the subscription down; an abrupt transport
close carries no response. The result body is otherwise empty.</p> </div> <div class="tsd-comment tsd-typography"> <details class="tsd-tag-example"> <summary class="tsd-anchor-link">Example: Subscription closed gracefully<a href="#subscriptionslistenresult-example-subscription-closed-gracefully" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></summary><pre id="subscriptionslistenresult-example-subscription-closed-gracefully"><code class="json"><span class="hl-0">&#x7B;</span><br/><span class="hl-0">  </span><span class="hl-1">&quot;resultType&quot;</span><span class="hl-0">: </span><span class="hl-2">&quot;complete&quot;</span><span class="hl-0">,</span><br/><span class="hl-0">  </span><span class="hl-1">&quot;&#x5F;meta&quot;</span><span class="hl-0">: &#x7B;</span><br/><span class="hl-0">    </span><span class="hl-1">&quot;io.modelcontextprotocol/subscriptionId&quot;</span><span class="hl-0">: </span><span class="hl-2">&quot;listen-1&quot;</span><br/><span class="hl-0">  }</span><br/><span class="hl-0">}</span> </code><button type="button">Copy</button></pre> </details></div> <section class="tsd-panel tsd-member tsd-is-inherited"> <div class="tsd-anchor-link" id="subscriptionslistenresult-resulttype" data-typedoc-h="3"><span>resultType: string</span><a href="#subscriptionslistenresult-resulttype" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Indicates the type of the result, which allows the client to determine
how to parse the result object.</p> <p>Servers implementing this protocol version MUST include this field.
For backward compatibility, when a client receives a result from a
server implementing an earlier protocol version (which does not include <code>resultType</code>), the client MUST treat the absent field as <code>&quot;complete&quot;</code>.</p> </div><aside class="tsd-sources"> <p>Inherited from <a href="#result">Result</a>.<a href="#result-resulttype">resultType</a></p></aside></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="subscriptionslistenresult-&#x5F;meta" data-typedoc-h="3"><span>&#x5F;meta: SubscriptionsListenResultMetaObject</span><a href="#subscriptionslistenresult-&#x5F;meta" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <aside class="tsd-sources"> <p>Overrides <a href="#result">Result</a>.<a href="#result-&#x5F;meta">&#x5F;meta</a></p></aside></section>
</div>


<div class="type">
