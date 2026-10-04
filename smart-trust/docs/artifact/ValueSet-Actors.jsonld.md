---
title: "WHO GDHCN Actor ValueSet of actor codes — JSON-LD"
description: "The JSON-LD sidecar of ValueSet/Actors, from the IG's DAK API."
nav_exclude: true
ig_api: {"label":"JSON-LD","file":"ValueSet-Actors.jsonld","src":"../fhir-artifact-index/dak/ValueSet-Actors.jsonld","artifact":{"title":"WHO GDHCN Actor ValueSet of actor codes","page":"ValueSet-Actors.html"},"tabs":[{"label":"Narrative Content","href":"ValueSet-Actors.html","active":false},{"label":"XML","href":"https://litlfred.github.io/smart-trust/ValueSet-Actors.xml","active":false},{"label":"JSON","href":"ValueSet-Actors.json.html","active":false},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/ValueSet-Actors.ttl","active":false},{"label":"JSON Schema","href":"ValueSet-Actors.schema.json.html","active":false},{"label":"JSON-LD","href":"ValueSet-Actors.jsonld.html","active":true}],"script":"../assets/ig-api-view.js"}
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

<footer id="ig-footer" class="st-ig"></footer>
<script src="{{ '/smart-trust/assets/ig-footer.js' | relative_url }}" defer></script>
