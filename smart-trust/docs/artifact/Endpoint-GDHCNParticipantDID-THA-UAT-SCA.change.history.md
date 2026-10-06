---
title: "GDHCNParticipantDID-THA-UAT-SCA — change history"
description: "Thailand Trustlist (DID v2) - UAT - Certificate Signing Authority
did:web:tng-cdn.who.int:v2:trustlist:-:THA:SCA
resolvable at https://tng-cdn-uat.who.int/v2/trustlist/-/THA/SCA/did.json - Change History."
nav_exclude: true
tab_page: {"tabs":[{"label":"Narrative Content","href":"Endpoint-GDHCNParticipantDID-THA-UAT-SCA.html","active":false},{"label":"XML","href":"https://litlfred.github.io/smart-trust/Endpoint-GDHCNParticipantDID-THA-UAT-SCA.xml","active":false},{"label":"JSON","href":"Endpoint-GDHCNParticipantDID-THA-UAT-SCA.json.html","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/Endpoint-GDHCNParticipantDID-THA-UAT-SCA.ttl","active":false}],"heading":"Thailand Trustlist (DID v2) - UAT - Certificate Signing Authority\ndid:web:tng-cdn.who.int:v2:trustlist:-:THA:SCA\nresolvable at https://tng-cdn-uat.who.int/v2/trustlist/-/THA/SCA/did.json - Change History","sections":[{"text":"History of changes for GDHCNParticipantDID-THA-UAT-SCA ."}]}
ig_footer: true
ig_root: "../"
---
<link rel="stylesheet" href="../assets/ig-pages.css">
<link rel="stylesheet" href="../assets/ig-chrome.css">

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/trust">smart.who.int.trust</a></div>
  <div id="ig-status" class="ig-status-draft">
    <p><span class="st-ig-title">WHO SMART Trust</span><br/><span>1.8.0 — draft</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/trust">http://smart.who.int/trust</a>.</p>
</div>

{%- comment -%}
A resource's text-only tab page — `.change.history`, `-testing`, a logical model's `.profile.history` or `-examples` — rendered by Jekyll.
Reads `page.tab_page`, every field written by `gen-ig-pages.ts` (`resource-views.ts`): `tabs[]` (`label`,
`href`, `active`), `heading`, `status` (the Publisher's "<Status> as of <date>", absent when the resource
carries no date) and `sections[]` (`heading` optional, `text`), all markdown-escaped by the generator.
{%- endcomment -%}
{% for t in page.tab_page.tabs %}{% if t.active %}**{{ t.label }}**{% else %}[{{ t.label }}]({{ t.href }}){% endif %}{% unless forloop.last %} · {% endunless %}{% endfor %}

## {{ page.tab_page.heading }}

{% if page.tab_page.status %}{{ page.tab_page.status }}

{% endif %}{% for s in page.tab_page.sections %}{% if s.heading %}### {{ s.heading }}

{% endif %}{{ s.text }}

{% endfor %}
