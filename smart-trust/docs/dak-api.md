---
title: "DAK API Documentation Hub"
description: "The WHO SMART Trust IG's DAK API hub: its logical models, ValueSet schemas, JSON-LD vocabularies and enumeration endpoints."
nav_exclude: true
hub: {"src":"fhir-artifact-index/dak/dak-api-hub.json","published":"https://litlfred.github.io/smart-trust/dak-api.html","links":{"openapi/index.html":"https://litlfred.github.io/smart-trust/openapi/index.html","StructureDefinition-COSEHeader.html":"artifact/StructureDefinition-COSEHeader.html","StructureDefinition-COSEHeader.schema.json":"fhir-artifact-index/dak/StructureDefinition-COSEHeader.schema.json","StructureDefinition-COSEHeader.openapi.json":"fhir-artifact-index/dak/StructureDefinition-COSEHeader.openapi.json","StructureDefinition-SchemeInformation.html":"artifact/StructureDefinition-SchemeInformation.html","StructureDefinition-SchemeInformation.schema.json":"fhir-artifact-index/dak/StructureDefinition-SchemeInformation.schema.json","StructureDefinition-SchemeInformation.openapi.json":"fhir-artifact-index/dak/StructureDefinition-SchemeInformation.openapi.json","StructureDefinition-HCert.html":"artifact/StructureDefinition-HCert.html","StructureDefinition-HCert.schema.json":"fhir-artifact-index/dak/StructureDefinition-HCert.schema.json","StructureDefinition-HCert.openapi.json":"fhir-artifact-index/dak/StructureDefinition-HCert.openapi.json","LogicalModels.html":"https://litlfred.github.io/smart-trust/LogicalModels.html","LogicalModels.schema.json":"https://litlfred.github.io/smart-trust/LogicalModels.schema.json","LogicalModels.openapi.json":"https://litlfred.github.io/smart-trust/LogicalModels.openapi.json","StructureDefinition-CWTPayload.html":"artifact/StructureDefinition-CWTPayload.html","StructureDefinition-CWTPayload.schema.json":"fhir-artifact-index/dak/StructureDefinition-CWTPayload.schema.json","StructureDefinition-CWTPayload.openapi.json":"fhir-artifact-index/dak/StructureDefinition-CWTPayload.openapi.json","StructureDefinition-CWT.html":"artifact/StructureDefinition-CWT.html","StructureDefinition-CWT.schema.json":"fhir-artifact-index/dak/StructureDefinition-CWT.schema.json","StructureDefinition-CWT.openapi.json":"fhir-artifact-index/dak/StructureDefinition-CWT.openapi.json","ValueSets-enumeration.html":"https://litlfred.github.io/smart-trust/ValueSets-enumeration.html","ValueSet-KeyUsage-UAT.schema.json":"fhir-artifact-index/dak/ValueSet-KeyUsage-UAT.schema.json","ValueSet-KeyUsage-UAT.jsonld":"fhir-artifact-index/dak/ValueSet-KeyUsage-UAT.jsonld","ValueSet-KeyUsage.schema.json":"fhir-artifact-index/dak/ValueSet-KeyUsage.schema.json","ValueSet-KeyUsage.jsonld":"fhir-artifact-index/dak/ValueSet-KeyUsage.jsonld","ValueSet-WHORegionalOffices.schema.json":"fhir-artifact-index/dak/ValueSet-WHORegionalOffices.schema.json","ValueSet-WHORegionalOffices.jsonld":"fhir-artifact-index/dak/ValueSet-WHORegionalOffices.jsonld","ValueSet-PayloadTypes.schema.json":"fhir-artifact-index/dak/ValueSet-PayloadTypes.schema.json","ValueSet-PayloadTypes.jsonld":"fhir-artifact-index/dak/ValueSet-PayloadTypes.jsonld","ValueSet-Domains-DEV.schema.json":"fhir-artifact-index/dak/ValueSet-Domains-DEV.schema.json","ValueSet-Domains-DEV.jsonld":"fhir-artifact-index/dak/ValueSet-Domains-DEV.jsonld","ValueSet-ConnectionTypes.schema.json":"fhir-artifact-index/dak/ValueSet-ConnectionTypes.schema.json","ValueSet-ConnectionTypes.jsonld":"fhir-artifact-index/dak/ValueSet-ConnectionTypes.jsonld","ValueSet-Domains.schema.json":"fhir-artifact-index/dak/ValueSet-Domains.schema.json","ValueSet-Domains.jsonld":"fhir-artifact-index/dak/ValueSet-Domains.jsonld","ValueSet-Actors.schema.json":"fhir-artifact-index/dak/ValueSet-Actors.schema.json","ValueSet-Actors.jsonld":"fhir-artifact-index/dak/ValueSet-Actors.jsonld","ValueSet-Participants-UAT.schema.json":"fhir-artifact-index/dak/ValueSet-Participants-UAT.schema.json","ValueSet-Participants-UAT.jsonld":"fhir-artifact-index/dak/ValueSet-Participants-UAT.jsonld","ValueSet-Participants.schema.json":"fhir-artifact-index/dak/ValueSet-Participants.schema.json","ValueSet-Participants.jsonld":"fhir-artifact-index/dak/ValueSet-Participants.jsonld","ValueSets.schema.json":"https://litlfred.github.io/smart-trust/ValueSets.schema.json","ValueSet-Domains-UAT.schema.json":"fhir-artifact-index/dak/ValueSet-Domains-UAT.schema.json","ValueSet-Domains-UAT.jsonld":"fhir-artifact-index/dak/ValueSet-Domains-UAT.jsonld","ValueSet-Participants-DEV.schema.json":"fhir-artifact-index/dak/ValueSet-Participants-DEV.schema.json","ValueSet-Participants-DEV.jsonld":"fhir-artifact-index/dak/ValueSet-Participants-DEV.jsonld","ValueSet-Transactions.schema.json":"fhir-artifact-index/dak/ValueSet-Transactions.schema.json","ValueSet-Transactions.jsonld":"fhir-artifact-index/dak/ValueSet-Transactions.jsonld","ValueSet-KeyUsage-DEV.schema.json":"fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.schema.json","ValueSet-KeyUsage-DEV.jsonld":"fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.jsonld","LogicalModels-enumeration.html":"https://litlfred.github.io/smart-trust/LogicalModels-enumeration.html"},"script":"assets/dak-hub.js"}
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

