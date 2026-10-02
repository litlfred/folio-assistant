---
title: "Health Data Manager and Analyst — WHO SMART Base artefact"
description: "ActorDefinition/DAK.Persona.DataManager in the WHO SMART Base IG, with its canonical URL, published representations and DAK API sidecars."
nav_exclude: true
---
<style>
.st-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.75rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.st-held{color:#0d6e5e}
.st-ref{color:#6b5b95}
.st-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.st-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.st-stat b{display:block;font-size:1.25rem;line-height:1.2}
.st-stat span{font-size:.75rem;opacity:.75}

.st-ig {
  --breadcrumb-bg-color: #f5f5f5;
  --breadcrumb-text-color: ##555555; /* shape conflict — see chrome.json */
  --btn-active-color: #0078d4;
  --btn-gradient-end-color: #357ebd;
  --btn-gradient-end-color-alpha: #ff357ebd;
  --btn-gradient-start-color: #428bca;
  --btn-gradient-start-color-alpha: #ff428bca;
  --btn-hover-color: #0070A1;
  --btn-text-color: #e6e6e6;
  --display-todo: none;
  --dragon-background-color: #fffbf7;
  --dragon-text-color: #101020;
  --footer-bg-color: #505050;
  --footer-container-bg-color: #00477d;
  --footer-highlight-text-color: #ffff77;
  --footer-hyperlink-text-color: #81BEF7;
  --footer-nav-bg-color: #f5f5f5;
  --footer-text-color: #ffffff;
  --ig-header-color: #f6f7f9;
  --ig-header-container-color: #ffffff;
  --ig-status-text-color: #00376d;
  --link-color: #428bca;
  --link-hover-color: #2a6496;
  --may-color: #00004d;
  --must-color: #4d0000;
  --navbar-bg-color: #00477d;
  --publish-box-bg-color: yellow;
  --publish-box-border: 1px solid #0A0008;
  --should-color: #4d4000;
  --showtodo: "off";
  --stripe-bg-color: #999999;
  --stu-note-background-color: #fff2ff;
  --stu-note-border-left-color: #ffa0ff;
  --toc-box-bg-color: #f6f7f9;
  --toc-box-border: navy; /* shape conflict — see chrome.json */
}

.st-ig #ig-status.ig-status-draft {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 50) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>DRAFT</text></svg>");
  background-size: calc(50% / 5) 100px;
  background-repeat: repeat-x;
}

.st-ig #ig-status.ig-status-retired {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 60) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>RETIRED</text></svg>");
  background-size: calc(50% / 5) 100px;
  background-repeat: repeat-x;
}

.st-ig #ig-status p {
  background-color: white;
  padding: 10px 17px;
  border-radius: 5px;
  position: relative;
  z-index: 2;
}

.st-ig #publish-box {
  background-color: var(--publish-box-bg-color);
  border: var(--publish-box-border);
  padding: 5px;
}
.st-ig .st-ig-bar{background:var(--navbar-bg-color);padding:.5rem .8rem;border-radius:4px 4px 0 0}
.st-ig .st-ig-bar a{color:#fff;font-weight:600;text-decoration:none}
.st-ig .st-ig-title{font-size:12pt;font-weight:bold;color:var(--ig-status-text-color)}
</style>

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/base">smart.who.int.base</a></div>
  <div id="ig-status">
    <p><span class="st-ig-title">WHO SMART Base</span><br/><span>0.3.0</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/base">http://smart.who.int/base</a>.</p>
</div>

[← all 225 artefacts](../)

## Health Data Manager and Analyst

`ActorDefinition/DAK.Persona.DataManager`

A professional who manages, analyses, and disseminates health data to support evidence-based decision-making. This corresponds to the 'Data services' user group in CDISAH v2, providing crosscutting functionality across the health system. Data managers use DHIs to: Create data collection forms and manage data acquisition (4.1.1) Store and aggregate health data (4.1.2) Synthesise and visualise data for reporting and dashboards (4.1.3) Apply automated analytics and predictive modelling including AI/ML (4.1.4) Parse, de-duplicate, and curate coded datasets and terminologies (4.2) Classify disease codes and causes of mortality (4.2.3) Map geographic locations of facilities, events, populations, and providers (4.3) Enable point-to-point data integration and standards-compliant interoperability (4.4) Maintain data governance including authentication, privacy, and consent (4.5) ISCO-08 : 2120 (Mathematicians, actuaries and statisticians), 2521 (Database designers and administrators), 2523 (Computer network professionals), 3120 (Computer network and systems technicians). Examples : Biostatistician, epidemiologist, health informatician, data analyst, DHIS2 administrator, GIS specialist, interoperability engineer, terminology manager.

<div class="st-grid"><div class="st-stat"><b>ActorDefinition</b><span>resource type</span></div><div class="st-stat"><b>0.3.0</b><span>version</span></div><div class="st-stat"><b>Requirements: Actor Definitions</b><span>category</span></div></div>

## Identity and bytes are different questions

| | |
|---|---|
| Canonical URL | `http://smart.who.int/base/ActorDefinition/DAK.Persona.DataManager` |
| Published | <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-DAK.Persona.DataManager.json">json</a> · <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-DAK.Persona.DataManager.xml">xml</a> · <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-DAK.Persona.DataManager.ttl">ttl</a> · <a href="https://worldhealthorganization.github.io/smart-base/ActorDefinition-DAK.Persona.DataManager.html">html</a> |
| Materialization | <span class="st-tag st-ref">referenced</span> — upstream, not held here |

## DAK API

No DAK API sidecar is published for this artefact. That is a fact about the IG,
not a gap in this index — sidecars are published per artefact, and
47 of 225 carry one.
