---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s410-subscriptionslistenresultmetaobject
section_title: "`SubscriptionsListenResultMetaObject`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 1406-1421
source_sha256: bdfb232898c79aef
granularity: heading
---
### `SubscriptionsListenResultMetaObject`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">SubscriptionsListenResultMetaObject</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionslistenresultmetaobject-iomodelcontextprotocolserverinfo">&quot;io.modelcontextprotocol/serverInfo&quot;</a><span class="tsd-signature-symbol">?:</span> <a href="#implementation" class="tsd-signature-type tsd-kind-interface">Implementation</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionslistenresultmetaobject-iomodelcontextprotocolsubscriptionid">&quot;io.modelcontextprotocol/subscriptionId&quot;</a><span class="tsd-signature-symbol">:</span> <a href="#requestid" class="tsd-signature-type tsd-kind-type-alias">RequestId</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<span class="tsd-signature-symbol">&#x5B;</span><span class="tsd-kind-index-signature">key</span><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">]:</span> <span class="tsd-signature-type">unknown</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Extends <a href="#resultmetaobject" class="tsd-kind-interface">ResultMetaObject</a> with the subscription-stream identifier carried by a <a href="#subscriptionslistenresult" class="tsd-kind-interface">SubscriptionsListenResult</a>. All key naming rules from <code>MetaObject</code> apply.</p> </div> <div class="tsd-comment tsd-typography"> <div class="tsd-tag-see"> <div class="tsd-anchor-link" data-typedoc-h="4">See</div><p><a href="#metaobject" class="tsd-kind-type-alias">MetaObject</a> for key naming rules and reserved prefixes.</p> </div></div> <section class="tsd-panel tsd-member tsd-is-inherited"> <div class="tsd-anchor-link" id="subscriptionslistenresultmetaobject-iomodelcontextprotocolserverinfo" data-typedoc-h="3"><span>&quot;io.modelcontextprotocol/serverInfo&quot;?: Implementation</span><a href="#subscriptionslistenresultmetaobject-iomodelcontextprotocolserverinfo" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Identifies the server software producing the response. Servers SHOULD
include this field on every response unless specifically configured not
to do so.</p> <p>The <a href="#implementation" class="tsd-kind-interface">Implementation</a> schema requires <code>name</code> and <code>version</code>; other
fields are optional.</p> <p>The value is self-reported by the server and is not verified by the
protocol. It is intended for display, logging, and debugging. Clients
SHOULD NOT use it to change their behavior, and SHOULD NOT rely on it for
security decisions.</p> </div><aside class="tsd-sources"> <p>Inherited from <a href="#resultmetaobject">ResultMetaObject</a>.<a href="#resultmetaobject-iomodelcontextprotocolserverinfo">io.modelcontextprotocol/serverInfo</a></p></aside></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="subscriptionslistenresultmetaobject-iomodelcontextprotocolsubscriptionid" data-typedoc-h="3"><span>&quot;io.modelcontextprotocol/subscriptionId&quot;: RequestId</span><a href="#subscriptionslistenresultmetaobject-iomodelcontextprotocolsubscriptionid" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Identifies the subscription stream this response closes, so the client can
correlate it with the originating subscription — mirroring the same key on
the stream's notifications. The value is the JSON-RPC ID of the <code>subscriptions/listen</code> request that opened the stream (and equals this
response's <code>id</code>).</p> </div></section>
</div>
