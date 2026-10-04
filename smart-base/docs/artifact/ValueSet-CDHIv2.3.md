---
title: "Digital Health Interventions for Health Management and Support Personnel — WHO SMART Base artefact"
description: "ValueSet/CDHIv2.3 in the WHO SMART Base IG, with its canonical URL, published representations and DAK API sidecars."
nav_exclude: true
ig_api_openapi: {"src":"../fhir-artifact-index/dak/ValueSet-CDHIv2.3.openapi.json","script":"../assets/ig-api-openapi.js"}
---
<link rel="stylesheet" href="{{ '/smart-base/assets/ig-pages.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/smart-base/assets/ig-chrome.css' | relative_url }}">

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/base">smart.who.int.base</a></div>
  <div id="ig-status">
    <p><span class="st-ig-title">WHO SMART Base</span><br/><span>0.3.0</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/base">http://smart.who.int/base</a>.</p>
</div>

[← all 225 artefacts](../)

## Digital Health Interventions for Health Management and Support Personnel

`ValueSet/CDHIv2.3`

Digital Health Interventions whose primary user group is Health Management and Support Personnel. Group 3 of the Classification of Digital Interventions, Services and Applications in Health v2 (CDISAH, 2023).

<div class="st-grid"><div class="st-stat"><b>ValueSet</b><span>resource type</span></div><div class="st-stat"><b>0.3.0</b><span>version</span></div><div class="st-stat"><b>Terminology: Value Sets</b><span>category</span></div><div class="st-stat"><b>176</b><span>codes</span></div></div>

## Identity and bytes are different questions

| | |
|---|---|
| Canonical URL | `http://smart.who.int/base/ValueSet/CDHIv2.3` |
| Published | <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.3.json">json</a> · <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.3.xml">xml</a> · <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.3.ttl">ttl</a> · <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.3.html">html</a> |
| Materialization | <span class="st-tag st-held">materialized</span> — working copy, regenerable by re-running the ingest |

## DAK API

The four sidecars are published independently, so an absent one is a fact about the
IG rather than a gap in this index.

| Sidecar | Published at | Held locally |
|---|---|---|
| JSON Schema | <https://worldhealthorganization.github.io/smart-base/schemas/ValueSet-CDHIv2.3.schema.json> | `fhir-artifact-index/dak/ValueSet-CDHIv2.3.schema.json` · [view](ValueSet-CDHIv2.3.schema.json.html) |
| Displays | <https://worldhealthorganization.github.io/smart-base/schemas/ValueSet-CDHIv2.3.displays.json> | `fhir-artifact-index/dak/ValueSet-CDHIv2.3.displays.json` |
| OpenAPI | <https://worldhealthorganization.github.io/smart-base/schemas/ValueSet-CDHIv2.3.openapi.json> | `fhir-artifact-index/dak/ValueSet-CDHIv2.3.openapi.json` |
| JSON-LD | <https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.3.jsonld> | `fhir-artifact-index/dak/ValueSet-CDHIv2.3.jsonld` · [view](ValueSet-CDHIv2.3.jsonld.html) |


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

<footer id="ig-footer" data-prev="ValueSet-CDHIv2.2.html" data-next="ValueSet-CDHIv2.4.html" class="st-ig"></footer>
<script src="{{ '/smart-base/assets/ig-footer.js' | relative_url }}" defer></script>
