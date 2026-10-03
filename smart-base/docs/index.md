---
title: "WHO SMART Base"
description: "All 225 artefacts of the WHO SMART Base IG 0.3.0, reconstructed from its published output."
has_children: true
renders:
  - smart-base/fhir-artifact-index
rendered-by: ig-pages
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

{% include harness_details.html instance="smart-base" %}

## Artefact index

The artefact index of the WHO SMART Base Implementation Guide, rebuilt from what the IG
publishes. Most of it is catalogued **by reference**: the index records where each artefact
lives and holds none of its bytes. An artefact page marked <span class="st-tag st-ref">referenced</span>
is not a broken one — it means upstream, not here.

<div class="st-grid">
<div class="st-stat"><b>225</b><span>artefacts indexed</span></div>
<div class="st-stat"><b>178</b><span>referenced — bytes upstream</span></div>
<div class="st-stat"><b>47</b><span>materialized here</span></div>
<div class="st-stat"><b>0.3.0</b><span>IG version</span></div>
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
| source | `gh-pages` — `https://worldhealthorganization.github.io/smart-base` (read 2026-09-22) |
| canonical base | `http://smart.who.int/base` |

## DAK API surface

The IG publishes its DAK API for 47 of its artefacts. The four sidecars are issued
independently — every ValueSet gets all four, the logical models get two — which is why they
are counted separately rather than as one "has DAK API" tally.

<div class="st-grid">
<div class="st-stat"><b>47</b><span>JSON Schema</span></div>
<div class="st-stat"><b>22</b><span>displays</span></div>
<div class="st-stat"><b>47</b><span>OpenAPI</span></div>
<div class="st-stat"><b>22</b><span>JSON-LD</span></div>
</div>

## Every artefact, by category

Grouped and ordered as the IG's own `artifacts.html` groups them, with each artefact's name and
description. Its canonical URL, published representations and whether it is held here are on
its own page.

<nav class="ig-toc" aria-label="Contents" markdown="1">

**Contents**

