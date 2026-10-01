---
title: "Changes — WHO SMART Trust"
description: "Changes: a narrative page of the WHO SMART Trust IG, rendered from its source."
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
  background-image: url("data:image/svg+xml;
  http: //www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 50) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>DRAFT</text></svg>");
  background-size: calc(50% / 5) 100px;
  background-repeat: repeat-x;
}

.st-ig #ig-status.ig-status-retired {
  background-image: url("data:image/svg+xml;
  http: //www.w3.org/2000/svg' width='150px' height='150px'><rect width='800%' height='100%' fill='transparent' /><text transform='translate(30, 60) rotate(-35)' fill='rgba(245,45,45,0.5)' font-family='Arial' font-weight='bold' font-size='20'>RETIRED</text></svg>");
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
  <div class="st-ig-bar"><a href="http://smart.who.int/trust">smart.who.int.trust</a></div>
  <div id="ig-status" class="ig-status-draft">
    <p><span class="st-ig-title">WHO SMART Trust</span><br/><span>1.8.0 — draft</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/trust">http://smart.who.int/trust</a>.</p>
</div>

# Changes

{% raw %}
### Changes

This provides a list of changes to the SMART Trust IG.

### 2024-01-29 v1.0.0 - First stable release
- First stable release

### 2024-02-01 v1.1.0
- Hcert specifications added

### 2024-02-21 v1.1.1
- video tutorials added

### 2024-03-22 v1.1.2 - release
- HCert Logical Model and specification updated with subclaim details and notes
- Rapid assessment template for proposing new trust domains added
- Content Profiles include details about Trust Domain
- FAQ page added
- Link to country participation dashboard added

### 2024-10-28 v1.1.4 - release
- HCert Logical Model updated with subclaim for DVC
- Onboarding Checklist updated
- Onboarding process revised to remove Transitive processes
- Latest country participation status updated

### 2024-12-19 v1.1.5 - release
- Onboarding Checklist updated

### 2025-04-02 v1.2.0 - release
- Upgraded to FHIR 5.0.0
- IPS Pilgrimage trust domain added
- PH4H Letters of Application added (English and Spanish)
- DAK API Documentation Hub added
- TNG Endpoints page added covering DEV, UAT, and PROD environments
- Participant ValueSets for DEV, UAT, and PROD environments introduced with automated nightly generation
- DID Trustlist v2 added (multiple DID files per key type); DID Trustlist v1 deprecated

### 2025-10-27 v1.3.0 - release
- Trust Network Gateway additional context JSON-LD file added
- DID context extension links updated to reference FHIR specifications
- Participant lists updated

### 2026-02-11 v1.4.0 - release
- Onboarding Checklist updated with detailed curl command validation instructions
- Windows-specific curl instructions added (OpenSSL-based build required)
- IOM country mapping added
- Participant lists updated

### 2026-04-27 v1.5.0 - release
- C.L.38.2023 (Global Digital Health Certification Network) circular letter references added to Overview (Arabic, Chinese, English, French, Russian)
- Trust Network Gateway Letters of Application added for all languages (English, Arabic, French, Mandarin, Russian, Spanish) and PH4H
- Updated Participant onboarding list

### 2026-07-23 v1.6.0 - release
- Nightly participant generation fixes:
  - Fixed GitHub API rate limiting in the nightly participant generation workflow
  - Fixed missing Participants CodeSystem updates
- Additional updates:
  - Clarified that the HCERT CWT must include the signature for validation
  - Updated FSH model definitions for cardinality on CWT, and HCERT configuration

### 2026-07-29 v1.7.0 - release
- Nightly participant generation fixes:
  - Fixed GitHub API rate limiting in the nightly participant generation workflow
  - Fixed missing Participants 
- Added MedicationOverviewMin as a new payload type in HCERT

### 2026-08-27 v1.7.1 - release
- updated GDHCN Participants onboarding status

### 2026-09-03 v1.7.2 - release
- updated GDHCN Administrative and Operational Framework letter
{% endraw %}

---

<small>Source: [`input/pagecontent/changes.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/changes.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
