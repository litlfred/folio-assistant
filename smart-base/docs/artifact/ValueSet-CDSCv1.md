---
title: "Health System Challenges — WHO SMART Base artefact"
description: "ValueSet/CDSCv1 in the WHO SMART Base IG, with its canonical URL, published representations and DAK API sidecars."
nav_exclude: true
ig_api_openapi: {"src":"../fhir-artifact-index/dak/ValueSet-CDSCv1.openapi.json","script":"../assets/ig-api-openapi.js"}
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

## Health System Challenges

`ValueSet/CDSCv1`

Value set for Health System Challenges (Classification of Digital Health System Categories v1, 2018). Includes all 25 system category codes (A–Y).

<div class="st-grid"><div class="st-stat"><b>ValueSet</b><span>resource type</span></div><div class="st-stat"><b>0.3.0</b><span>version</span></div><div class="st-stat"><b>Terminology: Value Sets</b><span>category</span></div><div class="st-stat"><b>25</b><span>codes</span></div></div>

## Identity and bytes are different questions

| | |
|---|---|
| Canonical URL | `http://smart.who.int/base/ValueSet/CDSCv1` |
| Published | <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDSCv1.json">json</a> · <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDSCv1.xml">xml</a> · <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDSCv1.ttl">ttl</a> · <a href="https://worldhealthorganization.github.io/smart-base/ValueSet-CDSCv1.html">html</a> |
| Materialization | <span class="st-tag st-held">materialized</span> — working copy, regenerable by re-running the ingest |

## DAK API

The four sidecars are published independently, so an absent one is a fact about the
IG rather than a gap in this index.

| Sidecar | Published at | Held locally |
|---|---|---|
| JSON Schema | <https://worldhealthorganization.github.io/smart-base/schemas/ValueSet-CDSCv1.schema.json> | `fhir-artifact-index/dak/ValueSet-CDSCv1.schema.json` · [view](ValueSet-CDSCv1.schema.json.html) |
| Displays | <https://worldhealthorganization.github.io/smart-base/schemas/ValueSet-CDSCv1.displays.json> | `fhir-artifact-index/dak/ValueSet-CDSCv1.displays.json` |
| OpenAPI | <https://worldhealthorganization.github.io/smart-base/schemas/ValueSet-CDSCv1.openapi.json> | `fhir-artifact-index/dak/ValueSet-CDSCv1.openapi.json` |
| JSON-LD | <https://worldhealthorganization.github.io/smart-base/ValueSet-CDSCv1.jsonld> | `fhir-artifact-index/dak/ValueSet-CDSCv1.jsonld` · [view](ValueSet-CDSCv1.jsonld.html) |


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
