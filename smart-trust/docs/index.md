---
title: "WHO SMART Trust — artefact index"
description: "All 674 artefacts of the WHO SMART Trust IG 1.8.0, reconstructed from its published output."
---
<style>
:root {
  --ink: #17242e; --muted: #5c6b77; --edge: #d5dde3; --surface: #ffffff;
  --wash: #f6f9fb; --accent: #0a6e8c; --accent-deep: #08516a;
  --held: #0d6e5e; --ref: #6b5b95; --col: 1180px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --ink: #e8eef2; --muted: #9fb0bc; --edge: #2c3a45; --surface: #111a20;
    --wash: #16212a; --accent: #57b6d4; --accent-deep: #8ed2e8;
    --held: #5fc7ae; --ref: #b3a3dd;
  }
}
:root[data-theme="dark"] {
  --ink: #e8eef2; --muted: #9fb0bc; --edge: #2c3a45; --surface: #111a20;
  --wash: #16212a; --accent: #57b6d4; --accent-deep: #8ed2e8;
  --held: #5fc7ae; --ref: #b3a3dd;
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--surface); color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", sans-serif;
  font-size: 16px; line-height: 1.55;
}
.wrap { max-width: var(--col); margin: 0 auto; padding: 0 16px; }
a { color: var(--accent); }
a:hover, a:focus { text-decoration: underline; }
code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .9em; }
header.top { background: var(--accent-deep); color: #fff; padding: 22px 0; }
header.top .wrap { display: flex; flex-wrap: wrap; gap: 10px; align-items: baseline; justify-content: space-between; }
header.top h1 { margin: 0; font-size: 1.35rem; letter-spacing: .01em; }
header.top a { color: #dff1f8; }
.sub { color: #cfe6f0; font-size: .92rem; }
.banner {
  background: var(--wash); border-bottom: 1px solid var(--edge);
  padding: 12px 0; font-size: .92rem; color: var(--muted);
}
main { padding: 24px 0 64px; }
h2 { font-size: 1.12rem; margin: 30px 0 10px; }
h3 { font-size: 1rem; margin: 22px 0 8px; }
p { margin: 8px 0; }
.lede { font-size: 1.02rem; max-width: 72ch; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin: 16px 0 6px; }
.stat { border: 1px solid var(--edge); border-radius: 8px; padding: 12px 14px; background: var(--wash); }
.stat b { display: block; font-size: 1.5rem; line-height: 1.2; font-variant-numeric: tabular-nums; }
.stat span { color: var(--muted); font-size: .84rem; }
table { border-collapse: collapse; width: 100%; margin: 10px 0 4px; font-size: .93rem; }
th, td { text-align: left; padding: 7px 9px; border-bottom: 1px solid var(--edge); vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; }
tbody tr:hover { background: var(--wash); }
.tag { display: inline-block; font-size: .74rem; padding: 1px 7px; border-radius: 999px; border: 1px solid currentColor; white-space: nowrap; }
.tag.held { color: var(--held); }
.tag.ref { color: var(--ref); }
.reps a { margin-right: 8px; white-space: nowrap; }
details { border: 1px solid var(--edge); border-radius: 8px; margin: 12px 0; background: var(--surface); }
details > summary {
  cursor: pointer; padding: 11px 14px; font-weight: 600;
  display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
}
details > summary .n { color: var(--muted); font-weight: 400; font-variant-numeric: tabular-nums; }
details[open] > summary { border-bottom: 1px solid var(--edge); }
.inner { padding: 0 14px 10px; overflow-x: auto; }
.prov { border: 1px solid var(--edge); border-radius: 8px; padding: 12px 14px; background: var(--wash); }
.prov dt { font-weight: 600; font-size: .86rem; margin-top: 8px; }
.prov dd { margin: 2px 0 0; color: var(--muted); }
footer { border-top: 1px solid var(--edge); color: var(--muted); font-size: .86rem; padding: 18px 0 40px; }
.back { display: inline-block; margin-bottom: 8px; }
@media (max-width: 640px) { header.top h1 { font-size: 1.1rem; } .wrap { padding: 0 16px; } }
</style>

<p class="lede">The artefact index of the WHO SMART Trust Implementation Guide, rebuilt from what the IG
publishes. Most of it is catalogued <strong>by reference</strong>: the index records where each artefact
lives and holds none of its bytes. A <span class="tag ref">referenced</span> row is not a broken one &mdash;
it means upstream, not here.</p>

<div class="grid">
  <div class="stat"><b>674</b><span>artefacts indexed</span></div>
  <div class="stat"><b>655</b><span>referenced &mdash; bytes upstream</span></div>
  <div class="stat"><b>19</b><span>materialized here</span></div>
  <div class="stat"><b>1.8.0</b><span>IG version</span></div>
  <div class="stat"><b>5.0.0</b><span>FHIR version</span></div>
</div>

<h2>Where this came from</h2>
<p class="lede">No FHIR IG publishes an artefact-index document. What looks like one &mdash;
<code>ValueSets.schema.json</code> at the published root &mdash; is a JSON <em>Schema</em> describing the
shape of an enumeration response, carrying an <code>example</code> that happens to hold the list.
So this index was <strong>reconstructed</strong>, and every part of it records which published file it came out of.</p>
<div class="prov"><dl>
<dt>packageManifest</dt><dd class="mono">package.manifest.json</dd>
<dt>canonicals</dt><dd class="mono">canonicals.json</dd>
<dt>packageIndex</dt><dd class="mono">package.tgz!package/.index.json</dd>
<dt>artifactsHtml</dt><dd class="mono">artifacts.html</dd>
<dt>dakEnumerations</dt><dd class="mono">LogicalModels.schema.json, ValueSets.schema.json</dd>
<dt>source</dt><dd class="mono">gh-pages &mdash; https://worldhealthorganization.github.io/smart-trust (read 2026-09-21)</dd>
<dt>canonical base</dt><dd class="mono">http://smart.who.int/trust</dd>
</dl></div>

<h2>DAK API surface</h2>
<p class="lede">The IG publishes a DAK API for 19 of its artefacts. The four sidecars are
issued independently &mdash; every ValueSet gets all four, the logical models get two &mdash; which is why they are
counted separately rather than as one &ldquo;has DAK&rdquo; tally.</p>
<div class="grid">
  <div class="stat"><b>19</b><span>JSON Schema</span></div>
  <div class="stat"><b>14</b><span>displays</span></div>
  <div class="stat"><b>19</b><span>OpenAPI</span></div>
  <div class="stat"><b>14</b><span>JSON-LD</span></div>
  <div class="stat"><b>3</b><span>JSON-LD contexts</span></div>
</div>
<table><thead><tr><th>Context</th><th>Published at</th></tr></thead><tbody>
<tr><td class="mono">tng-context/v1-DEV</td><td><a href="https://worldhealthorganization.github.io/smart-trust/tng-context/v1-DEV.jsonld">https://worldhealthorganization.github.io/smart-trust/tng-context/v1-DEV.jsonld</a></td></tr>
<tr><td class="mono">tng-context/v1-UAT</td><td><a href="https://worldhealthorganization.github.io/smart-trust/tng-context/v1-UAT.jsonld">https://worldhealthorganization.github.io/smart-trust/tng-context/v1-UAT.jsonld</a></td></tr>
<tr><td class="mono">tng-context/v1</td><td><a href="https://worldhealthorganization.github.io/smart-trust/tng-context/v1.jsonld">https://worldhealthorganization.github.io/smart-trust/tng-context/v1.jsonld</a></td></tr>
</tbody></table>
<h2>Every artefact, by category</h2>
<p class="lede">Grouped as the IG's own <code>artifacts.html</code> groups them. An artefact with a DAK API
sidecar links through to its own page; the rest link out to the published representations.</p>
<details>
  <summary><span>Other</span><span class="n">604</span></summary>
  <div class="inner">
  <p class="lede">These 604 are <strong>summarised rather than listed</strong>: over
  100 in one category, and none of them carries a DAK API sidecar, so none has an artefact page here to link to. They are instance data of the trust network rather than definitional artefacts.</p>
  <table>
    <thead><tr><th>Resource type</th><th style="text-align:right">Count</th></tr></thead>
    <tbody>
<tr><td>Endpoint</td><td style="text-align:right">453</td></tr>
<tr><td>Organization</td><td style="text-align:right">151</td></tr>
    </tbody>
  </table>
  <p>Read them upstream, where the IG documents them in full:
  <a href="https://worldhealthorganization.github.io/smart-trust/artifacts.html">https://worldhealthorganization.github.io/smart-trust/artifacts.html</a>.
  Every one is also in this instance's <code>fhir-artifact-index/index.json</code>, with its canonical
  URL and published representations &mdash; that file is the index, this page is only a reading of it.</p>
  </div>
</details>
<details>
  <summary><span>Requirements: Actor Definitions</span><span class="n">5</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
<tr>
  <td>Holder<br><span class="mono" style="color:var(--muted)">ActorDefinition/Holder</span></td>
  <td class="mono">http://smart.who.int/trust/ActorDefinition/Holder</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Holder.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Holder.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Holder.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Holder.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Issuer<br><span class="mono" style="color:var(--muted)">ActorDefinition/Issuer</span></td>
  <td class="mono">http://smart.who.int/trust/ActorDefinition/Issuer</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Issuer.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Issuer.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Issuer.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Issuer.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receiver<br><span class="mono" style="color:var(--muted)">ActorDefinition/Receiver</span></td>
  <td class="mono">http://smart.who.int/trust/ActorDefinition/Receiver</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Receiver.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Receiver.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Receiver.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-Receiver.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Trust Network Anchor<br><span class="mono" style="color:var(--muted)">ActorDefinition/TrustNetworkAnchor</span></td>
  <td class="mono">http://smart.who.int/trust/ActorDefinition/TrustNetworkAnchor</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkAnchor.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkAnchor.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkAnchor.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkAnchor.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Trust Network Participant<br><span class="mono" style="color:var(--muted)">ActorDefinition/TrustNetworkParticipant</span></td>
  <td class="mono">http://smart.who.int/trust/ActorDefinition/TrustNetworkParticipant</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkParticipant.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkParticipant.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkParticipant.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ActorDefinition-TrustNetworkParticipant.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
    </tbody>
  </table>
  </div>
</details>
<details>
  <summary><span>Requirements: Formal Requirements</span><span class="n">29</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
<tr>
  <td>Distribute business rules<br><span class="mono" style="color:var(--muted)">Requirements/DistributeBusinessRules</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/DistributeBusinessRules</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRules.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRules.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRules.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRules.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Distribute CertLogic business rules<br><span class="mono" style="color:var(--muted)">Requirements/DistributeBusinessRulesCertLogic</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/DistributeBusinessRulesCertLogic</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesCertLogic.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesCertLogic.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesCertLogic.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesCertLogic.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Distribute FHIR business rules<br><span class="mono" style="color:var(--muted)">Requirements/DistributeBusinessRulesFHIR</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/DistributeBusinessRulesFHIR</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesFHIR.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesFHIR.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesFHIR.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributeBusinessRulesFHIR.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Distribute PKI material<br><span class="mono" style="color:var(--muted)">Requirements/DistributePKIMaterial</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/DistributePKIMaterial</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterial.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterial.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterial.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterial.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Distribute PKI material via API<br><span class="mono" style="color:var(--muted)">Requirements/DistributePKIMaterialAPI</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/DistributePKIMaterialAPI</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialAPI.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialAPI.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialAPI.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialAPI.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Distribute PKI material as DID<br><span class="mono" style="color:var(--muted)">Requirements/DistributePKIMaterialDID</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/DistributePKIMaterialDID</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialDID.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialDID.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialDID.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-DistributePKIMaterialDID.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Issue Verifiable Digital Health Certificate<br><span class="mono" style="color:var(--muted)">Requirements/IssuerVDHC</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/IssuerVDHC</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-IssuerVDHC.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-IssuerVDHC.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-IssuerVDHC.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-IssuerVDHC.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Provide Verifiable Digital Health Certificate<br><span class="mono" style="color:var(--muted)">Requirements/ProvideVDHC</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ProvideVDHC</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ProvideVDHC.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ProvideVDHC.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ProvideVDHC.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ProvideVDHC.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Publish business rules<br><span class="mono" style="color:var(--muted)">Requirements/PublishBusinessRules</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/PublishBusinessRules</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRules.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRules.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRules.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRules.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Publish Cert Logic business rules<br><span class="mono" style="color:var(--muted)">Requirements/PublishBusinessRulesCertLogic</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/PublishBusinessRulesCertLogic</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesCertLogic.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesCertLogic.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesCertLogic.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesCertLogic.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Publish HL7 FHIR business rules<br><span class="mono" style="color:var(--muted)">Requirements/PublishBusinessRulesFHIR</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/PublishBusinessRulesFHIR</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesFHIR.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesFHIR.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesFHIR.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishBusinessRulesFHIR.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Publish PKI material<br><span class="mono" style="color:var(--muted)">Requirements/PublishPKIMaterial</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/PublishPKIMaterial</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterial.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterial.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterial.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterial.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Publish PKI material via API<br><span class="mono" style="color:var(--muted)">Requirements/PublishPKIMaterialAPI</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/PublishPKIMaterialAPI</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialAPI.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialAPI.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialAPI.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialAPI.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Publish PKI material as DID<br><span class="mono" style="color:var(--muted)">Requirements/PublishPKIMaterialDID</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/PublishPKIMaterialDID</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialDID.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialDID.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialDID.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-PublishPKIMaterialDID.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receive business rules<br><span class="mono" style="color:var(--muted)">Requirements/ReceiveBusinessRules</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ReceiveBusinessRules</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRules.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRules.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRules.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRules.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receive CertLogic business rules<br><span class="mono" style="color:var(--muted)">Requirements/ReceiveBusinessRulesCertLogic</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ReceiveBusinessRulesCertLogic</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesCertLogic.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesCertLogic.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesCertLogic.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesCertLogic.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receive HL7 FHIR business rules<br><span class="mono" style="color:var(--muted)">Requirements/ReceiveBusinessRulesFHIR</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ReceiveBusinessRulesFHIR</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesFHIR.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesFHIR.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesFHIR.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveBusinessRulesFHIR.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receive PKI material<br><span class="mono" style="color:var(--muted)">Requirements/ReceivePKUMaterial</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ReceivePKUMaterial</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterial.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterial.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterial.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterial.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receive PKI material via API<br><span class="mono" style="color:var(--muted)">Requirements/ReceivePKUMaterialAPI</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ReceivePKUMaterialAPI</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialAPI.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialAPI.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialAPI.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialAPI.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receive PKI material as DID<br><span class="mono" style="color:var(--muted)">Requirements/ReceivePKUMaterialDID</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ReceivePKUMaterialDID</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialDID.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialDID.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialDID.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceivePKUMaterialDID.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Receive Verifiable Digital Health Certificate<br><span class="mono" style="color:var(--muted)">Requirements/ReceiveVDHC</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/ReceiveVDHC</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveVDHC.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveVDHC.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveVDHC.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-ReceiveVDHC.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Request Verifiable Digital Health Certificate<br><span class="mono" style="color:var(--muted)">Requirements/RequestVDHC</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/RequestVDHC</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RequestVDHC.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RequestVDHC.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RequestVDHC.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RequestVDHC.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Retrieve business rules<br><span class="mono" style="color:var(--muted)">Requirements/RetrieveBusinessRules</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/RetrieveBusinessRules</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRules.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRules.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRules.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRules.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Retrieve Cert Logic compatible business rules<br><span class="mono" style="color:var(--muted)">Requirements/RetrieveBusinessRulesCertLogic</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/RetrieveBusinessRulesCertLogic</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesCertLogic.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesCertLogic.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesCertLogic.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesCertLogic.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Retrieve HL7 FHIR compatible business rules<br><span class="mono" style="color:var(--muted)">Requirements/RetrieveBusinessRulesFHIR</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/RetrieveBusinessRulesFHIR</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesFHIR.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesFHIR.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesFHIR.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrieveBusinessRulesFHIR.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Retrieve PKI material<br><span class="mono" style="color:var(--muted)">Requirements/RetrievePKIMaterial</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/RetrievePKIMaterial</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterial.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterial.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterial.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterial.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Retrieve PKI material via API<br><span class="mono" style="color:var(--muted)">Requirements/RetrievePKIMaterialAPI</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/RetrievePKIMaterialAPI</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialAPI.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialAPI.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialAPI.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialAPI.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Retrieve PKI material as DID<br><span class="mono" style="color:var(--muted)">Requirements/RetrievePKIMaterialDID</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/RetrievePKIMaterialDID</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialDID.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialDID.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialDID.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-RetrievePKIMaterialDID.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>Utilize a Verifiable Digital Health Certificate<br><span class="mono" style="color:var(--muted)">Requirements/UtilizeVDHC</span></td>
  <td class="mono">http://smart.who.int/trust/Requirements/UtilizeVDHC</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-UtilizeVDHC.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-UtilizeVDHC.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-UtilizeVDHC.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/Requirements-UtilizeVDHC.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
    </tbody>
  </table>
  </div>
</details>
<details>
  <summary><span>Structures: Logical Models</span><span class="n">5</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
<tr>
  <td><a href="./artifact/StructureDefinition-COSEHeader.html">COSE Headers (DRAFT)</a><br><span class="mono" style="color:var(--muted)">StructureDefinition/COSEHeader</span></td>
  <td class="mono">http://smart.who.int/trust/StructureDefinition/COSEHeader</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-COSEHeader.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-COSEHeader.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-COSEHeader.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-COSEHeader.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/StructureDefinition-CWT.html">CBOR Web Token (CWT) Claim</a><br><span class="mono" style="color:var(--muted)">StructureDefinition/CWT</span></td>
  <td class="mono">http://smart.who.int/trust/StructureDefinition/CWT</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWT.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWT.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWT.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWT.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/StructureDefinition-CWTPayload.html">CBOR Web Token (CWT) Payload (Common)</a><br><span class="mono" style="color:var(--muted)">StructureDefinition/CWTPayload</span></td>
  <td class="mono">http://smart.who.int/trust/StructureDefinition/CWTPayload</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWTPayload.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWTPayload.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWTPayload.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-CWTPayload.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/StructureDefinition-HCert.html">Health Certificate</a><br><span class="mono" style="color:var(--muted)">StructureDefinition/HCert</span></td>
  <td class="mono">http://smart.who.int/trust/StructureDefinition/HCert</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-HCert.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-HCert.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-HCert.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-HCert.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/StructureDefinition-SchemeInformation.html">Scheme Information</a><br><span class="mono" style="color:var(--muted)">StructureDefinition/SchemeInformation</span></td>
  <td class="mono">http://smart.who.int/trust/StructureDefinition/SchemeInformation</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-SchemeInformation.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-SchemeInformation.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-SchemeInformation.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/StructureDefinition-SchemeInformation.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
    </tbody>
  </table>
  </div>
</details>
<details>
  <summary><span>Terminology: Code Systems</span><span class="n">15</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
<tr>
  <td>WHO GDHCN Trust Actors CodeSystem<br><span class="mono" style="color:var(--muted)">CodeSystem/Actors</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/Actors</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Actors.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Actors.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Actors.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Actors.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Connection Types<br><span class="mono" style="color:var(--muted)">CodeSystem/ConnectionTypes</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/ConnectionTypes</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-ConnectionTypes.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-ConnectionTypes.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-ConnectionTypes.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-ConnectionTypes.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Trust Domains<br><span class="mono" style="color:var(--muted)">CodeSystem/Domains</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/Domains</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Trust Domains - DEV<br><span class="mono" style="color:var(--muted)">CodeSystem/Domains-DEV</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/Domains-DEV</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-DEV.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-DEV.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-DEV.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-DEV.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Trust Domains - UAT<br><span class="mono" style="color:var(--muted)">CodeSystem/Domains-UAT</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/Domains-UAT</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-UAT.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-UAT.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-UAT.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Domains-UAT.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Key Usage CodeSystem<br><span class="mono" style="color:var(--muted)">CodeSystem/KeyUsage</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/KeyUsage</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Key Usage CodeSystem - DEV<br><span class="mono" style="color:var(--muted)">CodeSystem/KeyUsage-DEV</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/KeyUsage-DEV</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-DEV.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-DEV.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-DEV.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-DEV.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Key Usage CodeSystem - UAT<br><span class="mono" style="color:var(--muted)">CodeSystem/KeyUsage-UAT</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/KeyUsage-UAT</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-UAT.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-UAT.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-UAT.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-KeyUsage-UAT.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Trust Network Participants CodeSystem<br><span class="mono" style="color:var(--muted)">CodeSystem/Participants</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/Participants</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Trust Network Participant - DEV<br><span class="mono" style="color:var(--muted)">CodeSystem/Participants-DEV</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystems/Participants-DEV</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-DEV.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-DEV.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-DEV.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-DEV.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Trust Network Participant - UAT<br><span class="mono" style="color:var(--muted)">CodeSystem/Participants-UAT</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystems/Participants-UAT</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-UAT.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-UAT.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-UAT.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Participants-UAT.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Payload Types<br><span class="mono" style="color:var(--muted)">CodeSystem/PayloadTypes</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/PayloadTypes</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-PayloadTypes.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-PayloadTypes.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-PayloadTypes.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-PayloadTypes.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO RefMart Jurisidiction List<br><span class="mono" style="color:var(--muted)">CodeSystem/RefMartCountryList</span></td>
  <td class="mono">http://smart.who.int/refmart/CodeSystems/REF_COUNTRY</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-RefMartCountryList.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-RefMartCountryList.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-RefMartCountryList.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-RefMartCountryList.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO GDHCN Transactions CodeSystem<br><span class="mono" style="color:var(--muted)">CodeSystem/Transactions</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/Transactions</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Transactions.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Transactions.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Transactions.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-Transactions.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
<tr>
  <td>WHO Regional Offices CodeSystem<br><span class="mono" style="color:var(--muted)">CodeSystem/WHORegionalOffices</span></td>
  <td class="mono">http://smart.who.int/trust/CodeSystem/WHORegionalOffices</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-WHORegionalOffices.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-WHORegionalOffices.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-WHORegionalOffices.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/CodeSystem-WHORegionalOffices.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
    </tbody>
  </table>
  </div>
</details>
<details>
  <summary><span>Terminology: Concept Maps</span><span class="n">1</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
<tr>
  <td>GDHCN Participants to WHO Regional Offices<br><span class="mono" style="color:var(--muted)">ConceptMap/ParticipantsToWHORegionalOffices</span></td>
  <td class="mono">http://smart.who.int/trust/ConceptMap/ParticipantsToWHORegionalOffices</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ConceptMap-ParticipantsToWHORegionalOffices.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ConceptMap-ParticipantsToWHORegionalOffices.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ConceptMap-ParticipantsToWHORegionalOffices.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ConceptMap-ParticipantsToWHORegionalOffices.html">html</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
    </tbody>
  </table>
  </div>
</details>
<details>
  <summary><span>Terminology: Value Sets</span><span class="n">14</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
<tr>
  <td><a href="./artifact/ValueSet-Actors.html">WHO GDHCN Actor ValueSet of actor codes</a><br><span class="mono" style="color:var(--muted)">ValueSet/Actors</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Actors</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Actors.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Actors.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Actors.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Actors.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-ConnectionTypes.html">WHO GDHCN Connection Types</a><br><span class="mono" style="color:var(--muted)">ValueSet/ConnectionTypes</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/ConnectionTypes</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-ConnectionTypes.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-ConnectionTypes.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-ConnectionTypes.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-ConnectionTypes.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-Domains.html">WHO GDHCN Trust Domains</a><br><span class="mono" style="color:var(--muted)">ValueSet/Domains</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Domains</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-Domains-DEV.html">WHO GDHCN Trust Domains - DEV</a><br><span class="mono" style="color:var(--muted)">ValueSet/Domains-DEV</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Domains-DEV</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-DEV.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-DEV.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-DEV.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-DEV.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-Domains-UAT.html">WHO GDHCN Trust Domains - UAT</a><br><span class="mono" style="color:var(--muted)">ValueSet/Domains-UAT</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Domains-UAT</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-UAT.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-UAT.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-UAT.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Domains-UAT.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-KeyUsage.html">WHO GDHCN Key Usage ValueSet</a><br><span class="mono" style="color:var(--muted)">ValueSet/KeyUsage</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/KeyUsage</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-KeyUsage-DEV.html">WHO GDHCN Key Usage ValueSet - DEV</a><br><span class="mono" style="color:var(--muted)">ValueSet/KeyUsage-DEV</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/KeyUsage-DEV</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-DEV.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-DEV.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-DEV.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-DEV.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-KeyUsage-UAT.html">WHO GDHCN Key Usage ValueSet - UAT</a><br><span class="mono" style="color:var(--muted)">ValueSet/KeyUsage-UAT</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/KeyUsage-UAT</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-UAT.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-UAT.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-UAT.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-KeyUsage-UAT.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-Participants.html">WHO GDHCN Trust Network Participant</a><br><span class="mono" style="color:var(--muted)">ValueSet/Participants</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Participants</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-Participants-DEV.html">WHO GDHCN Trust Network Participant - DEV</a><br><span class="mono" style="color:var(--muted)">ValueSet/Participants-DEV</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Participants-DEV</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-DEV.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-DEV.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-DEV.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-DEV.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-Participants-UAT.html">WHO GDHCN Trust Network Participant - UAT</a><br><span class="mono" style="color:var(--muted)">ValueSet/Participants-UAT</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Participants-UAT</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-UAT.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-UAT.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-UAT.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Participants-UAT.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-PayloadTypes.html">WHO GDHCN Payload Types</a><br><span class="mono" style="color:var(--muted)">ValueSet/PayloadTypes</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/PayloadTypes</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-PayloadTypes.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-PayloadTypes.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-PayloadTypes.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-PayloadTypes.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-Transactions.html">WHO GDHCN Transaction Codes</a><br><span class="mono" style="color:var(--muted)">ValueSet/Transactions</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/Transactions</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Transactions.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Transactions.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Transactions.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-Transactions.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
<tr>
  <td><a href="./artifact/ValueSet-WHORegionalOffices.html">WHO Regional Offices</a><br><span class="mono" style="color:var(--muted)">ValueSet/WHORegionalOffices</span></td>
  <td class="mono">http://smart.who.int/trust/ValueSet/WHORegionalOffices</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-WHORegionalOffices.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-WHORegionalOffices.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-WHORegionalOffices.ttl">ttl</a><a href="https://worldhealthorganization.github.io/smart-trust/ValueSet-WHORegionalOffices.html">html</a></td>
  <td><span class="tag held">materialized</span></td>
</tr>
    </tbody>
  </table>
  </div>
</details>
<details>
  <summary><span>Not listed on the IG's artefact page</span><span class="n">1</span></summary>
  <div class="inner">
  <table>
    <thead><tr><th>Artefact</th><th>Canonical URL</th><th>Published as</th><th>Bytes</th></tr></thead>
    <tbody>
<tr>
  <td>Trust<br><span class="mono" style="color:var(--muted)">ImplementationGuide/smart.who.int.trust</span></td>
  <td class="mono">http://smart.who.int/trust/ImplementationGuide/smart.who.int.trust</td>
  <td class="reps"><a href="https://worldhealthorganization.github.io/smart-trust/ImplementationGuide-smart.who.int.trust.json">json</a><a href="https://worldhealthorganization.github.io/smart-trust/ImplementationGuide-smart.who.int.trust.xml">xml</a><a href="https://worldhealthorganization.github.io/smart-trust/ImplementationGuide-smart.who.int.trust.ttl">ttl</a></td>
  <td><span class="tag ref">referenced</span></td>
</tr>
    </tbody>
  </table>
  </div>
</details>

