---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s272-notificationmetaobject
section_title: "`NotificationMetaObject`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 153-166
source_sha256: bdfb232898c79aef
granularity: heading
---
### `NotificationMetaObject`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">NotificationMetaObject</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#notificationmetaobject-iomodelcontextprotocolsubscriptionid">&quot;io.modelcontextprotocol/subscriptionId&quot;</a><span class="tsd-signature-symbol">?:</span> <a href="#requestid" class="tsd-signature-type tsd-kind-type-alias">RequestId</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<span class="tsd-signature-symbol">&#x5B;</span><span class="tsd-kind-index-signature">key</span><span class="tsd-signature-symbol">:</span> <span class="tsd-signature-type">string</span><span class="tsd-signature-symbol">]:</span> <span class="tsd-signature-type">unknown</span><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Extends <a href="#metaobject" class="tsd-kind-type-alias">MetaObject</a> with additional notification-specific fields. All key naming rules from <code>MetaObject</code> apply.</p> </div> <div class="tsd-comment tsd-typography"> <div class="tsd-tag-see"> <div class="tsd-anchor-link" data-typedoc-h="4">See</div><ul> <li><a href="#metaobject" class="tsd-kind-type-alias">MetaObject</a> for key naming rules and reserved prefixes.</li> <li><a href="/specification/2026-07-28/basic/index#meta">General fields: <code>&#x5F;meta</code></a> for more details.</li> </ul> </div></div> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="notificationmetaobject-iomodelcontextprotocolsubscriptionid" data-typedoc-h="3"><span>&quot;io.modelcontextprotocol/subscriptionId&quot;?: RequestId</span><a href="#notificationmetaobject-iomodelcontextprotocolsubscriptionid" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>Identifies the subscription stream a notification was delivered on. The
server MUST include this key on every notification delivered via a <a href="#subscriptionslistenrequest" class="tsd-kind-interface">subscriptions/listen</a> stream, so the
client can correlate the notification with the originating subscription.
The key is absent on notifications not delivered via a subscription
stream (e.g. progress notifications for an in-flight request), which is
why it is optional here.</p> <p>The value is the JSON-RPC ID of the <code>subscriptions/listen</code> request that
opened the stream.</p> </div></section>
</div>


<div class="type">
