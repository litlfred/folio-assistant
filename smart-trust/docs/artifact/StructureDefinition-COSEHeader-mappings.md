---
title: "COSE Headers (DRAFT) — mappings"
description: "Logical Model: COSEHeader - Mappings."
nav_exclude: true
mappings: {"tabs":[{"label":"Content","href":"StructureDefinition-COSEHeader.html","active":false},{"label":"Detailed Descriptions","href":"https://litlfred.github.io/smart-trust/StructureDefinition-COSEHeader-definitions.html","active":false},{"label":"Mappings","href":"StructureDefinition-COSEHeader-mappings.html","active":true},{"label":"XML","href":"https://litlfred.github.io/smart-trust/StructureDefinition-COSEHeader.xml","active":false},{"label":"JSON","href":"StructureDefinition-COSEHeader.profile.json.html","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/StructureDefinition-COSEHeader.ttl","active":false},{"label":"JSON Schema","href":"StructureDefinition-COSEHeader.schema.json.html","active":false}],"heading":"Logical Model: COSEHeader - Mappings","status":"Active as of 2026-10-01","intro":"Mappings for the COSEHeader logical model.","inIg":[],"toOther":[],"other":[{"name":"RIM Mapping","uri":"http://hl7.org/v3","rows":[{"label":"COSEHeader","depth":0,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-COSEHeader-definitions.html#COSEHeader","title":"COSE Headers (DRAFT)","value":"n/a"},{"label":"1","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-COSEHeader-definitions.html#COSEHeader.1","title":"Encryption Algorithm","value":""},{"label":"4","depth":1,"href":"https://litlfred.github.io/smart-trust/StructureDefinition-COSEHeader-definitions.html#COSEHeader.4","title":"Key ID used to verify the signature of the certificate","value":""}]}],"legend":"https://build.fhir.org/ig/FHIR/ig-guidance/readingIgs.html#table-views"}
---
<style>
.st-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.75rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.st-held{color:#0d6e5e}
.st-ref{color:#6b5b95}
.st-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.st-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.st-stat b{display:block;font-size:1.25rem;line-height:1.2}
.st-stat span{font-size:.75rem;opacity:.75}

.st-ig {
  --breadcrumb-bg-color: #f5f5f5;
  --breadcrumb-text-color: ##555555; /* shape conflict — see chrome.json */
  --btn-active-color: #0078d4;
  --btn-gradient-end-color: #357ebd;
  --btn-gradient-end-color-alpha: #ff357ebd;
  --btn-gradient-start-color: #428bca;
  --btn-gradient-start-color-alpha: #ff428bca;
  --btn-hover-color: #0070A1;
  --btn-text-color: #e6e6e6;
  --display-todo: none;
  --dragon-background-color: #fffbf7;
  --dragon-text-color: #101020;
  --footer-bg-color: #505050;
  --footer-container-bg-color: #00477d;
  --footer-highlight-text-color: #ffff77;
  --footer-hyperlink-text-color: #81BEF7;
  --footer-nav-bg-color: #f5f5f5;
  --footer-text-color: #ffffff;
  --ig-header-color: #f6f7f9;
  --ig-header-container-color: #ffffff;
  --ig-status-text-color: #00376d;
  --link-color: #428bca;
  --link-hover-color: #2a6496;
  --may-color: #00004d;
  --must-color: #4d0000;
  --navbar-bg-color: #00477d;
  --publish-box-bg-color: yellow;
  --publish-box-border: 1px solid #0A0008;
  --should-color: #4d4000;
  --showtodo: "off";
  --stripe-bg-color: #999999;
  --stu-note-background-color: #fff2ff;
  --stu-note-border-left-color: #ffa0ff;
  --toc-box-bg-color: #f6f7f9;
  --toc-box-border: navy; /* shape conflict — see chrome.json */
}

.st-ig #ig-status.ig-status-draft {
  background-image: url("data:image/svg+xml;
  http: //www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 50) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>DRAFT</text></svg>");
  background-size: calc(50% / 5) 100px;
  background-repeat: repeat-x;
}

.st-ig #ig-status.ig-status-retired {
  background-image: url("data:image/svg+xml;
  http: //www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 60) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>RETIRED</text></svg>");
  background-size: calc(50% / 5) 100px;
  background-repeat: repeat-x;
}

.st-ig #ig-status p {
  background-color: white;
  padding: 10px 17px;
  border-radius: 5px;
  position: relative;
  z-index: 2;
}

.st-ig #publish-box {
  background-color: var(--publish-box-bg-color);
  border: var(--publish-box-border);
  padding: 5px;
}
.st-ig .st-ig-bar{background:var(--navbar-bg-color);padding:.5rem .8rem;border-radius:4px 4px 0 0}
.st-ig .st-ig-bar a{color:#fff;font-weight:600;text-decoration:none}
.st-ig .st-ig-title{font-size:12pt;font-weight:bold;color:var(--ig-status-text-color)}
</style>

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