{% comment %}
The IG's DAK API hub page, a replica of the Publisher's `dak-api.html`, rendered by Jekyll.
Reads `page.hub`, every field written by `gen-ig-pages.ts`: `src` (the hub fragment in the served
artefact-index graph), `published` (the page it was read from), `links` (each of the fragment's
hrefs mapped to this site's page, the served file, or the Publisher's copy) and `script` (the loader).
The hub's text is NOT in the page: `dak-hub.js` fetches the fragment, as `visualizer-loading` requires.
No whitespace control on these tags: the IG site also drops this template into its own `dak-api` page
at the post-processing marker, mid-page, where a stripping tag would glue the host onto the line before.
{% endcomment %}
<style>
/* just-the-docs sets h4 in uppercase; the Publisher's theme does not, and the hub's card titles are
   h4 — so "COSE Headers (DRAFT)" read "COSE HEADERS (DRAFT)". Scoped to the hub, so the theme is untouched. */
.dak-api-hub-host h4 { text-transform: none; }
</style>
<div class="dak-api-hub-host" data-dak-hub-src="{{ page.hub.src }}"><p>Loading the DAK API hub…</p></div>
<script type="application/json" id="dak-hub-links">{{ page.hub.links | jsonify }}</script>
<noscript><p>This page needs JavaScript; the <a href="{{ page.hub.src }}">hub fragment</a> and the <a href="{{ page.hub.published }}">published page</a> do not.</p></noscript>
<script src="{{ page.hub.script }}" defer></script>

Read from [the IG's published `dak-api.html`]({{ page.hub.published }}).