- [Requirements: Actor Definitions](#cat-Requirements__Actor_Definitions) — 22
- [Terminology: Code Systems](#cat-Terminology__Code_Systems) — 12
- [Terminology: Concept Maps](#cat-Terminology__Concept_Maps) — 4
- [Structures: Questionnaires](#cat-Structures__Questionnaires) — 1
- [Requirements: Formal Requirements](#cat-Requirements__Formal_Requirements) — 41
- [Structures: Logical Models](#cat-Structures__Logical_Models) — 25
- [Structures: Extension Definitions](#cat-Structures__Extension_Definitions) — 11
- [Conformance](#cat-Conformance) — 17
- [Structures: Resource Profiles](#cat-Structures__Resource_Profiles) — 3
- [Terminology: Value Sets](#cat-Terminology__Value_Sets) — 24
- [Uncategorised](#cat--uncategorised) — 65

</nav>

<details markdown="1" id="cat-Requirements__Actor_Definitions">
<summary><strong>Requirements: Actor Definitions</strong> — 22</summary>

| Artefact | Description |
|---|---|
| [Community Health Worker](./artifact/ActorDefinition-DAK.Persona.CommunityHealthWorker.html)<br>`ActorDefinition/DAK.Persona.CommunityHealthWorker` | A frontline member of the health workforce who delivers health interventions at the community level, acting as a link between communities and formal health facilities. Community health workers are a key sub-group of healthcare providers. Community health workers use DHIs to: Register and follow-up community members (2.1, 2.2.1) Receive community-based decision support and job aids (2.3) Report public health events from point of diagnosis (3.3.1) Access mobile training and competency assessments (2.8) Communicate with supervising clinical staff (2.5.1) Manage their daily visit planning and activities (2.7) ISCO-08 : 3255 (Community health workers), 5321 (Health care assistants). Examples : Village health worker, health extension worker, community health volunteer, lay health advisor, peer educator, traditional birth attendant, community case manager. |
| [Health Data Manager and Analyst](./artifact/ActorDefinition-DAK.Persona.DataManager.html)<br>`ActorDefinition/DAK.Persona.DataManager` | A professional who manages, analyses, and disseminates health data to support evidence-based decision-making. This corresponds to the 'Data services' user group in CDISAH v2, providing crosscutting functionality across the health system. Data managers use DHIs to: Create data collection forms and manage data acquisition (4.1.1) Store and aggregate health data (4.1.2) Synthesise and visualise data for reporting and dashboards (4.1.3) Apply automated analytics and predictive modelling including AI/ML (4.1.4) Parse, de-duplicate, and curate coded datasets and terminologies (4.2) Classify disease codes and causes of mortality (4.2.3) Map geographic locations of facilities, events, populations, and providers (4.3) Enable point-to-point data integration and standards-compliant interoperability (4.4) Maintain data governance including authentication, privacy, and consent (4.5) ISCO-08 : 2120 (Mathematicians, actuaries and statisticians), 2521 (Database designers and administrators), 2523 (Computer network professionals), 3120 (Computer network and systems technicians). Examples : Biostatistician, epidemiologist, health informatician, data analyst, DHIS2 administrator, GIS specialist, interoperability engineer, terminology manager. |
| [Healthcare Provider](./artifact/ActorDefinition-DAK.Persona.HealthcareProvider.html)<br>`ActorDefinition/DAK.Persona.HealthcareProvider` | A member of the health workforce who delivers health interventions. This group has also been described as 'health workers' or 'healthcare workers'. Healthcare providers use DHIs to: Identify and register persons for health services (2.1) Manage person-centred health records (2.2) Receive clinical decision support prompts and checklists (2.3) Conduct telemedicine consultations and remote monitoring (2.4) Communicate with supervisors, peers, and receive AI-assisted content (2.5) Coordinate referrals and emergency transport (2.6) Schedule and plan their clinical activities (2.7) Access training content and assessments (2.8) Manage prescriptions and medication adherence (2.9) Order and receive laboratory and diagnostic results (2.10) Verify health coverage and receive payments from individuals (2.11) ISCO-08 : 2211 (Generalist medical practitioners), 2212 (Specialist medical practitioners), 2221 (Nursing professionals), 2222 (Midwifery professionals), 3211 (Medical imaging and therapeutic equipment technicians), 3212 (Medical and pathology laboratory technicians), 3213 (Pharmaceutical technicians and assistants), 3221 (Nursing associate professionals), 3222 (Midwifery associate professionals), 3255 (Community health workers). Examples : Physician, nurse, midwife, clinical officer, pharmacist, laboratory technician, dentist, allied health professional. |
| [Health System Manager](./artifact/ActorDefinition-DAK.Persona.HealthSystemManager.html)<br>`ActorDefinition/DAK.Persona.HealthSystemManager` | A professional involved in the administration and oversight of health systems. Health system managers use DHIs to: Manage health workforce information, performance, and certification (3.1) Oversee supply chain, inventory, cold chain, and procurement (3.2) Receive notifications of public health events (3.3) Register and certify vital events — births and deaths (3.4) Administer health coverage schemes, billing, payroll, and budgets (3.5) Monitor and track health equipment and assets (3.6) Manage health facility information and conduct assessments (3.7) Manage person-centred health certificate information (3.8) ISCO-08 : 1342 (Health services managers), 2446 (Social work professionals n.e.c.), 3354 (Government social benefits officials), 4311 (Accounting and bookkeeping clerks). Examples : District health officer, programme manager, supply chain officer, HMIS coordinator, hospital administrator, vital registration officer, health insurance administrator. |
| [Person (Health Service User)](./artifact/ActorDefinition-DAK.Persona.Person.html)<br>`ActorDefinition/DAK.Persona.Person` | A member of the public who is a potential or current user of health services, including health prevention and wellness activities. Other terms used for this group include 'patient', 'client', 'individual', and 'health service user'. Caregivers of individuals receiving health services are also included. Persons interact with DHIs to: Receive targeted (1.1) and untargeted (1.2) health communications Communicate with other persons as peers (1.3) Track their own health data and records (1.4) Report health events and system feedback (1.5) Access health information on demand including via chatbot/AI (1.6) Manage their financial transactions related to health services (1.7) Manage their consent for health data access and sharing (1.8) ISCO-08 : Not applicable (non-occupational role). Examples : Patient, pregnant woman, caregiver, child, community member, health scheme beneficiary, person living with a chronic condition. |
| [Client Registry / Master Patient Index](./artifact/ActorDefinition-DAK.Persona.System.ClientRegistry.html)<br>`ActorDefinition/DAK.Persona.System.ClientRegistry` | A digital system that creates, maintains, and provides authoritative unique identifiers for individuals (persons) accessing health services, enabling cross-facility patient matching and de-duplication. The client registry supports DHIs including: Verify a person's unique identity (2.1.1) Enrol person(s) for health services/clinical care plan (2.1.2) Merge, de-duplicate and curate coded datasets (4.2.2) Standards-compliant interoperability to link records across systems (4.4.2) Services and Application Types : C6 — Identification registries and directories C8 — Master patient index |
| [Electronic Medical Record (EMR) System](./artifact/ActorDefinition-DAK.Persona.System.EMR.html)<br>`ActorDefinition/DAK.Persona.System.EMR` | A secure, digital system that holds information about people's health and clinical care managed by healthcare providers. Also referred to as an Electronic Health Record (EHR). The EMR system supports DHIs including: Longitudinal tracking of person's health status and services (2.2.1) Management of structured clinical records (2.2.2) Management of unstructured clinical records such as notes and images (2.2.3) Clinical decision support prompts and checklists (2.3) Person identification and registration (2.1) Prescription and medication management (2.9) Laboratory results reception (2.10.1) Routine health indicator data collection (2.2.4) Services and Application Type : A5 — Electronic medical record systems Functional areas : Clinical decision support, record management, person registration, appointment scheduling, referral tracking. |
| [Health Management Information System (HMIS)](./artifact/ActorDefinition-DAK.Persona.System.HMIS.html)<br>`ActorDefinition/DAK.Persona.System.HMIS` | A digital system used to collect, process, report, and use aggregate health data for programme planning, monitoring, and evaluation at district and national levels. The HMIS supports DHIs including: Routine health indicator data collection and management (2.2.4) Non-routine data collection and management (4.1.1) Data storage and aggregation (4.1.2) Data synthesis and visualisations (4.1.3) Data exchange across systems (4.4) Services and Application Type : D6 — Health Management Information Systems (HMIS) Functional areas : Data collection, reporting dashboards, target monitoring, programme performance tracking, data quality management. |
| [Health Information Exchange / Interoperability Platform](./artifact/ActorDefinition-DAK.Persona.System.InteropPlatform.html)<br>`ActorDefinition/DAK.Persona.System.InteropPlatform` | A middleware system or shared infrastructure that enables health data exchange between disparate health information systems using standard protocols and formats. The interoperability platform supports DHIs including: Point-to-point data integration (4.4.1) Standards-compliant interoperability (4.4.2) Message routing to appropriate architecture components (4.4.3) Data storage and aggregation across systems (4.1.2) Services and Application Type : D2 — Data interchange and interoperability Functional areas : Semantic interoperability, technical interoperability, information exchange, data mediation, enterprise service bus. |
| [Laboratory Information System (LIS)](./artifact/ActorDefinition-DAK.Persona.System.LIS.html)<br>`ActorDefinition/DAK.Persona.System.LIS` | A digital system that manages the complete lifecycle of laboratory test orders, specimen tracking, result production, and result reporting to healthcare providers and persons. The LIS supports DHIs including: Transmit and track diagnostic orders (2.10.2) Capture diagnostic results from digital devices (2.10.3) Transmit person's diagnostic result to healthcare provider (2.10.1) Transmit diagnostics result or availability of result to person(s) (1.1.4) Track biological specimens (2.10.4) Services and Application Type : A6 — Laboratory information systems Functional areas : Lab requests/test ordering, sample tracking, sample processing, results reporting. |
| [Logistics Management Information System (LMIS)](./artifact/ActorDefinition-DAK.Persona.System.LMIS.html)<br>`ActorDefinition/DAK.Persona.System.LMIS` | A digital system that manages the health supply chain from quantification and forecasting through distribution, inventory management, and consumption tracking. The LMIS supports DHIs including: Manage inventory and distribution of health commodities (3.2.1) Notify stock levels of health commodities (3.2.2) Monitor cold-chain sensitive commodities (3.2.3) Register licensed drugs and health commodities (3.2.4) Manage procurement of commodities (3.2.5) Services and Application Type : B6 — Logistics management information systems (LMIS) |
| [Public Health and Disease Surveillance System](./artifact/ActorDefinition-DAK.Persona.System.SurveillanceSystem.html)<br>`ActorDefinition/DAK.Persona.System.SurveillanceSystem` | A digital system for detecting, monitoring, investigating, and responding to disease outbreaks and public health threats. The surveillance system supports DHIs including: Notification of public health events from point of diagnosis (3.3.1) Transmit health event alerts to specific population group(s) (1.1.1) Map location of health event (4.3.2) Data synthesis and visualizations for outbreak response (4.1.3) Automated analysis of data to generate predictions (4.1.4) Services and Application Type : E2 — Public health and disease surveillance systems |
| [Business Analyst](./artifact/ActorDefinition-SGAuthoring.Persona.BusinessAnalyst.html)<br>`ActorDefinition/SGAuthoring.Persona.BusinessAnalyst` | A digital health informatician specializing in business analysis who authors L2 DAK components. Business analysts translate clinical guidelines and normative products into structured DAK artifacts including business processes, data dictionaries, decision-support logic, and requirements. Key activities: Review L1 source documents and extract structured content Author generic personas based on task-shifting guidelines Create user scenario narratives Design BPMN 2.0 business process diagrams Define core data elements and data dictionary Develop decision-support logic tables (DMN standard) Develop scheduling logic tables Define indicators and performance metrics Capture functional and non-functional requirements Streamline content across DAK components for consistency Source : IG Starter Kit, L2 DAK Authoring, Section 2.1 "Fill in DAK components"; Community of Practice page |
| [Clinical Subject Matter Expert](./artifact/ActorDefinition-SGAuthoring.Persona.ClinicalSME.html)<br>`ActorDefinition/SGAuthoring.Persona.ClinicalSME` | A clinician or subject matter expert (SME) of a specific health area who validates the clinical accuracy and completeness of DAK content against WHO guidelines and other normative products. SMEs should be the authors of the source documents or recognized experts actively engaged in, if not leading, the collaborative development of the DAKs. Key activities: Validate that DAK components accurately reflect L1 recommendations Provide clinical ground-truthing through country visits and interviews Identify gaps or needed changes in DAK content Review decision-support logic for clinical correctness Confirm that workflows represent 80% of clinical scenarios Validate personas against real-world practice settings Advise on cross-programme overlaps (e.g. TB/HIV indicators) Source : IG Starter Kit, L2 DAK Authoring, Sections 1 "Plan" and 2.2 "Validate" |
| [Content Reviewer / Approver](./artifact/ActorDefinition-SGAuthoring.Persona.ContentReviewer.html)<br>`ActorDefinition/SGAuthoring.Persona.ContentReviewer` | A designated reviewer responsible for approving SMART Guidelines content at key decision gates in the authoring lifecycle. Content Reviewers ensure that DAK and IG content meets quality standards, accurately reflects WHO normative guidance, and is ready to proceed to the next phase. Content Reviewers may be senior technical officers, programme leads, or designated governance committee members. They provide formal sign-off at phase transitions (L2→L3, draft→publication). Key activities: Review and approve L2 DAK content before L3 authoring begins Review and approve L3 IG content before publication Assess whether content changes are breaking or non-breaking Approve draft publications for stakeholder circulation Provide final sign-off for release publication Ensure content aligns with WHO guidelines governance policies Participate in cross-programme content harmonization reviews Source : IG Starter Kit, Publication page (review process); DAK Authoring, Section 2.2 "Validate DAK content with SMEs" |
| [FHIR Modeller](./artifact/ActorDefinition-SGAuthoring.Persona.FHIRModeller.html)<br>`ActorDefinition/SGAuthoring.Persona.FHIRModeller` | An L3 author who creates machine-readable FHIR artifacts from L2 DAK specifications. FHIR Modellers use FSH (FHIR Shorthand), SUSHI, and the IG Publisher toolchain to produce conformant Implementation Guides. Key activities: Verify L2 input availability and consistency Author FHIR Logical Models from L2 data dictionaries Create FHIR Profiles (StructureDefinitions) Author FHIR Questionnaires from L2 forms Write CQL for decision logic, scheduling logic, and indicators Create StructureMaps for data extraction Author PlanDefinitions for business processes and decision tables Create ActorDefinitions from L2 personas (reusing Commons repository) Create ExampleScenario resources from L2 user scenarios Author FHIR Measure resources from L2 indicators Create FHIR Requirements resources Develop test cases (TestPlan, TestScript, example instances) Ensure all artifacts conform to CRMI Shareable/Publishable profiles Source : IG Starter Kit, L2-L3 Overview and all L3 authoring pages |
| [Programme Manager](./artifact/ActorDefinition-SGAuthoring.Persona.ProgrammeManager.html)<br>`ActorDefinition/SGAuthoring.Persona.ProgrammeManager` | A programme manager responsible for the overall coordination and management of the Digital Adaptation Kit (DAK) development process. Programme managers lead scoping, resource allocation, timeline planning, and stakeholder engagement. The DAK development team should be small (\<10 people) and nimble. The Programme Manager ensures the team is empowered to self-organize and manage DAK-related work including collaboration with stakeholders, content development, validation, and publication. Key activities: Define DAK scope and purpose Form and coordinate the DAK development team Establish development process and governance Define RASCI matrix for roles and responsibilities Plan sprint iterations and maintain the DAK backlog Coordinate SME consultations (workshops, country visits) Draft project roadmap with milestone dates Assess and secure resources and budget Source : IG Starter Kit, L2 DAK Authoring, Section 1 "Plan" |
| [Publication Manager](./artifact/ActorDefinition-SGAuthoring.Persona.PublicationManager.html)<br>`ActorDefinition/SGAuthoring.Persona.PublicationManager` | A specialist responsible for managing the FHIR Implementation Guide configuration, build process, versioning, and release publication workflow. Publication Managers ensure IGs are correctly configured, built, and published to smart.who.int following the established publication process. Key activities: Set up IG repositories from smart-ig-empty template Configure sushi-config.yaml (canonical URL, package ID, dependencies) Enable GitHub Pages and CI build workflows Run FHIR IG Publisher builds and verify output Manage semantic versioning (major.minor.patch) Create publication-request.json for releases Create release branches, tags, and GitHub releases Monitor automated publication workflows Coordinate with WHO SMART Guidelines team for smart.who.int updates Manage cross-IG governance for shared artifacts Reset main branch to draft status after publication Source : IG Starter Kit, IG Setup, IG Publication, and IG Configuration pages |
| [Quality Control Reviewer](./artifact/ActorDefinition-SGAuthoring.Persona.QCReviewer.html)<br>`ActorDefinition/SGAuthoring.Persona.QCReviewer` | A quality assurance specialist responsible for reviewing SMART Guidelines Implementation Guides for publication readiness. QC Reviewers use the publication checklist across L1-L4 layers, interpret QA validation reports, and verify artifact conformance and cross-component consistency. Key activities: Run and interpret IG Publisher QA reports (qa.html) Review publication checklist across L1, L2, L3, L4, and Global sections Verify conformance to Shareable, Publishable, Computable, Executable profiles Validate StructureMap extraction produces expected output Verify CQL execution and measure calculations Check cross-component consistency (personas, data elements, processes) Validate all artifacts have required title, description, and mappings Confirm naming conventions and reference resolution Review change log completeness and versioning compliance Source : IG Starter Kit, QA Check page, Checklist page, Validating IG page |
| [Technical Officer](./artifact/ActorDefinition-SGAuthoring.Persona.TechnicalOfficer.html)<br>`ActorDefinition/SGAuthoring.Persona.TechnicalOfficer` | A health area technical officer who coordinates the work on the DAK and performs first-pass review and validation of DAK content. Technical officers are part of the DAK development team and serve as the primary bridge between the development team and the broader group of Subject Matter Experts. Key activities: Coordinate DAK development work within the health programme area Perform first-pass review of drafted DAK components Validate that components accurately reflect L1 recommendations Identify gaps, ambiguities, and alternatives in DAK content Prepare agendas and questions for SME consultation meetings Ensure content is software-neutral and context-appropriate Spread awareness of SMART Guidelines within the department Source : IG Starter Kit, L2 DAK Authoring, Section 2.2 "Validate DAK content with SMEs" |
| [Terminologist](./artifact/ActorDefinition-SGAuthoring.Persona.Terminologist.html)<br>`ActorDefinition/SGAuthoring.Persona.Terminologist` | A specialist responsible for ensuring semantic interoperability of SMART Guidelines through proper terminology management. Terminologists manage the WHO Commons dictionary, concept mappings, and ensure every data element is mapped to approved standard terminologies. Key activities: Map data elements to WHO Commons dictionary concepts Create and maintain CodeSystem resources Create and maintain ValueSet resources Create ConceptMap resources for cross-terminology mappings Map to ICD-11, SNOMED CT, LOINC, IPS, and WHO FIC Onboard new concepts into the Commons dictionary Verify no duplicate or overlapping concept definitions Review terminology bindings in logical models and profiles Flag unapproved concepts as QA issues before publication Source : IG Starter Kit, Governance Concepts page; L3 authoring pages for CodeSystems, ValueSets, ConceptMaps |
| [Translator](./artifact/ActorDefinition-SGAuthoring.Persona.Translator.html)<br>`ActorDefinition/SGAuthoring.Persona.Translator` | A language specialist responsible for translating SMART Guidelines Implementation Guide content across UN languages to support global adoption and adaptation. Key activities: Translate IG narrative content across UN languages Translate FHIR resource display names and descriptions Review translated content for accuracy and clinical correctness Manage .pot/.po translation template files Coordinate with clinical SMEs for domain-specific terminology Ensure translated examples are available for each non-abstract profile Source : IG Starter Kit, Checklist L4 (example resources per UN language); PR 288 translation skill infrastructure |

</details>

<details markdown="1" id="cat-Terminology__Code_Systems">
<summary><strong>Terminology: Code Systems</strong> — 12</summary>

| Artefact | Description |
|---|---|
| [Classification of Digital Health Interventions v1](./artifact/CodeSystem-CDHIv1.html)<br>`CodeSystem/CDHIv1` | CodeSystem for Classification of Digital Health Interventions v1. Autogenerated from DAK artifacts |
| [Classification of Digital Health Interventions v2](./artifact/CodeSystem-CDHIv2.html)<br>`CodeSystem/CDHIv2` | CodeSystem for the Classification of Digital Interventions, Services and Applications in Health (CDISAH), second edition (2023). ISBN 978-92-4-008194-9. Organised into four groups based on the primary user: Persons Healthcare providers Health management and support personnel Data services New categories vs v1: 1.4.4, 1.6.2, 1.8, 2.5.6, 2.11, 3.1.5, 3.5.7, 3.5.8, 3.8, 4.3.5, 4.4.2, 4.4.3, 4.5. See ConceptMap CDHIv1toCDHIv2 for the full mapping from the first edition. |
| [Classification of Digital Health System Categories v1](./artifact/CodeSystem-CDSCv1.html)<br>`CodeSystem/CDSCv1` | CodeSystem for Classification of Digital Health System Categories v1. Autogenerated from DAK artifacts |
| [Classification of Digital Health Services and Application Types v2](./artifact/CodeSystem-CDSCv2.html)<br>`CodeSystem/CDSCv2` | CodeSystem for the Classification of Digital Health Services and Application Types v2, as defined in the Classification of Digital Interventions, Services and Applications in Health (CDISAH), second edition (2023). ISBN 978-92-4-008194-9. Services and Application Types represent the types of software, ICT systems and services or communication channels that deliver or execute digital health interventions (DHIs) and health content. The types are organised into five representations within the Digital Health Architecture: A. Point of service B. Health system/Provider administration C. Registries and Directories D. Data Management services E. Surveillance and Response |
| [Core Data Element Type](./artifact/CodeSystem-CoreDataElementType.html)<br>`CodeSystem/CoreDataElementType` | CodeSystem for Core Data Element types - defines the type of FHIR resource that a Core Data Element references. |
| [Smart Guidelines Actions (columns) for Decision Tables](./artifact/CodeSystem-DecisionTableActions.html)<br>`CodeSystem/DecisionTableActions` | CodeSystem for Smart Guidelines Documentation Actions for Decision Tables" |
| [Smart Guidelines Documentation Section](./artifact/CodeSystem-DocumentationSections.html)<br>`CodeSystem/DocumentationSections` | CodeSystem for Smart Guidelines Documentation Section to autogenerate documentation from artifacts |
| [International Standard Classification of Occupations 2008](./artifact/CodeSystem-ISCO08.html)<br>`CodeSystem/ISCO08` | ISCO-08 codes from the International Labour Organization official classification |
| [SMART Guidelines Authoring Persona Types](./artifact/CodeSystem-SGAuthoringPersonaTypes.html)<br>`CodeSystem/SGAuthoringPersonaTypes` | CodeSystem for SMART Guidelines authoring persona types. These represent roles involved in the authoring, review, and publication of SMART Guidelines and Digital Adaptation Kits, as distinct from the clinical/health personas defined within a DAK. |
| [SMART Guidelines Authoring Skills](./artifact/CodeSystem-SGAuthoringSkills.html)<br>`CodeSystem/SGAuthoringSkills` | CodeSystem for SMART Guidelines authoring skill capabilities. Each code represents a discrete skill that an authoring persona may possess. Skills are used to define Requirements resources as capability statements. |
| [SMART Guidelines Persona Types](./artifact/CodeSystem-SGPersonaTypes.html)<br>`CodeSystem/SGPersonaTypes` | CodeSystem for SMART Guidelines Persona Types |
| [SMART Guidelines Tasks](./artifact/CodeSystem-SGTasks.html)<br>`CodeSystem/SGTasks` | CodeSystem for SMART Guidelines tasks which are specializations of the Business Process Modeling Notatiton (BPMN) tasks, which are included in this codesystem See BPMN Spectification for more info. The descriptions were adapted from the normative human readable documentation . |

</details>

<details markdown="1" id="cat-Terminology__Concept_Maps">
<summary><strong>Terminology: Concept Maps</strong> — 4</summary>

| Artefact | Description |
|---|---|
| [Hierarchy of the Classification of Digital Health Interventions v1](./artifact/ConceptMap-CDHIv1Hierarchy.html)<br>`ConceptMap/CDHIv1Hierarchy` | Mapping to represent hierarchy within the Classification of Digital Health Interventions v1. |
| [Mapping from CDHI v1 to CDISAH v2](./artifact/ConceptMap-CDHIv1toCDHIv2.html)<br>`ConceptMap/CDHIv1toCDHIv2` | Mapping from the Classification of Digital Health Interventions v1 (CDHI v1, 2018) to the Classification of Digital Interventions, Services and Applications in Health v2 (CDISAH v2, 2023). Key structural changes reflected in this map: User group labels updated throughout (e.g. 'Clients' → 'Persons', 'Health workers' → 'Healthcare providers', 'Health system managers' → 'Health management and support personnel'). Civil Registration and Vital Statistics (CRVS) consolidated: six v1 codes (3.4.1–3.4.6) merged into two v2 codes (3.4.1, 3.4.2). Health financing section restructured: v1 3.5.1 (insurance membership) and 3.5.2 (billing) updated; v1 3.5.3–3.5.6 shifted by one (now 3.5.4–3.5.6 + new 3.5.3). Data services (group 4) substantially revised: 4.1.1 changed scope, 4.3 expanded from 4 to 5 codes, 4.4 split from 1 to 3 codes, 4.5 is entirely new. New v2 categories with no v1 equivalent are listed as 'unmatched' targets. |
| [Hierarchy of the Classification of Digital Health Interventions v2](./artifact/ConceptMap-CDHIv2Hierarchy.html)<br>`ConceptMap/CDHIv2Hierarchy` | Mapping to represent hierarchy within the Classification of Digital Interventions, Services and Applications in Health (CDISAH) v2. |
| [Mapping from CDSC v1 to Services and Application Types v2](./artifact/ConceptMap-CDSCv1toCDSCv2.html)<br>`ConceptMap/CDSCv1toCDSCv2` | Mapping from the Classification of Digital Health System Categories v1 (CDSCv1, 2018) to the Classification of Digital Health Services and Application Types v2 (CDSCv2, 2023). The v1 used 25 single-letter codes (A–Y). The v2 completely restructured this into 5 representations within the digital health enterprise architecture, each with alphanumeric codes (A1–A9, B1–B8, C1–C11, D1–D8, E1–E2). Several new v2 categories have no v1 equivalent: A3 (Decision support), A4 (Diagnostics), B1 (Blood bank), B3 (Health program monitoring), B7 (Patient administration), C4 (Facility registries), C5 (Health worker registry), C7 (Immunisation information), C8 (Master patient index), C9 (Product catalogues), C10 (Public Key directories), D1 (Analytics), D3 (Data warehouses). |

</details>

<details markdown="1" id="cat-Structures__Questionnaires">
<summary><strong>Structures: Questionnaires</strong> — 1</summary>

| Artefact | Description |
|---|---|
| [Questionnaire for IMMZ.D2 Determine required vaccination(s) if any](./artifact/Questionnaire-DAK.DT.IMMZ.D2.DT.BCGQuestionnaire.html)<br>`Questionnaire/DAK.DT.IMMZ.D2.DT.BCGQuestionnaire` | Auto-generated questionnaire for decision table DAK.DT.IMMZ.D2.DT.BCG |

</details>

<details markdown="1" id="cat-Requirements__Formal_Requirements">
<summary><strong>Requirements: Formal Requirements</strong> — 41</summary>

| Artefact | Description |
|---|---|
| [Can author actor definitions](./artifact/Requirements-SGAuthoring.Skills.AuthorActorDefinitions.html)<br>`Requirements/SGAuthoring.Skills.AuthorActorDefinitions` | Capability to create FHIR ActorDefinitions from L2 personas, reusing existing definitions from the Commons repository. |
| [Can author business processes](./artifact/Requirements-SGAuthoring.Skills.AuthorBusinessProcesses.html)<br>`Requirements/SGAuthoring.Skills.AuthorBusinessProcesses` | Capability to create BPMN 2.0 business process diagrams for DAK workflows. |
| [Can author code systems](./artifact/Requirements-SGAuthoring.Skills.AuthorCodeSystems.html)<br>`Requirements/SGAuthoring.Skills.AuthorCodeSystems` | Capability to create and maintain FHIR CodeSystem resources. |
| [Can author concept maps](./artifact/Requirements-SGAuthoring.Skills.AuthorConceptMaps.html)<br>`Requirements/SGAuthoring.Skills.AuthorConceptMaps` | Capability to create FHIR ConceptMap resources for cross-terminology mappings. |
| [Can author CQL](./artifact/Requirements-SGAuthoring.Skills.AuthorCQL.html)<br>`Requirements/SGAuthoring.Skills.AuthorCQL` | Capability to write Clinical Quality Language (CQL) for decision logic, scheduling logic, and indicator calculations. |
| [Can author data dictionary](./artifact/Requirements-SGAuthoring.Skills.AuthorDataDictionary.html)<br>`Requirements/SGAuthoring.Skills.AuthorDataDictionary` | Capability to define core data elements and map to standard terminologies. |
| [Can author decision-support logic](./artifact/Requirements-SGAuthoring.Skills.AuthorDecisionLogic.html)<br>`Requirements/SGAuthoring.Skills.AuthorDecisionLogic` | Capability to develop decision-support logic tables following the DMN standard. |
| [Can author example scenarios](./artifact/Requirements-SGAuthoring.Skills.AuthorExampleScenarios.html)<br>`Requirements/SGAuthoring.Skills.AuthorExampleScenarios` | Capability to create ExampleScenario resources from L2 user scenarios. |
| [Can author FHIR profiles](./artifact/Requirements-SGAuthoring.Skills.AuthorFHIRProfiles.html)<br>`Requirements/SGAuthoring.Skills.AuthorFHIRProfiles` | Capability to create FHIR profiles (StructureDefinitions) constraining base FHIR resources. |
| [Can author FHIR requirements](./artifact/Requirements-SGAuthoring.Skills.AuthorFHIRRequirements.html)<br>`Requirements/SGAuthoring.Skills.AuthorFHIRRequirements` | Capability to create FHIR Requirements resources from L2 functional and non-functional requirements. |
| [Can author functional requirements](./artifact/Requirements-SGAuthoring.Skills.AuthorFunctionalRequirements.html)<br>`Requirements/SGAuthoring.Skills.AuthorFunctionalRequirements` | Capability to define high-level functional and non-functional requirements linked to personas and business processes. |
| [Can author indicators](./artifact/Requirements-SGAuthoring.Skills.AuthorIndicators.html)<br>`Requirements/SGAuthoring.Skills.AuthorIndicators` | Capability to define indicators and performance metrics with numerator/denominator specifications. |
| [Can author logical models](./artifact/Requirements-SGAuthoring.Skills.AuthorLogicalModels.html)<br>`Requirements/SGAuthoring.Skills.AuthorLogicalModels` | Capability to create FHIR logical models (StructureDefinitions) from L2 data dictionaries. |
| [Can author measures](./artifact/Requirements-SGAuthoring.Skills.AuthorMeasures.html)<br>`Requirements/SGAuthoring.Skills.AuthorMeasures` | Capability to create FHIR Measure resources from L2 indicators. |
| [Can author personas](./artifact/Requirements-SGAuthoring.Skills.AuthorPersonas.html)<br>`Requirements/SGAuthoring.Skills.AuthorPersonas` | Capability to define generic personas based on task-shifting guidelines and ground-truthing interviews. |
| [Can author plan definitions](./artifact/Requirements-SGAuthoring.Skills.AuthorPlanDefinitions.html)<br>`Requirements/SGAuthoring.Skills.AuthorPlanDefinitions` | Capability to create FHIR PlanDefinitions for business processes and decision tables. |
| [Can author questionnaires](./artifact/Requirements-SGAuthoring.Skills.AuthorQuestionnaires.html)<br>`Requirements/SGAuthoring.Skills.AuthorQuestionnaires` | Capability to create FHIR Questionnaire resources aligned with L2 forms and data collection needs. |
| [Can author scheduling logic](./artifact/Requirements-SGAuthoring.Skills.AuthorSchedulingLogic.html)<br>`Requirements/SGAuthoring.Skills.AuthorSchedulingLogic` | Capability to develop scheduling logic tables following the DMN standard. |
| [Can author structure maps](./artifact/Requirements-SGAuthoring.Skills.AuthorStructureMaps.html)<br>`Requirements/SGAuthoring.Skills.AuthorStructureMaps` | Capability to create FHIR StructureMaps for data extraction from QuestionnaireResponses to FHIR resources. |
| [Can author test cases](./artifact/Requirements-SGAuthoring.Skills.AuthorTestCases.html)<br>`Requirements/SGAuthoring.Skills.AuthorTestCases` | Capability to create TestPlan, TestScript, and example instances for validation of L3 artifacts. |
| [Can author user scenarios](./artifact/Requirements-SGAuthoring.Skills.AuthorUserScenarios.html)<br>`Requirements/SGAuthoring.Skills.AuthorUserScenarios` | Capability to create user scenario narratives depicting typical interactions in health programme workflows. |
| [Can author value sets](./artifact/Requirements-SGAuthoring.Skills.AuthorValueSets.html)<br>`Requirements/SGAuthoring.Skills.AuthorValueSets` | Capability to create and maintain FHIR ValueSet resources with appropriate terminology bindings. |
| [Can build IG](./artifact/Requirements-SGAuthoring.Skills.BuildIG.html)<br>`Requirements/SGAuthoring.Skills.BuildIG` | Capability to run the FHIR IG Publisher build process and verify output. |
| [Can configure IG](./artifact/Requirements-SGAuthoring.Skills.ConfigureIG.html)<br>`Requirements/SGAuthoring.Skills.ConfigureIG` | Capability to set up and configure a FHIR Implementation Guide (sushi-config, canonical URL, packages). |
| [Can interpret clinical recommendations](./artifact/Requirements-SGAuthoring.Skills.InterpretClinicalRecommendations.html)<br>`Requirements/SGAuthoring.Skills.InterpretClinicalRecommendations` | Capability to interpret clinical recommendations from L1 source documents with domain expertise. |
| [Can manage governance](./artifact/Requirements-SGAuthoring.Skills.ManageGovernance.html)<br>`Requirements/SGAuthoring.Skills.ManageGovernance` | Capability to manage cross-IG governance for shared artifacts including common personas, terminology, and libraries. |
| [Can manage releases](./artifact/Requirements-SGAuthoring.Skills.ManageReleases.html)<br>`Requirements/SGAuthoring.Skills.ManageReleases` | Capability to manage versioning, publication-request.json, release tags, and publication workflow. |
| [Can manage stakeholders](./artifact/Requirements-SGAuthoring.Skills.ManageStakeholders.html)<br>`Requirements/SGAuthoring.Skills.ManageStakeholders` | Capability to engage SMEs, coordinate consultations, and manage the RASCI matrix for DAK development. |
| [Can map concepts](./artifact/Requirements-SGAuthoring.Skills.MapConcepts.html)<br>`Requirements/SGAuthoring.Skills.MapConcepts` | Capability to map data elements to WHO Commons dictionary, ICD-11, SNOMED CT, LOINC, and other standard terminologies. |
| [Can plan iterations](./artifact/Requirements-SGAuthoring.Skills.PlanIterations.html)<br>`Requirements/SGAuthoring.Skills.PlanIterations` | Capability to plan sprint iterations, maintain the DAK backlog, draft the project roadmap, and facilitate retrospectives. |
| [Can review and approve content](./artifact/Requirements-SGAuthoring.Skills.ReviewAndApproveContent.html)<br>`Requirements/SGAuthoring.Skills.ReviewAndApproveContent` | Capability to review and formally approve SMART Guidelines content at decision gates in the authoring lifecycle. |
| [Can review checklist](./artifact/Requirements-SGAuthoring.Skills.ReviewChecklist.html)<br>`Requirements/SGAuthoring.Skills.ReviewChecklist` | Capability to review the SMART Guidelines publication checklist across L1-L4 layers and global requirements. |
| [Can review L1 guidelines](./artifact/Requirements-SGAuthoring.Skills.ReviewL1Guidelines.html)<br>`Requirements/SGAuthoring.Skills.ReviewL1Guidelines` | Capability to review WHO L1 narrative guidelines and normative products for accuracy and completeness. |
| [Can review terminology](./artifact/Requirements-SGAuthoring.Skills.ReviewTerminology.html)<br>`Requirements/SGAuthoring.Skills.ReviewTerminology` | Capability to review and validate terminology bindings, code systems, and value sets for correctness and completeness. |
| [Can review translations](./artifact/Requirements-SGAuthoring.Skills.ReviewTranslations.html)<br>`Requirements/SGAuthoring.Skills.ReviewTranslations` | Capability to review translated content for accuracy and completeness. |
| [Can run QA checks](./artifact/Requirements-SGAuthoring.Skills.RunQAChecks.html)<br>`Requirements/SGAuthoring.Skills.RunQAChecks` | Capability to run and interpret IG Publisher QA validation reports. |
| [Can scope DAK](./artifact/Requirements-SGAuthoring.Skills.ScopeDAK.html)<br>`Requirements/SGAuthoring.Skills.ScopeDAK` | Capability to define DAK scope, identify source documents, and establish the development process and governance. |
| [Can translate content](./artifact/Requirements-SGAuthoring.Skills.TranslateContent.html)<br>`Requirements/SGAuthoring.Skills.TranslateContent` | Capability to translate IG content across UN languages. |
| [Can validate artifact conformance](./artifact/Requirements-SGAuthoring.Skills.ValidateArtifactConformance.html)<br>`Requirements/SGAuthoring.Skills.ValidateArtifactConformance` | Capability to verify conformance to CRMI Shareable, Publishable, Computable, and Executable profiles. |
| [Can validate DAK content](./artifact/Requirements-SGAuthoring.Skills.ValidateDAKContent.html)<br>`Requirements/SGAuthoring.Skills.ValidateDAKContent` | Capability to review and validate DAK components against L1 source documents and for cross-component consistency. |
| [Can validate L3 functionality](./artifact/Requirements-SGAuthoring.Skills.ValidateL3Functionality.html)<br>`Requirements/SGAuthoring.Skills.ValidateL3Functionality` | Capability to test StructureMap extraction, CQL execution, and measure calculation using reference tooling. |

</details>

<details markdown="1" id="cat-Structures__Logical_Models">
<summary><strong>Structures: Logical Models</strong> — 25</summary>

| Artefact | Description |
|---|---|
| [Business Process Workflow (DAK)](./artifact/StructureDefinition-BusinessProcessWorkflow.html)<br>`StructureDefinition/BusinessProcessWorkflow` | Logical Model for representing Generic Business Processes and Workflows from a DAK. A business process is a set of related activities or tasks performed together to achieve the objectives of the health programme area. |
| [Business Process Workflow Source](./artifact/StructureDefinition-BusinessProcessWorkflowSource.html)<br>`StructureDefinition/BusinessProcessWorkflowSource` | Source reference for Business Process Workflow - exactly one of the following must be provided: url (url data type): URL to retrieve BusinessProcessWorkflow definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the BusinessProcessWorkflow definition instance: Inline BusinessProcessWorkflow instance data |
| [Core Data Element (DAK)](./artifact/StructureDefinition-CoreDataElement.html)<br>`StructureDefinition/CoreDataElement` | Logical Model for representing Core Data Elements from a DAK. A core data element can be one of: a ValueSet, a CodeSystem, a ConceptMap, or a Logical Model adherent to SGLogicalModel. This is the ONE EXCEPTION to allowing FHIR R4 models into the DAK LMs. |
| [Core Data Element Source](./artifact/StructureDefinition-CoreDataElementSource.html)<br>`StructureDefinition/CoreDataElementSource` | Source reference for Core Data Element - exactly one of the following must be provided: url (url data type): URL to retrieve CoreDataElement definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the CoreDataElement definition instance: Inline CoreDataElement instance data |
| [Digital Adaptation Kit (DAK)](./artifact/StructureDefinition-DAK.html)<br>`StructureDefinition/DAK` | Logical Model for representing a complete Digital Adaptation Kit (DAK) with metadata and all 9 DAK components |
| [Decision-Support Logic (DAK)](./artifact/StructureDefinition-DecisionSupportLogic.html)<br>`StructureDefinition/DecisionSupportLogic` | Logical Model for representing Decision-Support Logic from a DAK. Decision-support logic and algorithms to support appropriate service delivery in accordance with WHO clinical, public health and data use guidelines. |
| [Decision Support Logic Source](./artifact/StructureDefinition-DecisionSupportLogicSource.html)<br>`StructureDefinition/DecisionSupportLogicSource` | Source reference for Decision Support Logic - exactly one of the following must be provided: url (url data type): URL to retrieve DecisionSupportLogic definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the DecisionSupportLogic definition instance: Inline DecisionSupportLogic instance data |
| [Dublin Core Metadata Element Set](./artifact/StructureDefinition-DublinCore.html)<br>`StructureDefinition/DublinCore` | Logical Model representing Dublin Core metadata elements as defined at https://www.dublincore.org/specifications/dublin-core/dcmi-terms/ |
| [FHIR Schema Base (SMART Guidelines)](./artifact/StructureDefinition-FHIRSchemaBase.html)<br>`StructureDefinition/FHIRSchemaBase` | Base logical model providing the common schema metadata interface inherited by all SMART Guidelines logical models. Every SMART Guidelines logical model schema derives from this base, which documents the shared FHIR and JSON-LD metadata properties used by the JSON Schema generation pipeline. |
| [Functional Requirement (DAK)](./artifact/StructureDefinition-FunctionalRequirement.html)<br>`StructureDefinition/FunctionalRequirement` | Logical Model for representing functional requirement from a DAK |
| [Generic Persona (DAK)](./artifact/StructureDefinition-GenericPersona.html)<br>`StructureDefinition/GenericPersona` | Logical Model for representing Generic Personas from a DAK. Depiction of the human and system actors. Human actors are end users, supervisors and related stakeholders who would be interacting with the digital system or involved in the clinical care, public health or health system pathway. |
| [Generic Persona Source](./artifact/StructureDefinition-GenericPersonaSource.html)<br>`StructureDefinition/GenericPersonaSource` | Source reference for Generic Persona - exactly one of the following must be provided: url (url data type): URL to retrieve GenericPersona definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the GenericPersona definition instance: Inline GenericPersona instance data |
| [Health Interventions and Recommendations (DAK)](./artifact/StructureDefinition-HealthInterventions.html)<br>`StructureDefinition/HealthInterventions` | Logical Model for representing Health Interventions and Recommendations from a DAK. Overview of the health interventions and WHO, regional or national recommendations included within the DAK. |
| [Health Interventions Source](./artifact/StructureDefinition-HealthInterventionsSource.html)<br>`StructureDefinition/HealthInterventionsSource` | Source reference for Health Interventions - exactly one of the following must be provided: url (url data type): URL to retrieve HealthInterventions definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the HealthInterventions definition instance: Inline HealthInterventions instance data |
| [Non-Functional Requirement (DAK)](./artifact/StructureDefinition-NonFunctionalRequirement.html)<br>`StructureDefinition/NonFunctionalRequirement` | Logical Model for representing non-functional requirement from a DAK |
| [Persona (DAK)](./artifact/StructureDefinition-Persona.html)<br>`StructureDefinition/Persona` | Logical Model for representing Personas from a DAK |
| [Program Indicator (DAK)](./artifact/StructureDefinition-ProgramIndicator.html)<br>`StructureDefinition/ProgramIndicator` | Logical Model for representing Program Indicators from a DAK. Core set of indicators that need to be aggregated for decision-making, performance metrics and subnational and national reporting. |
| [Program Indicator Source](./artifact/StructureDefinition-ProgramIndicatorSource.html)<br>`StructureDefinition/ProgramIndicatorSource` | Source reference for Program Indicator - exactly one of the following must be provided: url (url data type): URL to retrieve ProgramIndicator definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the ProgramIndicator definition instance: Inline ProgramIndicator instance data |
| [Functional and Non-Functional Requirements (DAK)](./artifact/StructureDefinition-Requirements.html)<br>`StructureDefinition/Requirements` | Logical Model for representing Functional and Non-Functional Requirements from a DAK. A high-level list of core functions and capabilities that the system must have to meet the end users' needs. |
| [Requirements Source](./artifact/StructureDefinition-RequirementsSource.html)<br>`StructureDefinition/RequirementsSource` | Source reference for Requirements - exactly one of the following must be provided: url (url data type): URL to retrieve Requirements definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the Requirements definition instance: Inline Requirements instance data |
| [SUSHI Configuration Logical Model](./artifact/StructureDefinition-SushiConfigLogicalModel.html)<br>`StructureDefinition/SushiConfigLogicalModel` | Logical model defining the structure of sushi-config.yaml files used for FHIR Implementation Guide configuration. This model captures the essential metadata and configuration parameters needed for IG publishing. |
| [Test Scenario (DAK)](./artifact/StructureDefinition-TestScenario.html)<br>`StructureDefinition/TestScenario` | Logical Model for representing Test Scenarios from a DAK. A set of test scenarios to validate an implementation of the DAK. |
| [Test Scenario Source](./artifact/StructureDefinition-TestScenarioSource.html)<br>`StructureDefinition/TestScenarioSource` | Source reference for Test Scenario - exactly one of the following must be provided: url (url data type): URL to retrieve TestScenario definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the TestScenario definition instance: Inline TestScenario instance data |
| [User Scenario (DAK)](./artifact/StructureDefinition-UserScenario.html)<br>`StructureDefinition/UserScenario` | Logical Model for representing User Scenarios from a DAK. Narratives that describe how the different personas may interact with each other. |
| [User Scenario Source](./artifact/StructureDefinition-UserScenarioSource.html)<br>`StructureDefinition/UserScenarioSource` | Source reference for User Scenario - exactly one of the following must be provided: url (url data type): URL to retrieve UserScenario definition from input/ or external source canonical (canonical data type): Canonical URI pointing to the UserScenario definition instance: Inline UserScenario instance data |

</details>

<details markdown="1" id="cat-Structures__Extension_Definitions">
<summary><strong>Structures: Extension Definitions</strong> — 11</summary>

| Artefact | Description |
|---|---|
| [LinkIdExt](./artifact/StructureDefinition-LinkIdExt.html)<br>`StructureDefinition/LinkIdExt` | Smart Guidelines link identifier extension |
| [Markdown](./artifact/StructureDefinition-Markdown.html)<br>`StructureDefinition/Markdown` | Markdown extension |
| [Satisfies](./artifact/StructureDefinition-Satisfies.html)<br>`StructureDefinition/Satisfies` | Indicates that if the conditions for this requirement are satisified, then that it should be viewed as satisifying the referenced requirement. |
| [SGActorExt](./artifact/StructureDefinition-SGActorExt.html)<br>`StructureDefinition/SGActorExt` | Smart Guidelines Actor Reference extension |
| [SGcode](./artifact/StructureDefinition-SGcode.html)<br>`StructureDefinition/SGcode` | Smart Guidelines code extension |
| [SGDocumentation](./artifact/StructureDefinition-SGDocumentation.html)<br>`StructureDefinition/SGDocumentation` | Smart Guidelines Documentation extension |
| [SGMarkdown](./artifact/StructureDefinition-SGMarkdown.html)<br>`StructureDefinition/SGMarkdown` | Smart Guidelines markdown extension |
| [SGRequirementExt](./artifact/StructureDefinition-SGRequirementExt.html)<br>`StructureDefinition/SGRequirementExt` | Smart Guidelines Requirements extension |
| [SGString](./artifact/StructureDefinition-SGString.html)<br>`StructureDefinition/SGString` | Smart Guidelines (required) string extension for use in a complex extension |
| [SGTask](./artifact/StructureDefinition-SGTask.html)<br>`StructureDefinition/SGTask` | Extension to reference SMART Guidelines task type |
| [SGUserStory](./artifact/StructureDefinition-SGUserStory.html)<br>`StructureDefinition/SGUserStory` | Smart Guidelines extension to support structured User Stories (As a Actor I want to capability so that benefit ) extension |

</details>

<details markdown="1" id="cat-Conformance">
<summary><strong>Conformance</strong> — 17</summary>

| Artefact | Description |
|---|---|
| [SMART Guidelines ActivityDefinition](./artifact/StructureDefinition-SGActivityDefinition.html)<br>`StructureDefinition/SGActivityDefinition` | The minimum expectations for ActivityDefinition resources used in SMART Guidelines |
| [SMART Guidelines Actor](./artifact/StructureDefinition-SGActor.html)<br>`StructureDefinition/SGActor` | Structure and constraints for ActorDefinition resources used in SMART Guidelines |
| [SMART Guidelines Business Process](./artifact/StructureDefinition-SGBusinessProcess.html)<br>`StructureDefinition/SGBusinessProcess` | Structure and constraints for Business Processes represented in SMART Guidelines |
| [SMART Guidelines CodeSystem](./artifact/StructureDefinition-SGCodeSystem.html)<br>`StructureDefinition/SGCodeSystem` | Defines the minimum expectations for CodeSystem resources used in SMART Guidelines |
| [SMART Guidelines ConceptMap](./artifact/StructureDefinition-SGConceptMap.html)<br>`StructureDefinition/SGConceptMap` | Defines the minimum expectations for ConceptMap resources used in SMART Guidelines |
| [SMART Guidelines GraphDefinition](./artifact/StructureDefinition-SGGraphDefinition.html)<br>`StructureDefinition/SGGraphDefinition` | The minimum expectations for GraphDefinition resources used in SMART Guidelines |
| [SMART Guidelines Group Definition](./artifact/StructureDefinition-SGGroupDefinition.html)<br>`StructureDefinition/SGGroupDefinition` | Structure and constraints for Group Definitions represented in SMART Guidelines |
| [SMART Guidelines ImplementationGuide](./artifact/StructureDefinition-SGImplementationGuide.html)<br>`StructureDefinition/SGImplementationGuide` | Defines the minimum expectations for ImplementationGuide resources used in SMART Guidelines |
| [SMART Guidelines Library](./artifact/StructureDefinition-SGLibrary.html)<br>`StructureDefinition/SGLibrary` | Defines the minimum expectations for Library resources used in SMART Guidelines |
| [SMART Guidelines Logical Model](./artifact/StructureDefinition-SGLogicalModel.html)<br>`StructureDefinition/SGLogicalModel` | Defines the minimum expectations for Logical Models used in SMART Guidelines |
| [SMART Guidelines Measure](./artifact/StructureDefinition-SGMeasure.html)<br>`StructureDefinition/SGMeasure` | Defines the minimum expectations for Measure resources used in SMART Guidelines |
| [SMART Guidelines PlanDefinition](./artifact/StructureDefinition-SGPlanDefinition.html)<br>`StructureDefinition/SGPlanDefinition` | Defines the minimum expectations for PlanDefinition resources used in SMART Guidelines |
| [SMART Guidelines Questionnaire](./artifact/StructureDefinition-SGQuestionnaire.html)<br>`StructureDefinition/SGQuestionnaire` | Defines the minimum expectations for Questionnaire resources used in SMART Guidelines |
| [SMART Guidelines StructureDefinition](./artifact/StructureDefinition-SGStructureDefinition.html)<br>`StructureDefinition/SGStructureDefinition` | Defines the minimum expectations for StructureDefinition resources used in SMART Guidelines |
| [SMART Guidelines StructureMap](./artifact/StructureDefinition-SGStructureMap.html)<br>`StructureDefinition/SGStructureMap` | Defines the minimum expectations for StructureMap resources used in SMART Guidelines |
| [SMART Guidelines Transaction](./artifact/StructureDefinition-SGTransaction.html)<br>`StructureDefinition/SGTransaction` | Structure and constraints for TransactionDefinition resources used in SMART Guidelines |
| [SMART Guidelines ValueSet](./artifact/StructureDefinition-SGValueSet.html)<br>`StructureDefinition/SGValueSet` | Defines the minimum expectations for ValueSet resources used in SMART Guidelines |

</details>

<details markdown="1" id="cat-Structures__Resource_Profiles">
<summary><strong>Structures: Resource Profiles</strong> — 3</summary>

| Artefact | Description |
|---|---|
| [SMART Guidelines Communication Request](./artifact/StructureDefinition-SGCommunicationRequest.html)<br>`StructureDefinition/SGCommunicationRequest` | Provide communication |
| [SMART Guidelines Decision Table](./artifact/StructureDefinition-SGDecisionTable.html)<br>`StructureDefinition/SGDecisionTable` | Defines the minimum expectations for PlanDefinition resources used in SMART Guidelines which are derived from DAK Decision Tables |
| [SMART Guidelines Requirements](./artifact/StructureDefinition-SGRequirements.html)<br>`StructureDefinition/SGRequirements` | Smart Guidelines Requirements |

</details>

<details markdown="1" id="cat-Terminology__Value_Sets">
<summary><strong>Terminology: Value Sets</strong> — 24</summary>

| Artefact | Description |
|---|---|
| [Classification of Digital Health Interventions v1](./artifact/ValueSet-CDHIv1.html)<br>`ValueSet/CDHIv1` | Value Set for Classification of Digital Health Interventions v1. Autogenerated from DAK artifacts |
| [Digital Health Interventions for Clients](./artifact/ValueSet-CDHIv1.1.html)<br>`ValueSet/CDHIv1.1` | Digital Health Interventions whose primary user group is Clients (persons using health services). Group 1 of the Classification of Digital Health Interventions v1 (2018). |
| [Digital Health Interventions for Health Workers](./artifact/ValueSet-CDHIv1.2.html)<br>`ValueSet/CDHIv1.2` | Digital Health Interventions whose primary user group is Health Workers. Group 2 of the Classification of Digital Health Interventions v1 (2018). |
| [Digital Health Interventions for Health System Managers](./artifact/ValueSet-CDHIv1.3.html)<br>`ValueSet/CDHIv1.3` | Digital Health Interventions whose primary user group is Health System Managers. Group 3 of the Classification of Digital Health Interventions v1 (2018). |
| [Digital Health Interventions: Data Services](./artifact/ValueSet-CDHIv1.4.html)<br>`ValueSet/CDHIv1.4` | Crosscutting Data Services DHIs. Group 4 of the Classification of Digital Health Interventions v1 (2018). |
| [Classification of Digital Health Interventions v2](./artifact/ValueSet-CDHIv2.html)<br>`ValueSet/CDHIv2` | Value Set for the Classification of Digital Interventions, Services and Applications in Health (CDISAH), second edition (2023). |
| [Digital Health Interventions for Persons](./artifact/ValueSet-CDHIv2.1.html)<br>`ValueSet/CDHIv2.1` | Digital Health Interventions whose primary user group is Persons (health service users). Group 1 of the Classification of Digital Interventions, Services and Applications in Health v2 (CDISAH, 2023). |
| [Digital Health Interventions for Healthcare Providers](./artifact/ValueSet-CDHIv2.2.html)<br>`ValueSet/CDHIv2.2` | Digital Health Interventions whose primary user group is Healthcare Providers. Group 2 of the Classification of Digital Interventions, Services and Applications in Health v2 (CDISAH, 2023). |
| [Digital Health Interventions for Health Management and Support Personnel](./artifact/ValueSet-CDHIv2.3.html)<br>`ValueSet/CDHIv2.3` | Digital Health Interventions whose primary user group is Health Management and Support Personnel. Group 3 of the Classification of Digital Interventions, Services and Applications in Health v2 (CDISAH, 2023). |
| [Digital Health Interventions: Data Services](./artifact/ValueSet-CDHIv2.4.html)<br>`ValueSet/CDHIv2.4` | Crosscutting Data Services DHIs. Group 4 of the Classification of Digital Interventions, Services and Applications in Health v2 (CDISAH, 2023). |
| [Health System Challenges](./artifact/ValueSet-CDSCv1.html)<br>`ValueSet/CDSCv1` | Value set for Health System Challenges (Classification of Digital Health System Categories v1, 2018). Includes all 25 system category codes (A–Y). |
| [Services and Application Types](./artifact/ValueSet-CDSCv2.html)<br>`ValueSet/CDSCv2` | Value set for Services and Application Types (Classification of Digital Health Services and Application Types v2, CDISAH 2023). Includes all codes across the five architecture groups (A–E). |
| [Services and Application Types: Point of Service](./artifact/ValueSet-CDSCv2.A.html)<br>`ValueSet/CDSCv2.A` | Systems that facilitate the provision and delivery of healthcare services to persons at the point of care. Group A of the Classification of Digital Health Services and Application Types v2 (CDISAH, 2023). |
| [Services and Application Types: Health System/Provider Administration](./artifact/ValueSet-CDSCv2.B.html)<br>`ValueSet/CDSCv2.B` | Systems that support the administrative and managerial functions of health systems and healthcare organisations. Group B of the Classification of Digital Health Services and Application Types v2 (CDISAH, 2023). |
| [Services and Application Types: Registries and Directories](./artifact/ValueSet-CDSCv2.C.html)<br>`ValueSet/CDSCv2.C` | Systems that create, maintain, and provide authoritative master records for persons, providers, facilities, products and health events. Group C of the Classification of Digital Health Services and Application Types v2 (CDISAH, 2023). |
| [Services and Application Types: Data Management Services](./artifact/ValueSet-CDSCv2.D.html)<br>`ValueSet/CDSCv2.D` | Services and systems that support the collection, aggregation, storage, analysis, and exchange of health data. Group D of the Classification of Digital Health Services and Application Types v2 (CDISAH, 2023). |
| [Services and Application Types: Surveillance and Response](./artifact/ValueSet-CDSCv2.E.html)<br>`ValueSet/CDSCv2.E` | Systems that support the detection, monitoring, and response to disease outbreaks and public health threats. Group E of the Classification of Digital Health Services and Application Types v2 (CDISAH, 2023). |
| [Core Data Element Type Value Set](./artifact/ValueSet-CoreDataElementTypeVS.html)<br>`ValueSet/CoreDataElementTypeVS` | Value set of core data element types |
| [Smart Guidelines Decision Table Actions](./artifact/ValueSet-DecisionTableActions.html)<br>`ValueSet/DecisionTableActions` | Value Set for Smart Guidelines Documentation Decision Table Actions |
| [Smart Guidelines Documentation Section](./artifact/ValueSet-DocumentationSection.html)<br>`ValueSet/DocumentationSection` | Value Set for Smart Guidelines Documentation Section to autogenerate documentation from artifacts |
| [ISCO-08 Value Set](./artifact/ValueSet-ISCO08ValueSet.html)<br>`ValueSet/ISCO08ValueSet` | Extensible value set of ISCO-08 codes for persona classification |
| [SMART Guidelines Authoring Persona Types ValueSet](./artifact/ValueSet-SGAuthoringPersonaTypesVS.html)<br>`ValueSet/SGAuthoringPersonaTypesVS` | ValueSet for SMART Guidelines authoring persona types |
| [SMART Guidelines Authoring Skills ValueSet](./artifact/ValueSet-SGAuthoringSkillsVS.html)<br>`ValueSet/SGAuthoringSkillsVS` | ValueSet for all SMART Guidelines authoring skill capabilities |
| [Smart Guidelines Persona Types Value Set](./artifact/ValueSet-SGPersonaTypesVS.html)<br>`ValueSet/SGPersonaTypesVS` | Value Set for Smart Guidelines Persona Section to autogenerate documentation from artifacts |

</details>

<details markdown="1" id="cat--uncategorised">
<summary><strong>Uncategorised</strong> — 65</summary>

| Artefact | Description |
|---|---|
| [SGDecisionTableGuidance](./artifact/ActivityDefinition-SGDecisionTableGuidance.html)<br>`ActivityDefinition/SGDecisionTableGuidance` |  |
| [DAK.Persona.CommunityHealthWorker](./artifact/Basic-DAK.Persona.CommunityHealthWorker.html)<br>`Basic/DAK.Persona.CommunityHealthWorker` |  |
| [DAK.Persona.DataManager](./artifact/Basic-DAK.Persona.DataManager.html)<br>`Basic/DAK.Persona.DataManager` |  |
| [DAK.Persona.HealthcareProvider](./artifact/Basic-DAK.Persona.HealthcareProvider.html)<br>`Basic/DAK.Persona.HealthcareProvider` |  |
| [DAK.Persona.HealthSystemManager](./artifact/Basic-DAK.Persona.HealthSystemManager.html)<br>`Basic/DAK.Persona.HealthSystemManager` |  |
| [DAK.Persona.Person](./artifact/Basic-DAK.Persona.Person.html)<br>`Basic/DAK.Persona.Person` |  |
| [DAK.Persona.System.ClientRegistry](./artifact/Basic-DAK.Persona.System.ClientRegistry.html)<br>`Basic/DAK.Persona.System.ClientRegistry` |  |
| [DAK.Persona.System.EMR](./artifact/Basic-DAK.Persona.System.EMR.html)<br>`Basic/DAK.Persona.System.EMR` |  |
| [DAK.Persona.System.HMIS](./artifact/Basic-DAK.Persona.System.HMIS.html)<br>`Basic/DAK.Persona.System.HMIS` |  |
| [DAK.Persona.System.InteropPlatform](./artifact/Basic-DAK.Persona.System.InteropPlatform.html)<br>`Basic/DAK.Persona.System.InteropPlatform` |  |
| [DAK.Persona.System.LIS](./artifact/Basic-DAK.Persona.System.LIS.html)<br>`Basic/DAK.Persona.System.LIS` |  |
| [DAK.Persona.System.LMIS](./artifact/Basic-DAK.Persona.System.LMIS.html)<br>`Basic/DAK.Persona.System.LMIS` |  |
| [DAK.Persona.System.SurveillanceSystem](./artifact/Basic-DAK.Persona.System.SurveillanceSystem.html)<br>`Basic/DAK.Persona.System.SurveillanceSystem` |  |
| [SGAuthoring.Persona.BusinessAnalyst](./artifact/Basic-SGAuthoring.Persona.BusinessAnalyst.html)<br>`Basic/SGAuthoring.Persona.BusinessAnalyst` |  |
| [SGAuthoring.Persona.ClinicalSME](./artifact/Basic-SGAuthoring.Persona.ClinicalSME.html)<br>`Basic/SGAuthoring.Persona.ClinicalSME` |  |
| [SGAuthoring.Persona.ContentReviewer](./artifact/Basic-SGAuthoring.Persona.ContentReviewer.html)<br>`Basic/SGAuthoring.Persona.ContentReviewer` |  |
| [SGAuthoring.Persona.FHIRModeller](./artifact/Basic-SGAuthoring.Persona.FHIRModeller.html)<br>`Basic/SGAuthoring.Persona.FHIRModeller` |  |
| [SGAuthoring.Persona.ProgrammeManager](./artifact/Basic-SGAuthoring.Persona.ProgrammeManager.html)<br>`Basic/SGAuthoring.Persona.ProgrammeManager` |  |
| [SGAuthoring.Persona.PublicationManager](./artifact/Basic-SGAuthoring.Persona.PublicationManager.html)<br>`Basic/SGAuthoring.Persona.PublicationManager` |  |
| [SGAuthoring.Persona.QCReviewer](./artifact/Basic-SGAuthoring.Persona.QCReviewer.html)<br>`Basic/SGAuthoring.Persona.QCReviewer` |  |
| [SGAuthoring.Persona.TechnicalOfficer](./artifact/Basic-SGAuthoring.Persona.TechnicalOfficer.html)<br>`Basic/SGAuthoring.Persona.TechnicalOfficer` |  |
| [SGAuthoring.Persona.Terminologist](./artifact/Basic-SGAuthoring.Persona.Terminologist.html)<br>`Basic/SGAuthoring.Persona.Terminologist` |  |
| [SGAuthoring.Persona.Translator](./artifact/Basic-SGAuthoring.Persona.Translator.html)<br>`Basic/SGAuthoring.Persona.Translator` |  |
| [SGAuthoring.Skills.AuthorActorDefinitions](./artifact/Basic-SGAuthoring.Skills.AuthorActorDefinitions.html)<br>`Basic/SGAuthoring.Skills.AuthorActorDefinitions` |  |
| [SGAuthoring.Skills.AuthorBusinessProcesses](./artifact/Basic-SGAuthoring.Skills.AuthorBusinessProcesses.html)<br>`Basic/SGAuthoring.Skills.AuthorBusinessProcesses` |  |
| [SGAuthoring.Skills.AuthorCodeSystems](./artifact/Basic-SGAuthoring.Skills.AuthorCodeSystems.html)<br>`Basic/SGAuthoring.Skills.AuthorCodeSystems` |  |
| [SGAuthoring.Skills.AuthorConceptMaps](./artifact/Basic-SGAuthoring.Skills.AuthorConceptMaps.html)<br>`Basic/SGAuthoring.Skills.AuthorConceptMaps` |  |
| [SGAuthoring.Skills.AuthorCQL](./artifact/Basic-SGAuthoring.Skills.AuthorCQL.html)<br>`Basic/SGAuthoring.Skills.AuthorCQL` |  |
| [SGAuthoring.Skills.AuthorDataDictionary](./artifact/Basic-SGAuthoring.Skills.AuthorDataDictionary.html)<br>`Basic/SGAuthoring.Skills.AuthorDataDictionary` |  |
| [SGAuthoring.Skills.AuthorDecisionLogic](./artifact/Basic-SGAuthoring.Skills.AuthorDecisionLogic.html)<br>`Basic/SGAuthoring.Skills.AuthorDecisionLogic` |  |
| [SGAuthoring.Skills.AuthorExampleScenarios](./artifact/Basic-SGAuthoring.Skills.AuthorExampleScenarios.html)<br>`Basic/SGAuthoring.Skills.AuthorExampleScenarios` |  |
| [SGAuthoring.Skills.AuthorFHIRProfiles](./artifact/Basic-SGAuthoring.Skills.AuthorFHIRProfiles.html)<br>`Basic/SGAuthoring.Skills.AuthorFHIRProfiles` |  |
| [SGAuthoring.Skills.AuthorFHIRRequirements](./artifact/Basic-SGAuthoring.Skills.AuthorFHIRRequirements.html)<br>`Basic/SGAuthoring.Skills.AuthorFHIRRequirements` |  |
| [SGAuthoring.Skills.AuthorFunctionalRequirements](./artifact/Basic-SGAuthoring.Skills.AuthorFunctionalRequirements.html)<br>`Basic/SGAuthoring.Skills.AuthorFunctionalRequirements` |  |
| [SGAuthoring.Skills.AuthorIndicators](./artifact/Basic-SGAuthoring.Skills.AuthorIndicators.html)<br>`Basic/SGAuthoring.Skills.AuthorIndicators` |  |
| [SGAuthoring.Skills.AuthorLogicalModels](./artifact/Basic-SGAuthoring.Skills.AuthorLogicalModels.html)<br>`Basic/SGAuthoring.Skills.AuthorLogicalModels` |  |
| [SGAuthoring.Skills.AuthorMeasures](./artifact/Basic-SGAuthoring.Skills.AuthorMeasures.html)<br>`Basic/SGAuthoring.Skills.AuthorMeasures` |  |
| [SGAuthoring.Skills.AuthorPersonas](./artifact/Basic-SGAuthoring.Skills.AuthorPersonas.html)<br>`Basic/SGAuthoring.Skills.AuthorPersonas` |  |
| [SGAuthoring.Skills.AuthorPlanDefinitions](./artifact/Basic-SGAuthoring.Skills.AuthorPlanDefinitions.html)<br>`Basic/SGAuthoring.Skills.AuthorPlanDefinitions` |  |
| [SGAuthoring.Skills.AuthorQuestionnaires](./artifact/Basic-SGAuthoring.Skills.AuthorQuestionnaires.html)<br>`Basic/SGAuthoring.Skills.AuthorQuestionnaires` |  |
| [SGAuthoring.Skills.AuthorSchedulingLogic](./artifact/Basic-SGAuthoring.Skills.AuthorSchedulingLogic.html)<br>`Basic/SGAuthoring.Skills.AuthorSchedulingLogic` |  |
| [SGAuthoring.Skills.AuthorStructureMaps](./artifact/Basic-SGAuthoring.Skills.AuthorStructureMaps.html)<br>`Basic/SGAuthoring.Skills.AuthorStructureMaps` |  |
| [SGAuthoring.Skills.AuthorTestCases](./artifact/Basic-SGAuthoring.Skills.AuthorTestCases.html)<br>`Basic/SGAuthoring.Skills.AuthorTestCases` |  |
| [SGAuthoring.Skills.AuthorUserScenarios](./artifact/Basic-SGAuthoring.Skills.AuthorUserScenarios.html)<br>`Basic/SGAuthoring.Skills.AuthorUserScenarios` |  |
| [SGAuthoring.Skills.AuthorValueSets](./artifact/Basic-SGAuthoring.Skills.AuthorValueSets.html)<br>`Basic/SGAuthoring.Skills.AuthorValueSets` |  |
| [SGAuthoring.Skills.BuildIG](./artifact/Basic-SGAuthoring.Skills.BuildIG.html)<br>`Basic/SGAuthoring.Skills.BuildIG` |  |
| [SGAuthoring.Skills.ConfigureIG](./artifact/Basic-SGAuthoring.Skills.ConfigureIG.html)<br>`Basic/SGAuthoring.Skills.ConfigureIG` |  |
| [SGAuthoring.Skills.InterpretClinicalRecommendations](./artifact/Basic-SGAuthoring.Skills.InterpretClinicalRecommendations.html)<br>`Basic/SGAuthoring.Skills.InterpretClinicalRecommendations` |  |
| [SGAuthoring.Skills.ManageGovernance](./artifact/Basic-SGAuthoring.Skills.ManageGovernance.html)<br>`Basic/SGAuthoring.Skills.ManageGovernance` |  |
| [SGAuthoring.Skills.ManageReleases](./artifact/Basic-SGAuthoring.Skills.ManageReleases.html)<br>`Basic/SGAuthoring.Skills.ManageReleases` |  |
| [SGAuthoring.Skills.ManageStakeholders](./artifact/Basic-SGAuthoring.Skills.ManageStakeholders.html)<br>`Basic/SGAuthoring.Skills.ManageStakeholders` |  |
| [SGAuthoring.Skills.MapConcepts](./artifact/Basic-SGAuthoring.Skills.MapConcepts.html)<br>`Basic/SGAuthoring.Skills.MapConcepts` |  |
| [SGAuthoring.Skills.PlanIterations](./artifact/Basic-SGAuthoring.Skills.PlanIterations.html)<br>`Basic/SGAuthoring.Skills.PlanIterations` |  |
| [SGAuthoring.Skills.ReviewAndApproveContent](./artifact/Basic-SGAuthoring.Skills.ReviewAndApproveContent.html)<br>`Basic/SGAuthoring.Skills.ReviewAndApproveContent` |  |
| [SGAuthoring.Skills.ReviewChecklist](./artifact/Basic-SGAuthoring.Skills.ReviewChecklist.html)<br>`Basic/SGAuthoring.Skills.ReviewChecklist` |  |
| [SGAuthoring.Skills.ReviewL1Guidelines](./artifact/Basic-SGAuthoring.Skills.ReviewL1Guidelines.html)<br>`Basic/SGAuthoring.Skills.ReviewL1Guidelines` |  |
| [SGAuthoring.Skills.ReviewTerminology](./artifact/Basic-SGAuthoring.Skills.ReviewTerminology.html)<br>`Basic/SGAuthoring.Skills.ReviewTerminology` |  |
| [SGAuthoring.Skills.ReviewTranslations](./artifact/Basic-SGAuthoring.Skills.ReviewTranslations.html)<br>`Basic/SGAuthoring.Skills.ReviewTranslations` |  |
| [SGAuthoring.Skills.RunQAChecks](./artifact/Basic-SGAuthoring.Skills.RunQAChecks.html)<br>`Basic/SGAuthoring.Skills.RunQAChecks` |  |
| [SGAuthoring.Skills.ScopeDAK](./artifact/Basic-SGAuthoring.Skills.ScopeDAK.html)<br>`Basic/SGAuthoring.Skills.ScopeDAK` |  |
| [SGAuthoring.Skills.TranslateContent](./artifact/Basic-SGAuthoring.Skills.TranslateContent.html)<br>`Basic/SGAuthoring.Skills.TranslateContent` |  |
| [SGAuthoring.Skills.ValidateArtifactConformance](./artifact/Basic-SGAuthoring.Skills.ValidateArtifactConformance.html)<br>`Basic/SGAuthoring.Skills.ValidateArtifactConformance` |  |
| [SGAuthoring.Skills.ValidateDAKContent](./artifact/Basic-SGAuthoring.Skills.ValidateDAKContent.html)<br>`Basic/SGAuthoring.Skills.ValidateDAKContent` |  |
| [SGAuthoring.Skills.ValidateL3Functionality](./artifact/Basic-SGAuthoring.Skills.ValidateL3Functionality.html)<br>`Basic/SGAuthoring.Skills.ValidateL3Functionality` |  |
| [Base](./artifact/ImplementationGuide-smart.who.int.base.html)<br>`ImplementationGuide/smart.who.int.base` |  |

</details>
