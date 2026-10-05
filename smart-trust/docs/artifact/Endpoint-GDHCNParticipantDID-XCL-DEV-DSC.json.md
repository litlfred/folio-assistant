---
title: "GDHCNParticipantDID-XCL-DEV-DSC — JSON"
description: "The JSON representation of Endpoint/GDHCNParticipantDID-XCL-DEV-DSC."
nav_exclude: true
json_view: {"heading":"GDHCNParticipantDID-XCL-DEV-DSC - JSON Representation","package":"../fhir-artifact-index/package.tgz","entry":"package/Endpoint-GDHCNParticipantDID-XCL-DEV-DSC.json","raw":"https://litlfred.github.io/smart-trust/Endpoint-GDHCNParticipantDID-XCL-DEV-DSC.json","rawName":"Endpoint-GDHCNParticipantDID-XCL-DEV-DSC.json","tabs":[{"label":"Narrative Content","href":"Endpoint-GDHCNParticipantDID-XCL-DEV-DSC.html","active":false},{"label":"XML","href":"https://litlfred.github.io/smart-trust/Endpoint-GDHCNParticipantDID-XCL-DEV-DSC.xml","active":false},{"label":"JSON","href":"Endpoint-GDHCNParticipantDID-XCL-DEV-DSC.json.html","active":true},{"label":"TTL","href":"https://litlfred.github.io/smart-trust/Endpoint-GDHCNParticipantDID-XCL-DEV-DSC.ttl","active":false}],"script":"../assets/resource-json.js"}
---
<link rel="stylesheet" href="../assets/ig-pages.css">
<link rel="stylesheet" href="../assets/ig-chrome.css">

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/trust">smart.who.int.trust</a></div>
  <div id="ig-status" class="ig-status-draft">
    <p><span class="st-ig-title">WHO SMART Trust</span><br/><span>1.8.0 — draft</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/trust">http://smart.who.int/trust</a>.</p>
</div>

{%- comment -%}
A resource's JSON view page, the Publisher's `<Name>.json.html`, rendered by Jekyll.
Reads `page.json_view`, every field written by `gen-ig-pages.ts` (`resource-views.ts`): `heading`,
`tabs[]` (`label`, `href`, `active`) in the Publisher's order, `package` and `entry` (the IG's
package.tgz in the served artefact-index graph, and the resource's file inside it), `raw` and
`rawName` (the Publisher's published .json), `intro` (optional: a logical model's one-line description) and `script`. The resource is NOT in the
page: `resource-json.js` reads it out of the package in the browser (`visualizer-loading`).
{%- endcomment -%}
{% for t in page.json_view.tabs %}{% if t.active %}**{{ t.label }}**{% else %}[{{ t.label }}]({{ t.href }}){% endif %}{% unless forloop.last %} · {% endunless %}{% endfor %}

## {{ page.json_view.heading }}

<p class="json-view-status" hidden></p>

{% if page.json_view.intro %}{{ page.json_view.intro }}

{% endif %}
[Raw json]({{ page.json_view.raw }}) · [Download]({{ page.json_view.raw }}){: download="{{ page.json_view.rawName }}"}

<pre><code class="language-json" data-package="{{ page.json_view.package }}" data-entry="{{ page.json_view.entry }}">Loading JSON source…</code></pre>
<noscript><p>This view needs JavaScript; the <a href="{{ page.json_view.raw }}">published JSON</a> does not.</p></noscript>
<script src="{{ page.json_view.script }}" defer></script>

<footer id="ig-footer" class="st-ig"></footer>
<script src="../assets/ig-footer.js" defer></script>
