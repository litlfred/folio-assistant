---
title: "Health Certificate — examples"
description: "Logical Model: HCert - Examples."
nav_exclude: true
tab_page: {"tabs":[{"label":"Content","href":"StructureDefinition-HCert.html","active":false},{"label":"Detailed Descriptions","href":"https://litlfred.github.io/smart-trust/StructureDefinition-HCert-definitions.html","active":false},{"label":"Mappings","href":"StructureDefinition-HCert-mappings.html","active":false},{"label":"XML","href":"https://litlfred.github.io/smart-trust/StructureDefinition-HCert.xml","active":false},{"label":"JSON","href":"StructureDefinition-HCert.profile.json.html","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/StructureDefinition-HCert.ttl","active":false},{"label":"JSON Schema","href":"StructureDefinition-HCert.schema.json.html","active":false}],"heading":"Logical Model: HCert - Examples","status":"Active as of 2026-10-01","sections":[{"text":"No examples are currently available for the Profile."}]}
---
<link rel="stylesheet" href="{{ '/smart-trust/assets/ig-pages.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/smart-trust/assets/ig-chrome.css' | relative_url }}">

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
