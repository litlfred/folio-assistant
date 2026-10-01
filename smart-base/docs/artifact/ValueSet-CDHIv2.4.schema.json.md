---
title: "Digital Health Interventions: Data Services — JSON Schema"
description: "The JSON Schema sidecar of ValueSet/CDHIv2.4, from the IG's DAK API."
nav_exclude: true
dak: {"label":"JSON Schema","file":"ValueSet-CDHIv2.4.schema.json","src":"../fhir-artifact-index/dak/ValueSet-CDHIv2.4.schema.json","artifact":{"title":"Digital Health Interventions: Data Services","page":"ValueSet-CDHIv2.4.html"},"tabs":[{"label":"Narrative Content","href":"ValueSet-CDHIv2.4.html","active":false},{"label":"XML","href":"https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.4.xml","active":false},{"label":"JSON","href":"https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.4.json","active":false},{"label":"TTL","href":"https://worldhealthorganization.github.io/smart-base/ValueSet-CDHIv2.4.ttl","active":false},{"label":"JSON Schema","href":"ValueSet-CDHIv2.4.schema.json.html","active":true},{"label":"JSON-LD","href":"ValueSet-CDHIv2.4.jsonld.html","active":false}],"script":"../assets/dak-view.js"}
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

{%- comment -%}
A DAK sidecar's view page, the Publisher's `<Name>.schema.json.html` or `<Name>.jsonld.html`, rendered by Jekyll.
Reads `page.dak`, every field written by `gen-smart-trust-pages.ts`:
`label` (JSON Schema | JSON-LD), `file` (the file's name), `src` (where it is served, in the artefact-index graph),
`artifact.title` and `artifact.page`, `tabs[]` (`label`, `href`, `active`) in the Publisher's order,
and `script` (the shared loader's path). The file's text is NOT in the page: `dak-view.js` fetches
it in the browser, as the Publisher's page does (bean `680p`). This file only arranges.
{%- endcomment -%}
[← {{ page.dak.artifact.title }}]({{ page.dak.artifact.page }})

{% for t in page.dak.tabs %}{% if t.active %}**{{ t.label }}**{% else %}[{{ t.label }}]({{ t.href }}){% endif %}{% unless forloop.last %} · {% endunless %}{% endfor %}

## {{ page.dak.label }}

[Raw {{ page.dak.label }}]({{ page.dak.src }}) · [Download]({{ page.dak.src }}){: download="{{ page.dak.file }}"}

<pre><code class="language-json" data-dak-src="{{ page.dak.src }}">Loading…</code></pre>
<noscript><p>This view needs JavaScript; the <a href="{{ page.dak.src }}">raw file</a> does not.</p></noscript>
<script src="{{ page.dak.script }}" defer></script>
