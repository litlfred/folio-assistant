---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s406-subscriptionslistenrequestparams
section_title: "`SubscriptionsListenRequestParams`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 1363-1371
source_sha256: bdfb232898c79aef
granularity: heading
---
### `SubscriptionsListenRequestParams`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">SubscriptionsListenRequestParams</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionslistenrequestparams-&#x5F;meta">&#x5F;meta</a><span class="tsd-signature-symbol">:</span> <a href="#requestmetaobject" class="tsd-signature-type tsd-kind-interface">RequestMetaObject</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionslistenrequestparams-notifications">notifications</a><span class="tsd-signature-symbol">:</span> <a href="#subscriptionfilter" class="tsd-signature-type tsd-kind-interface">SubscriptionFilter</a><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Parameters for a <a href="#subscriptionslistenrequest" class="tsd-kind-interface">subscriptions/listen</a> request.</p> </div> <section class="tsd-panel tsd-member tsd-is-inherited"> <div class="tsd-anchor-link" id="subscriptionslistenrequestparams-&#x5F;meta" data-typedoc-h="3"><span>&#x5F;meta: RequestMetaObject</span><a href="#subscriptionslistenrequestparams-&#x5F;meta" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <aside class="tsd-sources"> <p>Inherited from <a href="#requestparams">RequestParams</a>.<a href="#requestparams-&#x5F;meta">&#x5F;meta</a></p></aside></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="subscriptionslistenrequestparams-notifications" data-typedoc-h="3"><span>notifications: SubscriptionFilter</span><a href="#subscriptionslistenrequestparams-notifications" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>The notifications the client opts in to on this stream. The server <strong>MUST NOT</strong> send notification types the client has not explicitly
requested.</p> </div></section>
</div>


<div class="type">
