---
title: "WHO GDHCN Actor ValueSet of actor codes — JSON Schema"
description: "The JSON Schema sidecar of ValueSet/Actors, from the IG's DAK API."
nav_exclude: true
dak: {"label":"JSON Schema","file":"ValueSet-Actors.schema.json","artifact":{"title":"WHO GDHCN Actor ValueSet of actor codes","page":"ValueSet-Actors.html"},"tabs":[{"label":"Narrative Content","href":"ValueSet-Actors.html","active":false},{"label":"XML","href":"https://litlfred.github.io/smart-trust/ValueSet-Actors.xml","active":false},{"label":"JSON","href":"https://litlfred.github.io/smart-trust/ValueSet-Actors.json","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/ValueSet-Actors.ttl","active":false},{"label":"JSON Schema","href":"ValueSet-Actors.schema.json.html","active":true},{"label":"JSON-LD","href":"ValueSet-Actors.jsonld.html","active":false}],"text":"{\n  \"$schema\": \"https://json-schema.org/draft/2020-12/schema\",\n  \"$id\": \"http://smart.who.int/trust/ValueSet-Actors.schema.json\",\n  \"title\": \"WHO GDHCN Actor ValueSet of actor codes Schema\",\n  \"description\": \"JSON Schema for WHO GDHCN Actor ValueSet of actor codes ValueSet codes. Generated from FHIR expansions using IRI format.\",\n  \"type\": \"string\",\n  \"enum\": [\n    \"http://smart.who.int/trust/CodeSystem/Actors#credential-holder\",\n    \"http://smart.who.int/trust/CodeSystem/Actors#credential-issuer\",\n    \"http://smart.who.int/trust/CodeSystem/Actors#gdhcn\",\n    \"http://smart.who.int/trust/CodeSystem/Actors#TNG\",\n    \"http://smart.who.int/trust/CodeSystem/Actors#TNP\"\n  ],\n  \"narrative\": \"This schema validates IRI-formatted codes for the WHO GDHCN Actor ValueSet of actor codes ValueSet. Each enum value includes the system URI in the format {systemuri}#{code} to match JSON-LD enumeration IRIs. Display values are available at http://smart.who.int/trust/ValueSet-Actors.displays.json. For a complete listing of all ValueSets, see artifacts.html#terminology-value-sets.\",\n  \"fhir:displays\": \"http://smart.who.int/trust/ValueSet-Actors.displays.json\",\n  \"fhir:valueSet\": \"http://smart.who.int/trust/ValueSet/Actors\",\n  \"fhir:version\": \"1.8.0\",\n  \"fhir:expansionTimestamp\": \"2026-10-01T11:52:14.596305\"\n}","fence":"```"}
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
A DAK sidecar's view page, the Publisher's `<Name>.schema.json.html` or `<Name>.jsonld.html`, rendered by Jekyll.
Reads `page.dak`, every field written by `gen-smart-trust-pages.ts`:
`label` (JSON Schema | JSON-LD), `file` (the raw file, published beside this page),
`artifact.title` and `artifact.page`, `tabs[]` (`label`, `href`, `active`) in the Publisher's order,
`text` (the file as the Publisher's page displays it: `JSON.stringify(parsed, null, 2)`)
and `fence` (a backtick run longer than any inside `text`). This file only arranges them.
{%- endcomment -%}
[← {{ page.dak.artifact.title }}]({{ page.dak.artifact.page }})

{% for t in page.dak.tabs %}{% if t.active %}**{{ t.label }}**{% else %}[{{ t.label }}]({{ t.href }}){% endif %}{% unless forloop.last %} · {% endunless %}{% endfor %}

## {{ page.dak.label }}

[Raw {{ page.dak.label }}]({{ page.dak.file }}) · [Download]({{ page.dak.file }}){: download=""}

{{ page.dak.fence }}json
{{ page.dak.text }}
{{ page.dak.fence }}
