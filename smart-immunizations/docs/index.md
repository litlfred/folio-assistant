---
title: "WHO SMART Immunizations"
description: "All 748 artefacts of the WHO SMART Immunizations IG 0.2.0, reconstructed from its published output."
has_children: true
renders:
  - smart-immunizations/fhir-artifact-index
rendered-by: ig-pages
---
<link rel="stylesheet" href="{{ '/smart-immunizations/assets/ig-pages.css' | relative_url }}">
<link rel="stylesheet" href="{{ '/smart-immunizations/assets/ig-chrome.css' | relative_url }}">

<div class="st-ig">
  <div class="st-ig-bar"><a href="http://smart.who.int/immunizations">smart.who.int.immunizations</a></div>
  <div id="ig-status">
    <p><span class="st-ig-title">WHO SMART Immunizations</span><br/><span>0.2.0</span></p>
  </div>
  <p id="publish-box">This page mirrors a published WHO Implementation Guide. The authoritative version is at <a href="http://smart.who.int/immunizations">http://smart.who.int/immunizations</a>.</p>
</div>

{% include harness_details.html instance="smart-immunizations" %}

## Artefact index

The artefact index of the WHO SMART Immunizations Implementation Guide, rebuilt from what the IG
publishes. Most of it is catalogued **by reference**: the index records where each artefact
lives and holds none of its bytes. An artefact page marked <span class="st-tag st-ref">referenced</span>
is not a broken one — it means upstream, not here.

<div class="st-grid">
<div class="st-stat"><b>748</b><span>artefacts indexed</span></div>
<div class="st-stat"><b>548</b><span>referenced — bytes upstream</span></div>
<div class="st-stat"><b>200</b><span>materialized here</span></div>
<div class="st-stat"><b>0.2.0</b><span>IG version</span></div>
<div class="st-stat"><b>4.0.1</b><span>FHIR version</span></div>
</div>

## Where this came from

No FHIR IG publishes an artefact-index document. What looks like one —
`ValueSets.schema.json` at the published root — is a JSON *Schema* describing the shape of an
enumeration response, carrying an `example` that happens to hold the list. So this index was
**reconstructed**, and every part of it records which published file it came out of.

| | |
|---|---|
| packageManifest | `package.manifest.json` |
| canonicals | `canonicals.json` |
| packageIndex | `package.tgz!package/.index.json` |
| artifactsHtml | `artifacts.html` |
| sidecarEnumerations | `LogicalModels.schema.json, ValueSets.schema.json` |
| source | `gh-pages` — `https://worldhealthorganization.github.io/smart-immunizations` (read 2026-09-21) |
| canonical base | `http://smart.who.int/immunizations` |

## DAK API surface

The IG publishes its DAK API for 198 of its artefacts. The four sidecars are issued
independently — every ValueSet gets all four, the logical models get two — which is why they
are counted separately rather than as one "has DAK API" tally.

<div class="st-grid">
<div class="st-stat"><b>198</b><span>JSON Schema</span></div>
<div class="st-stat"><b>188</b><span>displays</span></div>
<div class="st-stat"><b>198</b><span>OpenAPI</span></div>
<div class="st-stat"><b>190</b><span>JSON-LD</span></div>
</div>

## Every artefact, by category

Grouped and ordered as the IG's own `artifacts.html` groups them, with each artefact's name and
description. Its canonical URL, published representations and whether it is held here are on
its own page.

<nav class="ig-toc" aria-label="Contents" markdown="1">

**Contents**

