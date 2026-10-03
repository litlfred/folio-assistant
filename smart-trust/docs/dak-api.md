---
title: "DAK API Documentation Hub"
description: "The WHO SMART Trust IG's DAK API hub: its logical models, ValueSet schemas, JSON-LD vocabularies and enumeration endpoints."
nav_exclude: true
hub: {"src":"fhir-artifact-index/dak/dak-api-hub.json","published":"https://litlfred.github.io/smart-trust/dak-api.html","links":{"openapi/index.html":"https://litlfred.github.io/smart-trust/openapi/index.html","StructureDefinition-COSEHeader.html":"artifact/StructureDefinition-COSEHeader.html","StructureDefinition-COSEHeader.schema.json":"fhir-artifact-index/dak/StructureDefinition-COSEHeader.schema.json","StructureDefinition-COSEHeader.openapi.json":"fhir-artifact-index/dak/StructureDefinition-COSEHeader.openapi.json","StructureDefinition-SchemeInformation.html":"artifact/StructureDefinition-SchemeInformation.html","StructureDefinition-SchemeInformation.schema.json":"fhir-artifact-index/dak/StructureDefinition-SchemeInformation.schema.json","StructureDefinition-SchemeInformation.openapi.json":"fhir-artifact-index/dak/StructureDefinition-SchemeInformation.openapi.json","StructureDefinition-HCert.html":"artifact/StructureDefinition-HCert.html","StructureDefinition-HCert.schema.json":"fhir-artifact-index/dak/StructureDefinition-HCert.schema.json","StructureDefinition-HCert.openapi.json":"fhir-artifact-index/dak/StructureDefinition-HCert.openapi.json","LogicalModels.html":"https://litlfred.github.io/smart-trust/LogicalModels.html","LogicalModels.schema.json":"https://litlfred.github.io/smart-trust/LogicalModels.schema.json","LogicalModels.openapi.json":"https://litlfred.github.io/smart-trust/LogicalModels.openapi.json","StructureDefinition-CWTPayload.html":"artifact/StructureDefinition-CWTPayload.html","StructureDefinition-CWTPayload.schema.json":"fhir-artifact-index/dak/StructureDefinition-CWTPayload.schema.json","StructureDefinition-CWTPayload.openapi.json":"fhir-artifact-index/dak/StructureDefinition-CWTPayload.openapi.json","StructureDefinition-CWT.html":"artifact/StructureDefinition-CWT.html","StructureDefinition-CWT.schema.json":"fhir-artifact-index/dak/StructureDefinition-CWT.schema.json","StructureDefinition-CWT.openapi.json":"fhir-artifact-index/dak/StructureDefinition-CWT.openapi.json","ValueSets-enumeration.html":"https://litlfred.github.io/smart-trust/ValueSets-enumeration.html","ValueSet-KeyUsage-UAT.schema.json":"fhir-artifact-index/dak/ValueSet-KeyUsage-UAT.schema.json","ValueSet-KeyUsage-UAT.jsonld":"fhir-artifact-index/dak/ValueSet-KeyUsage-UAT.jsonld","ValueSet-KeyUsage.schema.json":"fhir-artifact-index/dak/ValueSet-KeyUsage.schema.json","ValueSet-KeyUsage.jsonld":"fhir-artifact-index/dak/ValueSet-KeyUsage.jsonld","ValueSet-WHORegionalOffices.schema.json":"fhir-artifact-index/dak/ValueSet-WHORegionalOffices.schema.json","ValueSet-WHORegionalOffices.jsonld":"fhir-artifact-index/dak/ValueSet-WHORegionalOffices.jsonld","ValueSet-PayloadTypes.schema.json":"fhir-artifact-index/dak/ValueSet-PayloadTypes.schema.json","ValueSet-PayloadTypes.jsonld":"fhir-artifact-index/dak/ValueSet-PayloadTypes.jsonld","ValueSet-Domains-DEV.schema.json":"fhir-artifact-index/dak/ValueSet-Domains-DEV.schema.json","ValueSet-Domains-DEV.jsonld":"fhir-artifact-index/dak/ValueSet-Domains-DEV.jsonld","ValueSet-ConnectionTypes.schema.json":"fhir-artifact-index/dak/ValueSet-ConnectionTypes.schema.json","ValueSet-ConnectionTypes.jsonld":"fhir-artifact-index/dak/ValueSet-ConnectionTypes.jsonld","ValueSet-Domains.schema.json":"fhir-artifact-index/dak/ValueSet-Domains.schema.json","ValueSet-Domains.jsonld":"fhir-artifact-index/dak/ValueSet-Domains.jsonld","ValueSet-Actors.schema.json":"fhir-artifact-index/dak/ValueSet-Actors.schema.json","ValueSet-Actors.jsonld":"fhir-artifact-index/dak/ValueSet-Actors.jsonld","ValueSet-Participants-UAT.schema.json":"fhir-artifact-index/dak/ValueSet-Participants-UAT.schema.json","ValueSet-Participants-UAT.jsonld":"fhir-artifact-index/dak/ValueSet-Participants-UAT.jsonld","ValueSet-Participants.schema.json":"fhir-artifact-index/dak/ValueSet-Participants.schema.json","ValueSet-Participants.jsonld":"fhir-artifact-index/dak/ValueSet-Participants.jsonld","ValueSets.schema.json":"https://litlfred.github.io/smart-trust/ValueSets.schema.json","ValueSet-Domains-UAT.schema.json":"fhir-artifact-index/dak/ValueSet-Domains-UAT.schema.json","ValueSet-Domains-UAT.jsonld":"fhir-artifact-index/dak/ValueSet-Domains-UAT.jsonld","ValueSet-Participants-DEV.schema.json":"fhir-artifact-index/dak/ValueSet-Participants-DEV.schema.json","ValueSet-Participants-DEV.jsonld":"fhir-artifact-index/dak/ValueSet-Participants-DEV.jsonld","ValueSet-Transactions.schema.json":"fhir-artifact-index/dak/ValueSet-Transactions.schema.json","ValueSet-Transactions.jsonld":"fhir-artifact-index/dak/ValueSet-Transactions.jsonld","ValueSet-KeyUsage-DEV.schema.json":"fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.schema.json","ValueSet-KeyUsage-DEV.jsonld":"fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.jsonld","LogicalModels-enumeration.html":"https://litlfred.github.io/smart-trust/LogicalModels-enumeration.html"},"script":"assets/ig-api-hub.js"}
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

