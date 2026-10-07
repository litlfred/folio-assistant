---
title: "CBOR Web Token (CWT) Payload (Common) — mappings"
description: "Logical Model: CWTPayload - Mappings."
nav_exclude: true
mappings: {"tabs":[{"label":"Content","href":"StructureDefinition-CWTPayload.html","active":false},{"label":"Detailed Descriptions","href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload-definitions.html","active":false},{"label":"Mappings","href":"StructureDefinition-CWTPayload-mappings.html","active":true},{"label":"XML","href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload.xml","active":false},{"label":"JSON","href":"StructureDefinition-CWTPayload.profile.json.html","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload.ttl","active":false},{"label":"JSON Schema","href":"StructureDefinition-CWTPayload.schema.json.html","active":false}],"heading":"Logical Model: CWTPayload - Mappings","status":"Active as of 2026-10-01","intro":"Mappings for the CWTPayload logical model.","inIg":[],"toOther":[],"other":[{"name":"RIM Mapping","uri":"http://hl7.org/v3","rows":[{"label":"CWTPayload","depth":0,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload-definitions.html#CWTPayload","title":"CBOR Web Token (CWT) Payload (Common)","value":"n/a"},{"label":"1","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload-definitions.html#CWTPayload.1","title":"Issuer Code (iss)","value":""},{"label":"4","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload-definitions.html#CWTPayload.4","title":"Expiration Date Time(exp)","value":""},{"label":"6","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload-definitions.html#CWTPayload.6","title":"Issued At (iat)","value":""},{"label":"-260","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWTPayload-definitions.html#CWTPayload.-260","title":"Health Certificate","value":""}]}],"legend":"https://build.fhir.org/ig/FHIR/ig-guidance/readingIgs.html#table-views"}
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
A logical model's mappings page, the Publisher's `<Name>-mappings.html`, rendered by Jekyll.
Reads `page.mappings`, every field written by `gen-ig-pages.ts` (`resource-views.ts` `mappingsPage`):
`tabs[]`, `heading`, `status`, `intro`, then `inIg[]`, `toOther[]` and `other[]` — each a table
(`name`, `uri`, `rows[]` of `label`, `depth`, `href`, `title`, `value`) — and `legend`. Labels and
values are markdown-escaped by the generator; an empty section prints the Publisher's "No Mappings Found".
{%- endcomment -%}
{% for t in page.mappings.tabs %}{% if t.active %}**{{ t.label }}**{% else %}[{{ t.label }}]({{ t.href }}){% endif %}{% unless forloop.last %} · {% endunless %}{% endfor %}

## {{ page.mappings.heading }}

{% if page.mappings.status %}{{ page.mappings.status }}

{% endif %}{{ page.mappings.intro }}

### Mappings to Structures in this Implementation Guide

{% if page.mappings.inIg.size == 0 %}No Mappings Found
{% endif %}
### Mappings to other Structures

{% if page.mappings.toOther.size == 0 %}No Mappings Found
{% endif %}
### Other Mappings
{% for m in page.mappings.other %}
| Name | {% if m.uri %}[{{ m.name }}]({{ m.uri }}){% else %}{{ m.name }}{% endif %} |
|---|---|
{% for r in m.rows %}| [{{ r.label }}]({{ r.href }}) | {{ r.value }} |
{% endfor %}{% endfor %}
[Documentation for this format]({{ page.mappings.legend }})