- [Knowledge Artifacts: Activity Definitions](#cat-Knowledge_Artifacts__Activity_Definitions) — 3
- [Terminology: Code Systems](#cat-Terminology__Code_Systems) — 6
- [Terminology: Concept Maps](#cat-Terminology__Concept_Maps) — 3
- [Knowledge Artifacts: Libraries](#cat-Knowledge_Artifacts__Libraries) — 279
- [Knowledge Artifacts: Measure](#cat-Knowledge_Artifacts__Measure) — 41
- [Example: Example Instances](#cat-Example__Example_Instances) — 36
- [Knowledge Artifacts: Plan Definitions](#cat-Knowledge_Artifacts__Plan_Definitions) — 138
- [Structures: Questionnaires](#cat-Structures__Questionnaires) — 10
- [Structures: Resource Profiles](#cat-Structures__Resource_Profiles) — 5
- [Structures: Extension Definitions](#cat-Structures__Extension_Definitions) — 8
- [Structures: Logical Models](#cat-Structures__Logical_Models) — 10
- [Terminology: Structure Maps](#cat-Terminology__Structure_Maps) — 16
- [Terminology: Value Sets](#cat-Terminology__Value_Sets) — 192
- [Uncategorised](#cat--uncategorised) — 1

</nav>

<details markdown="1" id="cat-Knowledge_Artifacts__Activity_Definitions">
<summary><strong>Knowledge Artifacts: Activity Definitions</strong> — 3</summary>

| Artefact | Description |
|---|---|
| [IMMZ.D2.DT.CR](./artifact/ActivityDefinition-IMMZD2DTCR.html)<br>`ActivityDefinition/IMMZD2DTCR` | Provide immunization communication |
| [IMMZD2DTMR](./artifact/ActivityDefinition-IMMZD2DTMR.html)<br>`ActivityDefinition/IMMZD2DTMR` | Provide immunization |
| [IMMZD5DTMR](./artifact/ActivityDefinition-IMMZD5DTMR.html)<br>`ActivityDefinition/IMMZD5DTMR` | Don't administer immunization due to contraindication |

</details>

<details markdown="1" id="cat-Terminology__Code_Systems">
<summary><strong>Terminology: Code Systems</strong> — 6</summary>

| Artefact | Description |
|---|---|
| [IMMZ.C CodeSystem for Data Elements](./artifact/CodeSystem-IMMZ.C.html)<br>`CodeSystem/IMMZ.C` | CodeSystem for IMMZ.C Data Elements |
| [IMMZ.D CodeSystem for Data Elements](./artifact/CodeSystem-IMMZ.D.html)<br>`CodeSystem/IMMZ.D` | CodeSystem for IMMZ.D Data Elements |
| [IMMZ.Ex CodeSystem for Example values for required data elements](./artifact/CodeSystem-IMMZ.Ex.html)<br>`CodeSystem/IMMZ.Ex` | CodeSystem for IMMZ.Ex Examples |
| [IMMZ.I CodeSystem for Data Elements](./artifact/CodeSystem-IMMZ.I.html)<br>`CodeSystem/IMMZ.I` | CodeSystem for IMMZ.I Data Elements |
| [IMMZ.Z CodeSystem for Data Elements](./artifact/CodeSystem-IMMZ.Z.html)<br>`CodeSystem/IMMZ.Z` | CodeSystem for IMMZ.Z Data Elements |
| [IMMZDAK CodeSystem for Decision Tables](./artifact/CodeSystem-IMMZDAK.html)<br>`CodeSystem/IMMZDAK` | CodeSystem for Decision Tables for the Immunization DAK |

</details>

<details markdown="1" id="cat-Terminology__Concept_Maps">
<summary><strong>Terminology: Concept Maps</strong> — 3</summary>

| Artefact | Description |
|---|---|
| [ConceptMap to and from IMMZ.C DataElements](./artifact/ConceptMap-IMMZ.C.ConceptMap.html)<br>`ConceptMap/IMMZ.C.ConceptMap` | Mapping to and from IMMZ.C Data Dictionary to other codesystems. |
| [ConceptMap to and from IMMZ.D DataElements](./artifact/ConceptMap-IMMZ.D.ConceptMap.html)<br>`ConceptMap/IMMZ.D.ConceptMap` | Mapping to and from IMMZ.D Data Dictionary to other codesystems. |
| [ConceptMap to and from IMMZ.Z DataElements](./artifact/ConceptMap-IMMZ.Z.ConceptMap.html)<br>`ConceptMap/IMMZ.Z.ConceptMap` | Mapping to and from IMMZ.Z Data Dictionary to other codesystems. |

</details>

<details markdown="1" id="cat-Knowledge_Artifacts__Libraries">
<summary><strong>Knowledge Artifacts: Libraries</strong> — 279</summary>

279 artefacts — too many to list here without the index becoming
unreadable. Every one has its own page: **[browse all 279](./category/Knowledge_Artifacts__Libraries.html)**.

</details>

<details markdown="1" id="cat-Knowledge_Artifacts__Measure">
<summary><strong>Knowledge Artifacts: Measure</strong> — 41</summary>

| Artefact | Description |
|---|---|
| [IMMZIND01](./artifact/Measure-IMMZIND01.html)<br>`Measure/IMMZIND01` | IMMZ.IND.01 Immunization coverage for BCG vaccine |
| [IMMZIND02](./artifact/Measure-IMMZIND02.html)<br>`Measure/IMMZIND02` | IMMZ.IND.02 Immunization coverage for pentavalent vaccine, 1st dose |
| [IMMZIND03](./artifact/Measure-IMMZIND03.html)<br>`Measure/IMMZIND03` | IMMZ.IND.03 Immunization coverage for pentavalent vaccine, 2nd dose |
| [IMMZIND04](./artifact/Measure-IMMZIND04.html)<br>`Measure/IMMZIND04` | IMMZ.IND.04 Immunization coverage for pentavalent vaccine, 3rd dose |
| [IMMZIND05](./artifact/Measure-IMMZIND05.html)<br>`Measure/IMMZIND05` | IMMZ.IND.05 Immunization coverage for hepatitis B-containing vaccines (birth dose) |
| [IMMZIND06](./artifact/Measure-IMMZIND06.html)<br>`Measure/IMMZIND06` | IMMZ.IND.06 Immunization coverage for oral polio vaccine (OPV), 1st dose |
| [IMMZIND07](./artifact/Measure-IMMZIND07.html)<br>`Measure/IMMZIND07` | IMMZ.IND.07 Immunization coverage for oral polio vaccine (OPV), 2nd dose |
| [IMMZIND08](./artifact/Measure-IMMZIND08.html)<br>`Measure/IMMZIND08` | IMMZ.IND.08 Immunization coverage for oral polio vaccine (OPV), 3rd dose |
| [IMMZIND09](./artifact/Measure-IMMZIND09.html)<br>`Measure/IMMZIND09` | IMMZ.IND.09 Immunization coverage for inactivated polio vaccine (IPV), 1st dose |
| [IMMZIND10](./artifact/Measure-IMMZIND10.html)<br>`Measure/IMMZIND10` | IMMZ.IND.10 Immunization coverage for inactivated polio vaccine (IPV), 2nd dose |
| [IMMZIND11](./artifact/Measure-IMMZIND11.html)<br>`Measure/IMMZIND11` | IMMZ.IND.11 Immunization coverage for inactivated polio vaccine (IPV), 3rd dose |
| [IMMZIND12](./artifact/Measure-IMMZIND12.html)<br>`Measure/IMMZIND12` | IMMZ.IND.12 Immunization coverage for measles and rubella-containing vaccine, 1st dose |
| [IMMZIND13](./artifact/Measure-IMMZIND13.html)<br>`Measure/IMMZIND13` | IMMZ.IND.13 Immunization coverage for measles and rubella-containing vaccine, 2nd dose |
| [IMMZIND14](./artifact/Measure-IMMZIND14.html)<br>`Measure/IMMZIND14` | IMMZ.IND.14 Immunization coverage for HPV vaccine, 1st dose |
| [IMMZIND15](./artifact/Measure-IMMZIND15.html)<br>`Measure/IMMZIND15` | IMMZ.IND.15 Immunization coverage for HPV vaccine, 2nd dose |
| [IMMZIND16](./artifact/Measure-IMMZIND16.html)<br>`Measure/IMMZIND16` | IMMZ.IND.16 Immunization coverage for meningococcal vaccine |
| [IMMZIND17](./artifact/Measure-IMMZIND17.html)<br>`Measure/IMMZIND17` | IMMZ.IND.17 Immunization coverage for pneumococcal conjugate vaccine, 1st dose |
| [IMMZIND18](./artifact/Measure-IMMZIND18.html)<br>`Measure/IMMZIND18` | IMMZ.IND.18 Immunization coverage for pneumococcal conjugate vaccine, 2nd dose |
| [IMMZIND19](./artifact/Measure-IMMZIND19.html)<br>`Measure/IMMZIND19` | IMMZ.IND.19 Immunization coverage for pneumococcal conjugate vaccine, 3rd dose |
| [IMMZIND20](./artifact/Measure-IMMZIND20.html)<br>`Measure/IMMZIND20` | IMMZ.IND.20 Immunization coverage for rotavirus vaccines, 1st dose |
| [IMMZIND21](./artifact/Measure-IMMZIND21.html)<br>`Measure/IMMZIND21` | IMMZ.IND.21 Immunization coverage for rotavirus vaccines, 2nd dose |
| [IMMZIND22](./artifact/Measure-IMMZIND22.html)<br>`Measure/IMMZIND22` | IMMZ.IND.22 Immunization coverage for rotavirus vaccines, 3rd dose |
| [IMMZIND23](./artifact/Measure-IMMZIND23.html)<br>`Measure/IMMZIND23` | IMMZ.IND.23 Immunization coverage for tetanus and diphtheria-containing vaccines (DT), 4th dose |
| [IMMZIND24](./artifact/Measure-IMMZIND24.html)<br>`Measure/IMMZIND24` | IMMZ.IND.24 Immunization coverage for tetanus and diphtheria-containing vaccines (Td), 5th dose |
| [IMMZIND25](./artifact/Measure-IMMZIND25.html)<br>`Measure/IMMZIND25` | IMMZ.IND.25 Immunization coverage for tetanus and diphtheria-containing vaccines (Td), 6th dose |
| [IMMZIND26](./artifact/Measure-IMMZIND26.html)<br>`Measure/IMMZIND26` | IMMZ.IND.26 Immunization coverage for yellow fever vaccine |
| [IMMZIND27](./artifact/Measure-IMMZIND27.html)<br>`Measure/IMMZIND27` | IMMZ.IND.27 Immunization coverage for JE vaccines |
| [IMMZIND28](./artifact/Measure-IMMZIND28.html)<br>`Measure/IMMZIND28` | IMMZ.IND.28 Immunization coverage for typhoid vaccines |
| [IMMZIND29](./artifact/Measure-IMMZIND29.html)<br>`Measure/IMMZIND29` | IMMZ.IND.29 Immunization coverage for seasonal influenza vaccines |
| [IMMZIND30](./artifact/Measure-IMMZIND30.html)<br>`Measure/IMMZIND30` | IMMZ.IND.30 Immunization coverage for COVID-19 vaccines |
| [IMMZIND31](./artifact/Measure-IMMZIND31.html)<br>`Measure/IMMZIND31` | IMMZ.IND.31 Immunization coverage for malaria vaccines, 1st dose |
| [IMMZIND32](./artifact/Measure-IMMZIND32.html)<br>`Measure/IMMZIND32` | IMMZ.IND.32 Immunization coverage for malaria vaccines, 2nd dose |
| [IMMZIND33](./artifact/Measure-IMMZIND33.html)<br>`Measure/IMMZIND33` | IMMZ.IND.33 Immunization coverage for malaria vaccines, 3rd dose |
| [IMMZIND34](./artifact/Measure-IMMZIND34.html)<br>`Measure/IMMZIND34` | IMMZ.IND.34 Immunization coverage for malaria vaccines, 4th dose |
| [IMMZIND35](./artifact/Measure-IMMZIND35.html)<br>`Measure/IMMZIND35` | IMMZ.IND.35 Drop-out rate of pentavalent vaccine 1st dose to pentavalent vaccine 3rd dose |
| [IMMZIND36](./artifact/Measure-IMMZIND36.html)<br>`Measure/IMMZIND36` | IMMZ.IND.36 Drop-out rate of BCG to measles and rubella-containing vaccine 1st dose |
| [IMMZIND37](./artifact/Measure-IMMZIND37.html)<br>`Measure/IMMZIND37` | IMMZ.IND.37 Drop-out rate from the 1st dose of measles and rubella-containing vaccine to the 2nd dose |
| [IMMZIND38](./artifact/Measure-IMMZIND38.html)<br>`Measure/IMMZIND38` | IMMZ.IND.38 Drop-out rate from the 1st dose of malaria vaccines to the 3rd dose |
| [IMMZIND39](./artifact/Measure-IMMZIND39.html)<br>`Measure/IMMZIND39` | IMMZ.IND.39 Drop-out rate from the 3rd dose of malaria vaccines to the 4th dose |
| [IMMZIND44](./artifact/Measure-IMMZIND44.html)<br>`Measure/IMMZIND44` | IMMZ.IND.44 Adverse event following immunization (AEFI) cases |
| [IMMZIND45](./artifact/Measure-IMMZIND45.html)<br>`Measure/IMMZIND45` | IMMZ.IND.45 Immunization session completion rate |

</details>

<details markdown="1" id="cat-Example__Example_Instances">
<summary><strong>Example: Example Instances</strong> — 36</summary>

| Artefact | Description |
|---|---|
| [Thabo Mbulelo Mbeki](./artifact/Patient-IMMZ.C.Patient.1.html)<br>`Patient/IMMZ.C.Patient.1` | Example of a patient: Thabo Mbulelo Mbeki. |
| [Zanele Mbeki](./artifact/Patient-IMMZ.C.Patient.2.html)<br>`Patient/IMMZ.C.Patient.2` | Example of a patient: Zanele Mbeki. |
| [Example QuestionnaireResponse for Client Registration](./artifact/QuestionnaireResponse-Example.IMMZ.C.QuestionnaireResponse.1.html)<br>`QuestionnaireResponse/Example.IMMZ.C.QuestionnaireResponse.1` | Example QuestionnaireResponse for IMMZ.C4.Create client record OR IMMZ.C5.3.Update client details |
| [Example QuestionnaireReponse for Capture Client History for BCG](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.BCG.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.BCG` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving BCG vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Cholera](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Cholera.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Cholera` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Cholera vaccine. |
| [Example QuestionnaireReponse for Capture Client History for COVID](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.COVID.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.COVID` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving COVID vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Dengue](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Dengue.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Dengue` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Dengue vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Diphtheria](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Diphtheria.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Diphtheria` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Diphtheria vaccine. |
| [Example QuestionnaireReponse for Capture Client History for DTP](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.DTP.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.DTP` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving DTP vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Flu](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Flu.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Flu` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Flu vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Hepatitis A](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.HepA.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.HepA` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Hepatitis A vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Hepatitis B](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.HepB.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.HepB` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Hepatitis B vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Haemophilus influenzae type b](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Hib.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Hib` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Haemophilus influenzae type b vaccine. |
| [Example QuestionnaireReponse for Capture Client History for HPV](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.HPV.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.HPV` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving HPV vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Japanese Encephalitis](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.JE.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.JE` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Japanese Encephalitis vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Malaris](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Malaria.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Malaria` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Malaris vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Measles](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Measles.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Measles` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Measles vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Meningococcal](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Meningococcal.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Meningococcal` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Meningococcal vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Mumps](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Mumps.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Mumps` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Mumps vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Pertussis](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Pertussis.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Pertussis` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Pertussis vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Pneumococcal](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Pneumococcal.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Pneumococcal` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Pneumococcal vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Polio](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Polio.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Polio` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Polio vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Rabies](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Rabies.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Rabies` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Rabies vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Rotavirus](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Rotavirus.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Rotavirus` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Rotavirus vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Rubella](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Rubella.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Rubella` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Rubella vaccine. |
| [Example QuestionnaireReponse for Capture Client History for TBE](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.TBE.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.TBE` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving TBE vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Tetanus](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Tetanus.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Tetanus` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Tetanus vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Typhoid](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Typhoid.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Typhoid` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Typhoid vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Varicella](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.Varicella.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.Varicella` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Varicella vaccine. |
| [Example QuestionnaireReponse for Capture Client History for Yellow Fever](./artifact/QuestionnaireResponse-Example.IMMZ.D1.QuestionnaireResponse.YellowFever.html)<br>`QuestionnaireResponse/Example.IMMZ.D1.QuestionnaireResponse.YellowFever` | Example QuestionnaireReponse for IMMZ.D1.Capture or update client history. For patient receiving Yellow Fever vaccine. |
| [Example QuestionnaireReponse for Update Client History for BCG](./artifact/QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.BCG.html)<br>`QuestionnaireResponse/Example.IMMZ.D13.QuestionnaireResponse.BCG` | Example QuestionnaireReponse for IMMZ.D13.Update client record. For patient receiving BCG vaccine. |
| [Example QuestionnaireReponse for Update Client History for Measles](./artifact/QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.Measles.html)<br>`QuestionnaireResponse/Example.IMMZ.D13.QuestionnaireResponse.Measles` | Example QuestionnaireReponse for IMMZ.D13.Update client record. For patient receiving Measles vaccine. |
| [Example QuestionnaireReponse for Update Client History for Measles](./artifact/QuestionnaireResponse-Example.IMMZ.D13.QuestionnaireResponse.Measles.2.html)<br>`QuestionnaireResponse/Example.IMMZ.D13.QuestionnaireResponse.Measles.2` | Example QuestionnaireReponse for IMMZ.D13.Update client record. For patient receiving Measles vaccine. |
| [Example QuestionnaireReponse for Report AEFI](./artifact/QuestionnaireResponse-Example.IMMZ.D17.QuestionnaireResponse.1.html)<br>`QuestionnaireResponse/Example.IMMZ.D17.QuestionnaireResponse.1` | Example QuestionnaireReponse for IMMZ.D17.Report AEFI. |
| [Example QuestionnaireReponse for Contraindications](./artifact/QuestionnaireResponse-Example.IMMZ.D5.QuestionnaireResponse.1.html)<br>`QuestionnaireResponse/Example.IMMZ.D5.QuestionnaireResponse.1` | Example QuestionnaireReponse for IMMZ.D5.Determine vaccine(s) to be administered based on contraindications. |
| [Zanele Mbeki](./artifact/RelatedPerson-IMMZ.C.Caregiver.1.html)<br>`RelatedPerson/IMMZ.C.Caregiver.1` | Example of a caregiver: Zanele Mbeki. |

</details>

<details markdown="1" id="cat-Knowledge_Artifacts__Plan_Definitions">
<summary><strong>Knowledge Artifacts: Plan Definitions</strong> — 138</summary>

138 artefacts — too many to list here without the index becoming
unreadable. Every one has its own page: **[browse all 138](./category/Knowledge_Artifacts__Plan_Definitions.html)**.

</details>

<details markdown="1" id="cat-Structures__Questionnaires">
<summary><strong>Structures: Questionnaires</strong> — 10</summary>

| Artefact | Description |
|---|---|
| [IMMZ.C4.Create client record](./artifact/Questionnaire-QIMMZC4.html)<br>`Questionnaire/QIMMZC4` | Questionnaire for IMMZ.C4.Create client record |
| [IMMZ.D1.Capture or update client history](./artifact/Questionnaire-QIMMZD1.html)<br>`Questionnaire/QIMMZD1` | Questionnaire for IMMZ.D1.Capture or update client history |
| [IMMZ.D13.Update client record](./artifact/Questionnaire-QIMMZD13.html)<br>`Questionnaire/QIMMZD13` | Questionnaire for IMMZ.D13.Update client record |
| [IMMZ.D17.Report AEFI](./artifact/Questionnaire-QIMMZD17.html)<br>`Questionnaire/QIMMZD17` | Questionnaire for IMMZ.D17.Report AEFI |
| [IMMZ.D18.Determine time for next visit](./artifact/Questionnaire-QIMMZD18.html)<br>`Questionnaire/QIMMZD18` | Questionnaire for IMMZ.D18.Determine time for next visit |
| [IMMZ.D2.Determine required vaccination(s)](./artifact/Questionnaire-QIMMZD2.html)<br>`Questionnaire/QIMMZD2` | Questionnaire for IMMZ.D2.Determine required vaccination(s) |
| [IMMZ.D20.Does client require a verifiable digital certificate](./artifact/Questionnaire-QIMMZD20.html)<br>`Questionnaire/QIMMZD20` | Questionnaire for IMMZ.D20.Does client require a verifiable digital certificate |
| [IMMZ.D21.Generate verifiable digital certificate](./artifact/Questionnaire-QIMMZD21.html)<br>`Questionnaire/QIMMZD21` | Questionnaire for IMMZ.D21.Generate verifiable digital certificate |
| [IMMZ.D5.Determine vaccine(s) to be administered based on contraindications](./artifact/Questionnaire-QIMMZD5.html)<br>`Questionnaire/QIMMZD5` | Questionnaire for IMMZ.D5.Determine vaccine(s) to be administered based on contraindications |
| [IMMZ.D7.Counsel client](./artifact/Questionnaire-QIMMZD7.html)<br>`Questionnaire/QIMMZD7` | Questionnaire for IMMZ.D7.Counsel client |

</details>

<details markdown="1" id="cat-Structures__Resource_Profiles">
<summary><strong>Structures: Resource Profiles</strong> — 5</summary>

| Artefact | Description |
|---|---|
| [SMART Guidelines Immunizations AdverseEvent](./artifact/StructureDefinition-IMMZ.AdverseEvent.html)<br>`StructureDefinition/IMMZ.AdverseEvent` | AdverseEvent Profile for the Immunizations SMART Guidelines. From IMMZ.D17 Report AEFI |
| [SMART Guidelines Immunizations Caregiver (RelatedPerson)](./artifact/StructureDefinition-IMMZ.Caregiver.html)<br>`StructureDefinition/IMMZ.Caregiver` | Caregiver (RelatedPerson) Profile for the Immunizations SMART Guidelines. From IMMZ.C Client Registration for IMMZ.C4.Create client record OR IMMZ.C5.3.Update client details. |
| [SMART Guidelines Immunizations Immunization](./artifact/StructureDefinition-IMMZ.Immunization.html)<br>`StructureDefinition/IMMZ.Immunization` | Immunization Profile for the Immunizations SMART Guidelines. From IMMZ.D Administer Vaccine |
| [SMART Guidelines Immunizations Observation](./artifact/StructureDefinition-IMMZ.Observation.html)<br>`StructureDefinition/IMMZ.Observation` | Observation Profile for the Immunizations SMART Guidelines. From IMMZ.D Administer Vaccine |
| [SMART Guidelines Immunizations Patient](./artifact/StructureDefinition-IMMZ.Patient.html)<br>`StructureDefinition/IMMZ.Patient` | Patient Profile for the Immunizations SMART Guidelines. From IMMZ.C Client Registration for IMMZ.C4.Create client record OR IMMZ.C5.3.Update client details. |

</details>

<details markdown="1" id="cat-Structures__Extension_Definitions">
<summary><strong>Structures: Extension Definitions</strong> — 8</summary>

| Artefact | Description |
|---|---|
| [Immunization Administrative Area](./artifact/StructureDefinition-IMMZAdministrativeArea.html)<br>`StructureDefinition/IMMZAdministrativeArea` | The service delivery location (location name, city, municipality, town or village) where the vaccine administration occurred |
| [Immunization Country of Vaccination](./artifact/StructureDefinition-IMMZCountryOfVaccination.html)<br>`StructureDefinition/IMMZCountryOfVaccination` | The service delivery country where the vaccine administration occurred |
| [Immunization Due Date of Next Dose](./artifact/StructureDefinition-IMMZDueDateOfNextDose.html)<br>`StructureDefinition/IMMZDueDateOfNextDose` | The service delivery location (location name, city, municipality, town or village) where the vaccine administration occurred |
| [Immunization Live Vaccine](./artifact/StructureDefinition-IMMZLiveVaccine.html)<br>`StructureDefinition/IMMZLiveVaccine` | Uses a living but weakened version of the virus or one that is very similar |
| [Immunization Market Authorization Holder](./artifact/StructureDefinition-IMMZMarketAuthorization.html)<br>`StructureDefinition/IMMZMarketAuthorization` | Name of the market authorization holder of the vaccine received. If market authorization holder is unknown, vaccine manufacturer is REQUIRED |
| [Immunization Other Important Medical Event](./artifact/StructureDefinition-IMMZOtherMedicalEvent.html)<br>`StructureDefinition/IMMZOtherMedicalEvent` | There was another important reaction or medical event |
| [Immunization Type of Dose](./artifact/StructureDefinition-IMMZTypeOfDose.html)<br>`StructureDefinition/IMMZTypeOfDose` | The type of dose in a series that the client received |
| [Immunization Vaccine Brand](./artifact/StructureDefinition-IMMZVaccineBrand.html)<br>`StructureDefinition/IMMZVaccineBrand` | The brand or trade name used to refer to the vaccine received |

</details>

<details markdown="1" id="cat-Structures__Logical_Models">
<summary><strong>Structures: Logical Models</strong> — 10</summary>

| Artefact | Description |
|---|---|
| [IMMZ.C4.Create client record](./artifact/StructureDefinition-IMMZC4.html)<br>`StructureDefinition/IMMZC4` | Data elements for the IMMZ.C4.Create client record Data Dictionary Activity. Identical to IMMZ.C5.3.Update client details. |
| [IMMZ.D1.Capture or update client history](./artifact/StructureDefinition-IMMZD1.html)<br>`StructureDefinition/IMMZD1` | Data elements for the IMMZ.D1.Capture or update client history Data Dictionary Activity. |
| [IMMZ.D13.Update client record](./artifact/StructureDefinition-IMMZD13.html)<br>`StructureDefinition/IMMZD13` | Data elements for the IMMZ.D13.Update client record Data Dictionary Activity. |
| [IMMZ.D17.Report AEFI](./artifact/StructureDefinition-IMMZD17.html)<br>`StructureDefinition/IMMZD17` | Data elements for the IMMZ.D17.Report AEFI Data Dictionary Activity. |
| [IMMZ.D18.Determine time for next visit](./artifact/StructureDefinition-IMMZD18.html)<br>`StructureDefinition/IMMZD18` | Data elements for the IMMZ.D18.Determine time for next visit Data Dictionary Activity. |
| [IMMZ.D2.Determine required vaccination(s)](./artifact/StructureDefinition-IMMZD2.html)<br>`StructureDefinition/IMMZD2` | Data elements for the IMMZ.D2.Determine required vaccination(s) Data Dictionary Activity. |
| [IMMZ.D20.Does client require a verifiable digital certificate](./artifact/StructureDefinition-IMMZD20.html)<br>`StructureDefinition/IMMZD20` | Data elements for the IMMZ.D20.Does client require a verifiable digital certificate Data Dictionary Activity. |
| [IMMZ.D21.Generate verifiable digital certificate](./artifact/StructureDefinition-IMMZD21.html)<br>`StructureDefinition/IMMZD21` | Data elements for the IMMZ.D21.Generate verifiable digital certificate Data Dictionary Activity. |
| [IMMZ.D5.Determine vaccine(s) to be administered based on contraindications](./artifact/StructureDefinition-IMMZD5.html)<br>`StructureDefinition/IMMZD5` | Data elements for the IMMZ.D5.Determine vaccine(s) to be administered based on contraindications Data Dictionary Activity. |
| [IMMZ.D7.Counsel client](./artifact/StructureDefinition-IMMZD7.html)<br>`StructureDefinition/IMMZD7` | Data elements for the IMMZ.D7.Counsel client Data Dictionary Activity. |

</details>

<details markdown="1" id="cat-Terminology__Structure_Maps">
<summary><strong>Terminology: Structure Maps</strong> — 16</summary>

| Artefact | Description |
|---|---|
| [IMMZ.C4.LMToPatient](./artifact/StructureMap-IMMZ.C4.LMToPatient.html)<br>`StructureMap/IMMZ.C4.LMToPatient` | Immunization Client Registry - Transform Logical Model to Patient resources |
| [IMMZ.C4.QRToLM](./artifact/StructureMap-IMMZ.C4.QRToLM.html)<br>`StructureMap/IMMZ.C4.QRToLM` | Immunization Client Registry - Transform QuestionnaireResponse to Logical Model |
| [IMMZ.C4.QRToPatient](./artifact/StructureMap-IMMZ.C4.QRToPatient.html)<br>`StructureMap/IMMZ.C4.QRToPatient` | Immunization Client Registry - Transform QuestionnaireResponse to Patient resources |
| [IMMZ.D1.LMToBundle](./artifact/StructureMap-IMMZ.D1.LMToBundle.html)<br>`StructureMap/IMMZ.D1.LMToBundle` | Immunization Administer Vaccine - Transform Logical Model to Immunization resources |
| [IMMZ.D1.QRToBundle](./artifact/StructureMap-IMMZ.D1.QRToBundle.html)<br>`StructureMap/IMMZ.D1.QRToBundle` | Immunization Administer Vaccine - Transform QuestionnaireResponse to Immunization resources |
| [IMMZ.D1.QRToLM](./artifact/StructureMap-IMMZ.D1.QRToLM.html)<br>`StructureMap/IMMZ.D1.QRToLM` | Immunization Administer Vaccine - Transform QuestionnaireResponse to Logical Model |
| [IMMZ.D13.LMToBundle](./artifact/StructureMap-IMMZ.D13.LMToBundle.html)<br>`StructureMap/IMMZ.D13.LMToBundle` | Immunization Administer Vaccine - Transform Logical Model to Immunization resources |
| [IMMZ.D13.QRToBundle](./artifact/StructureMap-IMMZ.D13.QRToBundle.html)<br>`StructureMap/IMMZ.D13.QRToBundle` | Immunization Administer Vaccine - Transform QuestionnaireResponse to Immunization resources |
| [IMMZ.D13.QRToLM](./artifact/StructureMap-IMMZ.D13.QRToLM.html)<br>`StructureMap/IMMZ.D13.QRToLM` | Immunization Administer Vaccine - Transform QuestionnaireResponse to Logical Model |
| [IMMZ.D17.LMToBundle](./artifact/StructureMap-IMMZ.D17.LMToBundle.html)<br>`StructureMap/IMMZ.D17.LMToBundle` | Immunization Administer Vaccine - Transform Logical Model to Immunization resources |
| [IMMZ.D17.QRToBundle](./artifact/StructureMap-IMMZ.D17.QRToBundle.html)<br>`StructureMap/IMMZ.D17.QRToBundle` | Immunization Administer Vaccine - Transform QuestionnaireResponse to Immunization resources |
| [IMMZ.D17.QRToLM](./artifact/StructureMap-IMMZ.D17.QRToLM.html)<br>`StructureMap/IMMZ.D17.QRToLM` | Immunization Report AEFI - Transform QuestionnaireResponse to Logical Model |
| [IMMZ.D5.LMToBundle](./artifact/StructureMap-IMMZ.D5.LMToBundle.html)<br>`StructureMap/IMMZ.D5.LMToBundle` | Immunization Administer Vaccine - Transform Logical Model to Immunization resources |
| [IMMZ.D5.QRToBundle](./artifact/StructureMap-IMMZ.D5.QRToBundle.html)<br>`StructureMap/IMMZ.D5.QRToBundle` | Immunization Administer Vaccine - Transform QuestionnaireResponse to Immunization resources |
| [IMMZ.D5.QRToLM](./artifact/StructureMap-IMMZ.D5.QRToLM.html)<br>`StructureMap/IMMZ.D5.QRToLM` | Immunization Administer Vaccine - Transform QuestionnaireResponse to Logical Model |
| [IMMZ.Helpers](./artifact/StructureMap-IMMZ.Helpers.html)<br>`StructureMap/IMMZ.Helpers` | Immunization - Transform QuestionnaireResponse to Logical Model Helper groups |

</details>

<details markdown="1" id="cat-Terminology__Value_Sets">
<summary><strong>Terminology: Value Sets</strong> — 192</summary>

192 artefacts — too many to list here without the index becoming
unreadable. Every one has its own page: **[browse all 192](./category/Terminology__Value_Sets.html)**.

</details>

<details markdown="1" id="cat--uncategorised">
<summary><strong>Uncategorised</strong> — 1</summary>

| Artefact | Description |
|---|---|
| [Immunizations](./artifact/ImplementationGuide-smart.who.int.immunizations.html)<br>`ImplementationGuide/smart.who.int.immunizations` |  |

</details>
