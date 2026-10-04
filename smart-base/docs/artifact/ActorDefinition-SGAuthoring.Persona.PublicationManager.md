---
title: "Publication Manager — WHO SMART Base artefact"
description: "ActorDefinition/SGAuthoring.Persona.PublicationManager in the WHO SMART Base IG, with its canonical URL, published representations and DAK API sidecars."
nav_exclude: true
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

## Publication Manager

`ActorDefinition/SGAuthoring.Persona.PublicationManager`

A specialist responsible for managing the FHIR Implementation Guide configuration, build process, versioning, and release publication workflow. Publication Managers ensure IGs are correctly configured, built, and published to smart.who.int following the established publication process. Key activities: Set up IG repositories from smart-ig-empty template Configure sushi-config.yaml (canonical URL, package ID, dependencies) Enable GitHub Pages and CI build workflows Run FHIR IG Publisher builds and verify output Manage semantic versioning (major.minor.patch) Create publication-request.json for releases Create release branches, tags, and GitHub releases Monitor automated publication workflows Coordinate with WHO SMART Guidelines team for smart.who.int updates Manage cross-IG governance for shared artifacts Reset main branch to draft status after publication Source : IG Starter Kit, IG Setup, IG Publication, and IG Configuration pages

<div class="st-grid"><div class="st-stat"><b>ActorDefinition</b><span>resource type</span></div><div class="st-stat"><b>0.3.0</b><span>version</span></div><div class="st-stat"><b>Requirements: Actor Definitions</b><span>category</span></div></div>

## Identity and bytes are different questions

| | |
|---|---|
| Canonical URL | `http://smart.who.int/base/ActorDefinition/SGAuthoring.Persona.PublicationManager` |
| Published | <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-SGAuthoring.Persona.PublicationManager.json">json</a> · <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-SGAuthoring.Persona.PublicationManager.xml">xml</a> · <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-SGAuthoring.Persona.PublicationManager.ttl">ttl</a> · <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-SGAuthoring.Persona.PublicationManager.html">html</a> |
| Materialization | <span class="st-tag st-ref">referenced</span> — upstream, not held here |

## DAK API

No DAK API sidecar is published for this artefact. That is a fact about the IG,
not a gap in this index — sidecars are published per artefact, and
47 of 225 carry one.

<footer id="ig-footer" data-prev="ActorDefinition-SGAuthoring.Persona.ProgrammeManager.html" data-next="ActorDefinition-SGAuthoring.Persona.QCReviewer.html" class="st-ig"></footer>
<script src="{{ '/smart-base/assets/ig-footer.js' | relative_url }}" defer></script>
