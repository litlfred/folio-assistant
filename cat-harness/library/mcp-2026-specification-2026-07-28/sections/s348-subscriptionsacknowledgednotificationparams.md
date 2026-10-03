---
doc_id: mcp-2026-specification-2026-07-28
doc_title: "Model Context Protocol Specification, version 2026-07-28"
section_id: s348-subscriptionsacknowledgednotificationparams
section_title: "`SubscriptionsAcknowledgedNotificationParams`"
file: "docs/specification/2026-07-28/schema.mdx"
lines: 774-783
source_sha256: bdfb232898c79aef
granularity: heading
---
### `SubscriptionsAcknowledgedNotificationParams`

<div class="tsd-signature"><span class="tsd-signature-keyword">interface</span> <span class="tsd-kind-interface">SubscriptionsAcknowledgedNotificationParams</span> <span class="tsd-signature-symbol">&#x7B;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionsacknowledgednotificationparams-&#x5F;meta">&#x5F;meta</a><span class="tsd-signature-symbol">?:</span> <a href="#notificationmetaobject" class="tsd-signature-type tsd-kind-interface">NotificationMetaObject</a><span class="tsd-signature-symbol">;</span><br/>&nbsp;&nbsp;<a class="tsd-kind-property" href="#subscriptionsacknowledgednotificationparams-notifications">notifications</a><span class="tsd-signature-symbol">:</span> <a href="#subscriptionfilter" class="tsd-signature-type tsd-kind-interface">SubscriptionFilter</a><span class="tsd-signature-symbol">;</span><br/><span class="tsd-signature-symbol">}</span></div> <div class="tsd-comment tsd-typography"><p>Parameters for a <a href="#subscriptionsacknowledgednotification" class="tsd-kind-interface">notifications/subscriptions/acknowledged</a> notification.</p> </div> <section class="tsd-panel tsd-member tsd-is-inherited"> <div class="tsd-anchor-link" id="subscriptionsacknowledgednotificationparams-&#x5F;meta" data-typedoc-h="3"><span>&#x5F;meta?: NotificationMetaObject</span><a href="#subscriptionsacknowledgednotificationparams-&#x5F;meta" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <aside class="tsd-sources"> <p>Inherited from <a href="#notificationparams">NotificationParams</a>.<a href="#notificationparams-&#x5F;meta">&#x5F;meta</a></p></aside></section> <section class="tsd-panel tsd-member"> <div class="tsd-anchor-link" id="subscriptionsacknowledgednotificationparams-notifications" data-typedoc-h="3"><span>notifications: SubscriptionFilter</span><a href="#subscriptionsacknowledgednotificationparams-notifications" aria-label="Permalink" class="tsd-anchor-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons.svg#icon-anchor"/></svg></a></div> <div class="tsd-comment tsd-typography"><p>The subset of requested notification types the server agreed to honor.
Only includes notification types the server actually supports; if the
client requested an unsupported type (e.g., <code>promptsListChanged</code> when
the server has no prompts), it is omitted from this set.</p> </div></section>
</div>
