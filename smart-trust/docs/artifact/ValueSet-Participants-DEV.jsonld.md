---
title: "WHO GDHCN Trust Network Participant - DEV — JSON-LD"
description: "The JSON-LD sidecar of ValueSet/Participants-DEV, from the IG's DAK API."
nav_exclude: true
dak: {"label":"JSON-LD","file":"ValueSet-Participants-DEV.jsonld","artifact":{"title":"WHO GDHCN Trust Network Participant - DEV","page":"ValueSet-Participants-DEV.html"},"tabs":[{"label":"Narrative Content","href":"ValueSet-Participants-DEV.html","active":false},{"label":"XML","href":"https://litlfred.github.io/smart-trust/ValueSet-Participants-DEV.xml","active":false},{"label":"JSON","href":"https://litlfred.github.io/smart-trust/ValueSet-Participants-DEV.json","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/ValueSet-Participants-DEV.ttl","active":false},{"label":"JSON Schema","href":"ValueSet-Participants-DEV.schema.json.html","active":false},{"label":"JSON-LD","href":"ValueSet-Participants-DEV.jsonld.html","active":true}],"text":"{\n  \"@context\": {\n    \"@version\": 1.1,\n    \"@base\": \"http://smart.who.int/trust/ValueSet-Participants-DEV.jsonld\",\n    \"name\": \"http://www.w3.org/2000/01/rdf-schema#label\",\n    \"fhir\": \"https://smart.who.int/base/DataTypes.jsonld#\",\n    \"id\": \"@id\",\n    \"generatedAt\": {\n      \"@id\": \"http://www.w3.org/ns/prov#generatedAtTime\",\n      \"@type\": \"http://www.w3.org/2001/XMLSchema#dateTime\"\n    },\n    \"fhir:CodeSystem\": {\n      \"@type\": \"@id\"\n    },\n    \"cs0\": \"http://smart.who.int/trust/CodeSystems/Participants-DEV\",\n    \"cs1\": \"http://smart.who.int/refmart/CodeSystems/REF_COUNTRY\"\n  },\n  \"@id\": \"http://smart.who.int/trust/ValueSet-Participants-DEV.jsonld\",\n  \"@type\": \"http://www.w3.org/ns/prov#Entity\",\n  \"generatedAt\": \"2026-10-01T11:53:49.746239Z\",\n  \"@graph\": [\n    {\n      \"id\": \"#IOM\",\n      \"name\": \"TEST\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#WHO\",\n      \"name\": \"DEV Participant WHO\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XCL\",\n      \"name\": \"California\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XML\",\n      \"name\": \"GDHCN entomo\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXA\",\n      \"name\": \"Geneva\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXB\",\n      \"name\": \"TEST\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXC\",\n      \"name\": \"TEST\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXD\",\n      \"name\": \"CENS XD\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXE\",\n      \"name\": \"Geneva XE\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXF\",\n      \"name\": \"Test Locality XF\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXG\",\n      \"name\": \"Geneva\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXH\",\n      \"name\": \"Geneva\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXI\",\n      \"name\": \"California\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXJ\",\n      \"name\": \"DEV Participant XXJ\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXK\",\n      \"name\": \"Rengo\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXN\",\n      \"name\": \"DEV Participant XXN\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXO\",\n      \"name\": \"DEV Participant XXO\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXP\",\n      \"name\": \"Geneva\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXQ\",\n      \"name\": \"Test Locality\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXT\",\n      \"name\": \"Geneva\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXU\",\n      \"name\": \"Geneva\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXV\",\n      \"name\": \"TEST CITY\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXW\",\n      \"name\": \"Test Locality\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XXX\",\n      \"name\": \"Warrandyte\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#XYK\",\n      \"name\": \"Test\",\n      \"fhir:CodeSystem\": \"cs0\"\n    },\n    {\n      \"id\": \"#AND\",\n      \"name\": \"Andorra\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#ARE\",\n      \"name\": \"United Arab Emirates\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#ARG\",\n      \"name\": \"Argentina\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#ARM\",\n      \"name\": \"Armenia\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#BHS\",\n      \"name\": \"Bahamas\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#BLZ\",\n      \"name\": \"Belize\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#BOL\",\n      \"name\": \"Bolivia (Plurinational State of)\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#BRA\",\n      \"name\": \"Brazil\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#BRB\",\n      \"name\": \"Barbados\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#CHL\",\n      \"name\": \"Chile\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#COL\",\n      \"name\": \"Colombia\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#CRI\",\n      \"name\": \"Costa Rica\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#CYP\",\n      \"name\": \"Cyprus\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#DOM\",\n      \"name\": \"Dominican Republic\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#ECU\",\n      \"name\": \"Ecuador\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#EST\",\n      \"name\": \"Estonia\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#GTM\",\n      \"name\": \"Guatemala\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#HND\",\n      \"name\": \"Honduras\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#IDN\",\n      \"name\": \"Indonesia\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#JAM\",\n      \"name\": \"Jamaica\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#LVA\",\n      \"name\": \"Latvia\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#NIC\",\n      \"name\": \"Nicaragua\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#OMN\",\n      \"name\": \"Oman\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#PAN\",\n      \"name\": \"Panama\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#PER\",\n      \"name\": \"Peru\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#PRY\",\n      \"name\": \"Paraguay\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#SGP\",\n      \"name\": \"Singapore\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#SLV\",\n      \"name\": \"El Salvador\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#SMR\",\n      \"name\": \"San Marino\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#SUR\",\n      \"name\": \"Suriname\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#SVN\",\n      \"name\": \"Slovenia\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#TGO\",\n      \"name\": \"Togo\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#TTO\",\n      \"name\": \"Trinidad and Tobago\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#URY\",\n      \"name\": \"Uruguay\",\n      \"fhir:CodeSystem\": \"cs1\"\n    },\n    {\n      \"id\": \"#USA\",\n      \"name\": \"United States of America\",\n      \"fhir:CodeSystem\": \"cs1\"\n    }\n  ]\n}","fence":"```"}
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