{% comment %}
The IG's API hub page, a replica of the hub page the Publisher's post-processing wrote, rendered by Jekyll.
Reads `page.hub`, every field written by `gen-ig-pages.ts`: `src` (the hub fragment in the served
artefact-index graph), `published` (the page it was read from), `links` (each of the fragment's
hrefs mapped to this site's page, the served file, or the Publisher's copy) and `script` (the loader).
The hub's text is NOT in the page: `ig-api-hub.js` fetches the fragment, as `visualizer-loading` requires.
No whitespace control on these tags: the IG site also drops this template into its own hub page
at the post-processing marker, mid-page, where a stripping tag would glue the host onto the line before.
{% endcomment %}
<style>
/* just-the-docs sets h4 in uppercase; the Publisher's theme does not, and the hub's card titles are
   h4 — so "COSE Headers (DRAFT)" read "COSE HEADERS (DRAFT)". Scoped to the hub, so the theme is untouched. */
.ig-api-hub-host h4 { text-transform: none; }
</style>
<div class="ig-api-hub-host" data-ig-api-hub-src="{{ page.hub.src }}"><p>Loading the API hub…</p></div>
<script type="application/json" id="ig-api-hub-links">{{ page.hub.links | jsonify }}</script>
<noscript><p>This page needs JavaScript; the <a href="{{ page.hub.src }}">hub fragment</a> and the <a href="{{ page.hub.published }}">published page</a> do not.</p></noscript>
<script src="{{ page.hub.script }}" defer></script>

Read from [the IG's published hub page]({{ page.hub.published }}).
