---
title: "Indices — WHO SMART Trust"
description: "Indices: a narrative page of the WHO SMART Trust IG, rendered from its source."
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

# Indices

{% raw %}
## Indices 



This deployment guide consists of the following indexed material:

*   [Artifact Index](https://worldhealthorganization.github.io/smart-trust/artifacts.html)
*   [References](references.html)
* [Mappings](maps.html)
* [Changes](changes.html)
* [Downloads](downloads.html)
* [License](license.html)



 

  
### Trust Network Specifications
 
<a name="trust-specfications"> </a>


  
  
#### EU DCC 

  
<ul>
    <li><a href="https://ec.europa.eu/health/sites/health/files/ehealth/docs/trust-framework_interoperability_certificates_en.pdf">Interoperability of health certificates – Trust Framework – v. 1.0 – 12.03.2021 – eHealth Network</a>  - last accessed 27.04.2021</li>
    <li><a href="https://ec.europa.eu/health/sites/health/files/ehealth/docs/digital-green-certificates_v1_en.pdf">Technical Specifications for Digital COVID Certificates Volume 1 V1.0.5  - eHealth Network</a> - last accessed 27.04.2021</li>
    <li><a href="https://www.etsi.org/deliver/etsi_en/319100_319199/31910201/01.01.01_60/en_31910201v010101p.pdf">ETSI EN 319 102-1: Electronic Signatures and Infrastructures (ESI); Procedures for Creation and Validation of AdES Digital Signatures; Part 1: Creation and Validation – version 1.1.1, 2016</a>  – last accessed 23.04.2021</li>
    <li><a href="https://health.ec.europa.eu/publications/technical-specifications-eu-digital-covid-certificates-volumes-1-5_en">Technical specifications for EU Digital COVID Certificates - Volumes 1-5 </a> </li>
    <li><a href="https://health.ec.europa.eu/system/files/2022-02/digital-covid-certificates_v1_en.pdf">Volume 1: Formats and trust management available at  references "Implementing Decision (EU) 2021/1073, Annex I"</a></li>
    <li><a href="https://eur-lex.europa.eu/legal-content/EN/TXT/uri=uriserv%3AOJ.L_.2021.230.01.0032.01.ENG)">Implementing Decision (EU) 2021/1073, Annex I can be found at , along with other relevant Annexes.</a></li>
  </ul>


  
####  DIVOC 

  
<ul>
    <li>Elements are defined by JSON-LD. As of 2023-02-12, the most current <a href="https://github.com/egovernments/DIVOC/blob/icmr/vaccination-context/vaccination-context.js">JSON-LD context for vaccines</a> and for <a href="https://github.com/egovernments/DIVOC/blob/icmr/test-certificate-context/test-certificate-context.js">test results</a> is here . Note that the URIs for the DIVOC-specific JSON-LD contexts embedded in the certificates do not resolve.</li>
    <li> DIVOC's <a href="https://divoc.digit.org">documentation</a> is here  but this does not include element-level descriptions (e.g., terminology bindings at a per-element level).</li>
    <li> Terminology bindings at the element level must be inferred from more <a href="https://divoc.digit.org/platform/divocs-verifiable-certificate-features/what-information-goes-into-a-qr-code">general documentation</a>.  The `v2` JSON-LD context introduces the `evidence.icd11Code` element for vaccines, but there is no documentation on which codes this element is bound to or whether this is used in production. There is no other computable representation of vaccine type/product.</li>
  </ul>


  
#### ICAO 

  
<ul>
    <li> ICAO <a href="https://www.icao.int/vdsnc-spec">VDS NC</a></li>
  </ul>


  
#### SMART Health Cards 

  
<ul>
    <li>General SMART Health Card <a href="https://spec.smarthealth.cards">specification</a> </li>
    <li>COVID-19 <a href="http://build.fhir.org/ig/HL7/fhir-shc-vaccination-ig">vaccine and testing-specific specification</a> </li>
  </ul>

    

  
  
#### WHO SMART Guideline Development 
  
<a name="smart-guidelines"> </a>

  
<ul>
    <li>WHO <a href="https://www.who.int/teams/digital-health-and-innovation/smart-guidelines">SMART Guidelines</a> overviews the SMART Guidelines approach</li>
    <li>WHO <a href="https://www.who.int/publications/i/item/9789241548960">Handbook for guideline development</a> provides an overview of the WHO guideline development and publication process</li>
  </ul>



  



  
### StructureMaps

  
<div>
    
> *This part of the page (`list-structuremaps.xhtml`) is generated by the IG Publisher and is not reproduced here — see [the published page](https://worldhealthorganization.github.io/smart-trust/maps.html).*

  </div>
 
### License

Creative Commons Attribution 3.0 IGO (CC-BY-3.0-IGO)

#### Summary

This is a human-readable summary of the [Creative Commons Attribution 3.0 IGO (CC-BY-3.0-IGO) License](https://creativecommons.org/licenses/by/3.0/igo/). This summary is not a substitute for the full license text.

Under this license, you are free to:

- Share: Copy and redistribute the material in any medium or format.
- Adapt: Remix, transform, and build upon the material for any purpose, even commercially.

Under the following conditions:

- Attribution: You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

- No Additional Restrictions: You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits.

- International Government Organizations (IGOs): This license is specifically designed for works created by International Government Organizations.

#### License Text

This work is licensed under the [Creative Commons Attribution 3.0 IGO (CC-BY-3.0-IGO) License](https://creativecommons.org/licenses/by/3.0/igo/).

To view a copy of this license, visit [https://creativecommons.org/licenses/by/3.0/igo/](https://creativecommons.org/licenses/by/3.0/igo/) or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
{% endraw %}

---

<small>Source: [`input/pagecontent/indices.md`](https://github.com/litlfred/smart-trust/blob/30d55b3630ac8a8937e1d98f7c060a4ae5a78ef0/input/pagecontent/indices.md) at `30d55b36` · licence CC-BY-SA-3.0-IGO. Rendered from the IG's source by this site, not by the IG Publisher.</small>
