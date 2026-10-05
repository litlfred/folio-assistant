---
title: "Issuer — WHO SMART Trust artefact"
description: "ActorDefinition/Issuer in the WHO SMART Trust IG, with its canonical URL, published representations and DAK API sidecars."
nav_exclude: true
---
<link rel="stylesheet" href="{{ '/assets/ig-pages.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/assets/ig-chrome.css' | relative_url }}">

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/trust">smart.who.int.trust</a></div>
  <div id="ig-status" class="ig-status-draft">
    <p><span class="st-ig-title">WHO SMART Trust</span><br/><span>1.8.0 — draft</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/trust">http://smart.who.int/trust</a>.</p>
</div>

[← all 678 artefacts](../artifacts.html)

## Issuer

`ActorDefinition/Issuer`

An Issuer a system authorized by a Trust Network Participant to generate Verifiable Digital Health Certificates which are provided to a Holder. An Issuer is responsible for generating the content that is digitally signed within the Verifiable Digital Health Certificate. In order to sign this content, an Issuer should either itself be a Document Signer or utilize a Document Signer service, as authorized by the jurisdicitonal policy.

<div class="st-grid"><div class="st-stat"><b>ActorDefinition</b><span>resource type</span></div><div class="st-stat"><b>1.8.0</b><span>version</span></div><div class="st-stat"><b>Requirements: Actor Definitions</b><span>category</span></div></div>

## Identity and bytes are different questions

| | |
|---|---|
| Canonical URL | `http://smart.who.int/trust/ActorDefinition/Issuer` |
| Published | <a href="https://litlfred.github.io/smart-trust/ActorDefinition-Issuer.json">json</a> · <a href="https://litlfred.github.io/smart-trust/ActorDefinition-Issuer.xml">xml</a> · <a href="https://litlfred.github.io/smart-trust/ActorDefinition-Issuer.ttl">ttl</a> · <a href="https://litlfred.github.io/smart-trust/ActorDefinition-Issuer.html">html</a> |
| Materialization | <span class="st-tag st-ref">referenced</span> — upstream, not held here |

## DAK API

No DAK API sidecar is published for this artefact. That is a fact about the IG,
not a gap in this index — sidecars are published per artefact, and
19 of 678 carry one.

<footer id="ig-footer" data-prev="ActorDefinition-Holder.html" data-next="ActorDefinition-Receiver.html" class="st-ig"></footer>
<script src="{{ '/assets/ig-footer.js' | relative_url }}" defer></script>
