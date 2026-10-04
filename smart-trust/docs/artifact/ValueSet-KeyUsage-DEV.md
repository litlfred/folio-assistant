---
title: "WHO GDHCN Key Usage ValueSet - DEV — WHO SMART Trust artefact"
description: "ValueSet/KeyUsage-DEV in the WHO SMART Trust IG, with its canonical URL, published representations and DAK API sidecars."
nav_exclude: true
ig_api_openapi: {"src":"../fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.openapi.json","script":"../assets/ig-api-openapi.js"}
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

[← all 678 artefacts](../)

## WHO GDHCN Key Usage ValueSet - DEV

`ValueSet/KeyUsage-DEV`

ValueSet of codes for key usage codes for Development environment

<div class="st-grid"><div class="st-stat"><b>ValueSet</b><span>resource type</span></div><div class="st-stat"><b>1.8.0</b><span>version</span></div><div class="st-stat"><b>Terminology: Value Sets</b><span>category</span></div></div>

## Identity and bytes are different questions

| | |
|---|---|
| Canonical URL | `http://smart.who.int/trust/ValueSet/KeyUsage-DEV` |
| Published | <a href="https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.json">json</a> · <a href="https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.xml">xml</a> · <a href="https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.ttl">ttl</a> · <a href="https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.html">html</a> |
| Materialization | <span class="st-tag st-held">materialized</span> — working copy, regenerable by re-running the ingest |

## DAK API

The four sidecars are published independently, so an absent one is a fact about the
IG rather than a gap in this index.

| Sidecar | Published at | Held locally |
|---|---|---|
| JSON Schema | <https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.schema.json> | `fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.schema.json` · [view](ValueSet-KeyUsage-DEV.schema.json.html) |
| Displays | <https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.displays.json> | `fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.displays.json` |
| OpenAPI | <https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.openapi.json> | `fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.openapi.json` |
| JSON-LD | <https://litlfred.github.io/smart-trust/ValueSet-KeyUsage-DEV.jsonld> | `fhir-artifact-index/dak/ValueSet-KeyUsage-DEV.jsonld` · [view](ValueSet-KeyUsage-DEV.jsonld.html) |


{% comment %}
An artefact page's IG API section ("API Information", "Endpoints"), appended to the page by `gen-ig-pages.ts`.
Reads `page.ig_api_openapi`: `src` (the artefact's OpenAPI sidecar in the served artefact-index graph) and
`script` (the loader). The section is built in the browser by `ig-api-openapi.js` from that file, as
smart-base's post-processing builds it into the Publisher's page; nothing of it is baked in here.
No whitespace control on these tags, unlike a template that IS a page: this one is APPENDED to an
artefact page, and a whitespace-stripping opening tag ate the blank line after that page's last table row, so the
<div> became part of the row and kramdown printed it as text (`liquid-templates` §"Whitespace").
{% endcomment %}
<div class="ig-api-openapi-host" data-ig-api-openapi-src="{{ page.ig_api_openapi.src }}"><p>Loading the API information…</p></div>
<noscript><p>The API information needs JavaScript; the <a href="{{ page.ig_api_openapi.src }}">OpenAPI file</a> does not.</p></noscript>
<script src="{{ page.ig_api_openapi.script }}" defer></script>

<footer id="ig-footer" data-prev="ValueSet-KeyUsage.html" data-next="ValueSet-KeyUsage-UAT.html" class="st-ig"></footer>
<script src="{{ '/smart-trust/assets/ig-footer.js' | relative_url }}" defer></script>
