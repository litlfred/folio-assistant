---
title: "Functional Requirement (DAK) — JSON Schema"
description: "The JSON Schema sidecar of StructureDefinition/FunctionalRequirement, from the IG's DAK API."
nav_exclude: true
ig_api: {"label":"JSON Schema","file":"StructureDefinition-FunctionalRequirement.schema.json","src":"../fhir-artifact-index/dak/StructureDefinition-FunctionalRequirement.schema.json","artifact":{"title":"Functional Requirement (DAK)","page":"StructureDefinition-FunctionalRequirement.html"},"tabs":[{"label":"Narrative Content","href":"StructureDefinition-FunctionalRequirement.html","active":false},{"label":"XML","href":"https://worldhealthorganization.github.io/smart-base/StructureDefinition-FunctionalRequirement.xml","active":false},{"label":"JSON","href":"https://worldhealthorganization.github.io/smart-base/StructureDefinition-FunctionalRequirement.json","active":false},{"label":"TTL","href":"https://worldhealthorganization.github.io/smart-base/StructureDefinition-FunctionalRequirement.ttl","active":false},{"label":"JSON Schema","href":"StructureDefinition-FunctionalRequirement.schema.json.html","active":true}],"script":"../assets/ig-api-view.js"}
ig_footer: true
ig_root: "../"
---
<link rel="stylesheet" href="../assets/ig-pages.css">
<link rel="stylesheet" href="../assets/ig-chrome.css">

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/base">smart.who.int.base</a></div>
  <div id="ig-status">
    <p><span class="st-ig-title">WHO SMART Base</span><br/><span>0.3.0</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/base">http://smart.who.int/base</a>.</p>
</div>

{%- comment -%}
An IG API sidecar's view page, the Publisher's `<Name>.schema.json.html` or `<Name>.jsonld.html`, rendered by Jekyll.
Reads `page.ig_api`, every field written by `gen-ig-pages.ts`:
`label` (JSON Schema | JSON-LD), `file` (the file's name), `src` (where it is served, in the artefact-index graph),
`artifact.title` and `artifact.page`, `tabs[]` (`label`, `href`, `active`) in the Publisher's order,
and `script` (the shared loader's path). The file's text is NOT in the page: `ig-api-view.js` fetches
it in the browser, as the Publisher's page does (bean `680p`). This file only arranges.
{%- endcomment -%}
[← {{ page.ig_api.artifact.title }}]({{ page.ig_api.artifact.page }})

{% for t in page.ig_api.tabs %}{% if t.active %}**{{ t.label }}**{% else %}[{{ t.label }}]({{ t.href }}){% endif %}{% unless forloop.last %} · {% endunless %}{% endfor %}

## {{ page.ig_api.label }}

[Raw {{ page.ig_api.label }}]({{ page.ig_api.src }}) · [Download]({{ page.ig_api.src }}){: download="{{ page.ig_api.file }}"}

<pre><code class="language-json" data-ig-api-src="{{ page.ig_api.src }}">Loading…</code></pre>
<noscript><p>This view needs JavaScript; the <a href="{{ page.ig_api.src }}">raw file</a> does not.</p></noscript>
<script src="{{ page.ig_api.script }}" defer></script>
