---
title: "Scheme Information — JSON Schema"
description: "The JSON Schema sidecar of StructureDefinition/SchemeInformation, from the IG's DAK API."
nav_exclude: true
dak: {"label":"JSON Schema","file":"StructureDefinition-SchemeInformation.schema.json","artifact":{"title":"Scheme Information","page":"StructureDefinition-SchemeInformation.html"},"tabs":[{"label":"Narrative Content","href":"StructureDefinition-SchemeInformation.html","active":false},{"label":"XML","href":"https://litlfred.github.io/smart-trust/StructureDefinition-SchemeInformation.xml","active":false},{"label":"JSON","href":"https://litlfred.github.io/smart-trust/StructureDefinition-SchemeInformation.json","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/StructureDefinition-SchemeInformation.ttl","active":false},{"label":"JSON Schema","href":"StructureDefinition-SchemeInformation.schema.json.html","active":true}],"text":"{\n  \"$schema\": \"https://json-schema.org/draft/2020-12/schema\",\n  \"$id\": \"http://smart.who.int/base/StructureDefinition-SchemeInformation.schema.json\",\n  \"title\": \"Scheme Information\",\n  \"description\": \"Logical Model for Information on the trusted list and its issuing scheme\",\n  \"type\": \"object\",\n  \"properties\": {\n    \"resourceType\": {\n      \"type\": \"string\",\n      \"const\": \"SchemeInformation\",\n      \"description\": \"Resource type identifier for SchemeInformation logical model\"\n    },\n    \"versionIdentifier\": {\n      \"type\": \"integer\",\n      \"description\": \"TSL version identifier (clause 5.3.1)\"\n    },\n    \"sequenceNumber\": {\n      \"type\": \"integer\",\n      \"description\": \"TSL sequence number (clause 5.3.2)\"\n    },\n    \"type\": {\n      \"type\": \"string\",\n      \"format\": \"uri\",\n      \"description\": \"TSL type (clause 5.3.3)\"\n    },\n    \"operatorName\": {\n      \"type\": \"string\",\n      \"description\": \"Scheme operator name (clause 5.3.4)\"\n    },\n    \"operatorAddress\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"description\": \"FHIR BackboneElement\"\n      },\n      \"minItems\": 1,\n      \"description\": \"Scheme operator address (clause 5.3.5)\"\n    },\n    \"id\": {\n      \"type\": \"object\",\n      \"description\": \"Unique id for the element within a resource (for internal references). This may be any string value that does not contain spaces.\"\n    },\n    \"modifierExtension\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"description\": \"FHIR Extension\"\n      },\n      \"description\": \"May be used to represent additional information that is not part of the basic definition of the element and that modifies the understanding of the element in which it is contained and/or the understanding of the containing element's descendants. Usually modifier elements provide negation or qualification. To make the use of extensions safe and managable, there is a strict set of governance applied to the definition and use of extensions. Though any implementer can define an extension, there is a set of requirements that SHALL be met as part of the definition of the extension. Applications processing a resource are required to check for modifier extensions.\\n\\nModifier extensions SHALL NOT change the meaning of any elements on Resource or DomainResource (including cannot change the meaning of modifierExtension itself).\"\n    },\n    \"operatorPostalAddress\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\"\n      },\n      \"minItems\": 1,\n      \"description\": \"Scheme Operator Postal Address\"\n    },\n    \"operatorElectronicAddress\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\"\n      },\n      \"description\": \"Scheme Operator Electronic Address\"\n    },\n    \"name\": {\n      \"type\": \"string\",\n      \"description\": \"Scheme name (clause 5.3.6) CC:EN_name_value\"\n    },\n    \"informationURI\": {\n      \"type\": \"string\",\n      \"format\": \"uri\",\n      \"description\": \"Scheme information URI (clause 5.3.7)\"\n    },\n    \"statusDeterminiationApproach\": {\n      \"type\": \"string\",\n      \"format\": \"uri\",\n      \"description\": \"Status determination approach (clause 5.3.8)\"\n    },\n    \"schemeType\": {\n      \"type\": \"string\",\n      \"format\": \"uri\",\n      \"description\": \"Scheme type/community/rules (clause 5.3.9)\"\n    },\n    \"territory\": {\n      \"type\": \"string\",\n      \"description\": \"Scheme territory (clause 5.3.10)\"\n    },\n    \"policy\": {\n      \"type\": \"string\",\n      \"format\": \"uri\",\n      \"description\": \"TSL policy/legal notice (clause 5.3.11)\"\n    },\n    \"historicalInformationPeriod\": {\n      \"type\": \"integer\",\n      \"description\": \"Historical information period (clause 5.3.12)\"\n    },\n    \"otherTSL\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      },\n      \"description\": \"Pointers to other TSLs (clause 5.3.13)\"\n    },\n    \"issDateTime\": {\n      \"type\": \"string\",\n      \"format\": \"date-time\",\n      \"description\": \"List issue date and time (clause 5.3.14)\"\n    },\n    \"nextUpdate\": {\n      \"type\": \"string\",\n      \"format\": \"date-time\",\n      \"description\": \"Next update (clause 5.3.15)\"\n    },\n    \"distributionPoints\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\",\n        \"format\": \"uri\"\n      },\n      \"description\": \"Distribution points (clause 5.3.16)\"\n    }\n  },\n  \"required\": [\n    \"resourceType\",\n    \"versionIdentifier\",\n    \"sequenceNumber\",\n    \"type\",\n    \"operatorName\",\n    \"operatorAddress\",\n    \"operatorPostalAddress\",\n    \"name\",\n    \"informationURI\",\n    \"statusDeterminiationApproach\",\n    \"schemeType\",\n    \"territory\",\n    \"policy\",\n    \"historicalInformationPeriod\",\n    \"issDateTime\",\n    \"nextUpdate\"\n  ],\n  \"resourceDefinition\": \"http://smart.who.int/trust/StructureDefinition/SchemeInformation\",\n  \"fhir:parent\": \"http://hl7.org/fhir/StructureDefinition/Base\"\n}","fence":"```"}
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
