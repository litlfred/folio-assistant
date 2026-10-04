---
title: "CBOR Web Token (CWT) Claim — mappings"
description: "Logical Model: CWT - Mappings."
nav_exclude: true
mappings: {"tabs":[{"label":"Content","href":"StructureDefinition-CWT.html","active":false},{"label":"Detailed Descriptions","href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWT-definitions.html","active":false},{"label":"Mappings","href":"StructureDefinition-CWT-mappings.html","active":true},{"label":"XML","href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWT.xml","active":false},{"label":"JSON","href":"StructureDefinition-CWT.profile.json.html","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWT.ttl","active":false},{"label":"JSON Schema","href":"StructureDefinition-CWT.schema.json.html","active":false}],"heading":"Logical Model: CWT - Mappings","status":"Active as of 2026-10-01","intro":"Mappings for the CWT logical model.","inIg":[],"toOther":[],"other":[{"name":"RIM Mapping","uri":"http://hl7.org/v3","rows":[{"label":"CWT","depth":0,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWT-definitions.html#CWT","title":"CBOR Web Token (CWT) Claim","value":"n/a"},{"label":"header","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWT-definitions.html#CWT.header","title":"COSE Header","value":""},{"label":"payload","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWT-definitions.html#CWT.payload","title":"CWT Payload","value":""},{"label":"signature","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-CWT-definitions.html#CWT.signature","title":"Signature","value":""}]}],"legend":"https://build.fhir.org/ig/FHIR/ig-guidance/readingIgs.html#table-views"}
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

<footer id="ig-footer" class="st-ig"></footer>
<script src="{{ '/smart-trust/assets/ig-footer.js' | relative_url }}" defer></script>
