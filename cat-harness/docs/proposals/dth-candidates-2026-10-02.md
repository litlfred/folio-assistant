---
title: "DTH candidates: methodologies, processes and glossary"
kind: proposal
issue: 1767
summary: >-
  What the three WHO Digital Transformation Handbooks and the draft DPI-H
  Reference Architecture define, extracted with a verbatim citation each, for
  the owner to choose from BEFORE anything is authored (bean 5blc). 16
  methodologies, 24 processes, 241 glossary terms; 40 terms conflict with
  another definition.
---

# DTH candidates: methodologies, processes and glossary

Bean `5blc`, owner 2026-10-01: the handbooks are *"also source of methodologies
/ processes / glossary"*. The bean's rule is that the **owner reviews this list
before anything is authored**, so this page proposes and authors nothing.

Every row cites its handbook. The full record, with each verbatim quote,
section id and the steps, actors, inputs and outputs, is
[`dth-candidates-2026-10-02.json`](dth-candidates-2026-10-02.json); every one
of its 421 quotes was checked programmatically against the ingested section.
Sources: **PHC** = DTH for primary health care (9789240093362), **SC** = DTH
for health supply chain architecture (9789240101197), **PC** = DTH for health
product catalogue (9789240116191), **RA** = Reference Architecture for DPI-H,
DRAFT V1.0. `status` is `new`, `overlaps:<path>` or `extends:<path>` against
what this repository already holds.

## Read these first

1. **SC Annex 3 contradicts `smart-base/methodologies/diig.md`.** The annex
   ranks bottlenecks by summing three 1–3 scores; `diig.md` adopts the same
   three criteria and explicitly refuses the arithmetic. Adopting the annex as
   written would reverse that refusal (`dth-dhsc-challenge-prioritization`).
2. **All three DTHs reproduce the DIIG's seven-phase figure**, which `diig.md`
   does not model (it renders the nine chapters). Recorded in #1830 too.
3. **PHC Chapter 3 maps almost one-to-one onto
   `smart-base/processes/l2-dak-authoring.bpmn`** — personas, workflows, data
   dictionary, decision logic, indicators and requirements. PHC also prescribes
   BPMN drawing rules worth checking against the `bpmn-authoring` skill.
4. **"Actor" collides.** The RA's actor is an abstract role a system realises;
   the platform's actor is a concrete participant that takes on roles — the
   RA's term is the platform's "role".
5. **Definitions disagree across the handbooks** for enterprise architecture,
   interoperability (four variants), SMART Guidelines (three framings),
   functions, non-functional requirements, and digitization/digitalization;
   three terms are defined two ways inside a single handbook. The table below
   lists every one.

Source defects found on the way, recorded rather than corrected: SC Chapter 1
announces five steps and lists four; PC chapter 04 has two titles and two
chapter numberings; PC Chapter 05 Step 3 repeats Step 2's rows; the RA leaves
"Health Information Exchange" and "Repository" undefined.

## Methodologies (16)

| id | title | status | source |
|---|---|---|---|
| `dth-phc-stepwise-digitizing` | Stepwise approach to digitizing primary health care (PCPOSS) | extends:methodologies/diig.md | PHC p.26-27; PHC p.26-27 |
| `dth-digital-health-enterprise-seven-phases` | Planning and implementing a digital health enterprise: seven phases (DIIG-derived figure) | overlaps:methodologies/diig.md | PHC p.24-26; SC p.15 |
| `dth-phc-requirements-gathering-methods` | Requirements-gathering methods (desk review, observation, interviews, workshops) | overlaps:processes/crdm-needs.bpmn | PHC p.30-33; PHC p.30-33 |
| `dth-dhsc-stepwise-approach` | Stepwise approach to digitalizing the health supply chain (DHSC) | extends:methodologies/diig.md | SC p.14; SC p.13 |
| `dth-dhsc-strategy` | Defining a holistic DHSC strategy (Chapter 1, Steps 1-4) | new | SC p.21; SC p.26 |
| `dth-dhsc-architecture` | Defining the DHSC architecture (Chapter 2, Steps 1-3) | new | SC p.29; SC p.31 |
| `dth-dhsc-implementation` | Planning for scalable implementation and sustainable operations (Chapter 3, Steps 1-4) | overlaps:methodologies/diig.md | SC p.45; SC p.46 |
| `dth-dhsc-challenge-prioritization` | Template for prioritizing DHSC challenges (Annex 3) - bottleneck scoring | overlaps:methodologies/diig.md | SC p.68 |
| `dth-npc-stepwise-approach` | Stepwise approach to a national product catalogue (NPC) and product master data management (chapters 01-05) | extends:methodologies/diig.md | PC p.17; PC p.12 |
| `dth-smart-guidelines-knowledge-layers` | SMART Guidelines five knowledge layers (L1-L5) as a stepwise pathway | overlaps:skills/content/authoring-who-smart-guidelines/smart-stack-layering.md | SC p.16; PC p.14 |
| `ra-goals-to-dpih-mapping` | Methodology: mapping health goals to DPI-H (goals-first, TOGAF-based) | new | RA p.48-49; RA p.49-50 |
| `ra-archimate-architecture-description` | Architecture description with a typed ArchiMate subset (elements, relationships, views) | new | RA p.52-59; RA p.52-59 |
| `ra-conformance-and-testing` | Conformance and testing across architecture and components (Section 3.7) | new | RA p.90-94; RA p.95-96 |
| `ra-phased-implementation-to-reddhi` | Charting a path to REDDHI: four entry points and a four-phase implementation approach | extends:methodologies/diig.md | RA p.100-101; RA p.101-104 |
| `ra-navigating-legacy-systems` | Navigating legacy systems (assess, integrate, replace at transition points, stop new silos) | new | RA p.104; RA p.104 |
| `ra-measuring-progress-and-impact` | Measuring progress and impact (four dimensions, baselines, process evaluation) | new | RA p.110-111; RA p.110 |

## Processes (24)

Each could be drawn as BPMN; the JSON carries its steps, actors, inputs and outputs as the handbook states them.

| id | title | status | source |
|---|---|---|---|
| `phc-understand-user-requirements` | PHC Chapter 3 - Understand user requirements | overlaps:processes/l2-dak-authoring.bpmn | PHC p.27-30; PHC p.47-52 |
| `phc-business-process-workflow-mapping` | PHC 3.3 - Map business processes and workflows (as-is / to-be, BPMN) | overlaps:processes/l2-dak-authoring.bpmn | PHC p.35-39; PHC p.35-39 |
| `phc-streamline-data-and-data-dictionary` | PHC 3.4-3.5 - Streamline data collection and indicator reporting into a data dictionary | overlaps:processes/l2-dak-authoring.bpmn | PHC p.39-42; PHC p.42-44 |
| `phc-decision-support-logic-and-schedules` | PHC 3.6-3.7 - Determine decision-support logic and map health service schedules | overlaps:processes/l2-dak-authoring.bpmn | PHC p.44-47; PHC p.47 |
| `phc-gather-and-prioritize-requirements` | PHC 3.8 - Gather and prioritize functional and non-functional requirements | overlaps:processes/crdm-requirements-definition.bpmn | PHC p.47-52; PHC p.47-52 |
| `phc-design-and-adaptation` | PHC Chapter 4 - Undertake design and adaptation | new | PHC p.47-52; PHC p.60-64 |
| `phc-prototype-design-and-testing` | PHC 4.3 - Develop and test the prototype design | overlaps:processes/wireframe-design-review.bpmn | PHC p.53-56; PHC p.53-56 |
| `phc-training-testing-rollout` | PHC Chapter 5 - Conduct training, testing and roll-out | new | PHC p.64-65; PHC p.65-68 |
| `phc-deploy-the-system` | PHC 5.3 - Deploy the system (ad hoc set of roll-out activities) | new | PHC p.65; PHC p.65 |
| `phc-prepare-for-scale-up` | PHC Chapter 6 - Prepare for scale-up and phase out paper/legacy systems | new | PHC p.68-71; PHC p.71 |
| `dhsc-define-strategy` | DHSC Chapter 1 - Define a holistic DHSC strategy | new | SC p.22; SC p.25 |
| `dhsc-define-architecture` | DHSC Chapter 2 - Define the DHSC architecture | new | SC p.32; SC p.42 |
| `dhsc-implement-interventions` | DHSC Chapter 3 - Plan, budget and implement each DHSC intervention | overlaps:methodologies/diig.md | SC p.47; SC p.51 |
| `dhsc-traceability-event-flow` | DHSC Chapter 4 - Track, trace and verify a health product (centralized traceability model) | new | SC p.55; SC p.56 |
| `npc-01-regulatory-policies` | NPC 01 - Establish regulatory policies to promote product master data standardization | new | PC p.21; PC p.23 |
| `npc-02-data-management-governance` | NPC 02 - Institute data management and governance policies | new | PC p.25; PC p.32 |
| `npc-03-deploy-technology` | NPC 03 - Deploy appropriate technology to manage product master data | new | PC p.36; PC p.37 |
| `npc-04-manage-change` | NPC 04 - Manage change to institutionalize standardized product master data | new | PC p.39; PC p.40 |
| `npc-05-build-capacity` | NPC 05 - Build capacity to sustainably manage the NPC | new | PC p.43; PC p.44 |
| `ra-national-architecture-assessment` | RA 4.1 - National digital health architecture assessment -> roadmap | new | RA p.99-100; RA p.99-100 |
| `ra-semantic-governance-content-lifecycle` | RA 3.4.5 - Semantic Governance Infrastructure: governed content lifecycle | overlaps:fhir-harness/skills/content/fhir-ig-authoring/terminology-management.md | RA p.68-73; RA p.68-73 |
| `ra-operational-to-strategic-escalation` | RA 3.4.4 - Escalation from operational to strategic governance | new | RA p.67-68; RA p.67-68 |
| `ra-component-conformance-testing` | RA 3.7 / 4.3.5 - Conformance testing of a component in an actor role | new | RA p.90-94; RA p.109 |
| `ra-adoption-mapping-and-coverage` | RA 3.7.5 - Evaluate country adoption of the reference by mapping (coverage and gaps) | new | RA p.96-97; RA p.96-97 |

## Glossary terms that conflict (40 of 241)

| term | defined in | conflicts with | severity | difference |
|---|---|---|---|---|
| Actor (conformance model) | RA | folio-assistant-core/glossary/cat-harness.glossary.json | substantive | The platform's "actor" is a concrete participant that takes on roles; the RA's "actor" is an abstract information-processing ROLE realised by concrete systems - closer to the platform's "role". Adopting the RA term unqualified would collide. |
| Application Service | RA | RA | wording | RA glossary vs Table 3.1 phrasing. |
| Capability | RA | RA | wording | RA glossary: "A high-level ability ... in order to achieve its goals"; RA Table 3.1: "An ability ... expressed independently of how it is implemented". |
| Deploy | PHC, SC | SC | wording | Wording differs (automatic comparison; not reviewed as substantive). |
| Digital health | PHC, SC, RA | SC | wording | Near-identical: differs only in phrasing, punctuation or citation markers. |
| Digital health | PHC, SC, RA | SC | internal | PHC, SC and RA glossaries agree; the SC introduction body quotes a different Global Strategy definition, "the field of knowledge and practice associated with the development and use of digital technologies to improve health". |
| Digital health | PHC, SC, RA | RA | wording | Near-identical: differs only in phrasing, punctuation or citation markers. |
| Digital Public Infrastructure (DPI) | RA | RA | wording | Glossary uses the G20 definition; section 1.1.2 also gives the World Bank framing ("an approach to digitalization"). |
| Digital transformation | PHC, SC, PC | SC | wording | SC reorders the same content and prefixes "In the health context"; PC writes "person centred". |
| Digitalization | PHC, SC, PC | SC | substantive | SC and PC add the claim that digitalization is "the second step" in/towards digital transformation; PHC does not. |
| Digitalization | PHC, SC, PC | PC | substantive | SC and PC add the claim that digitalization is "the second step" in/towards digital transformation; PHC does not. |
| Digitization | PHC, SC, PC | SC | substantive | SC and PC add a sequencing claim (digitization is the initial step in/towards digital transformation) that PHC does not make; SC also adds "manual". |
| Digitization | PHC, SC, PC | PC | substantive | SC and PC add a sequencing claim (digitization is the initial step in/towards digital transformation) that PHC does not make; SC also adds "manual". |
| End-user | PHC, SC, PC | SC | wording | Wording differs (automatic comparison; not reviewed as substantive). |
| Enterprise architecture | PHC, SC, RA | SC | wording | Near-identical: differs only in phrasing, punctuation or citation markers. |
| Enterprise architecture | PHC, SC, RA | RA | substantive | PHC and SC: "a blueprint of business processes, data, systems and technologies"; RA: "the organising logic for business processes and IT infrastructure" reflecting the operating model, marked [Under review]. |
| Features | PHC, SC, PC | SC | wording | Domain examples differ; PC says "your system". |
| Features | PHC, SC, PC | PC | wording | Domain examples differ; PC says "your system". |
| Functional requirements | PHC, SC, PC | SC | wording | PHC/PC: tasks of "the health system process"; SC: tasks of "the business process". |
| Functional requirements | PHC, SC, PC | PC | wording | PHC/PC: tasks of "the health system process"; SC: tasks of "the business process". |
| Functions | PHC, SC | SC | substantive | PHC: functions are "how features are implemented"; SC: functions are "Business processes within a system that help the system perform". |
| Generic product or product information | PC | PC | wording | Glossary: identifying details "excluding any manufacturer-specific information"; body: items "that conceal the brand or manufacturer information". |
| governance (body, health supply chain) | SC, RA | RA | substantive | SC (supply chain): "the process of establishing and implementing policies, procedures and mechanisms"; RA: "the set of arrangements through which decision authority is distributed, exercised and accounted for". |
| Health Digital Public Infrastructure (DPI-H) | RA | RA | wording | Body adds the systems-and-specifications sentence. |
| Interoperability | PHC, SC, PC, RA | PHC | internal | PHC/PC glossaries agree; SC adds "safe" and "help ensure good health outcomes"; PHC section 4.4 body drops "value sets, concepts" and says standards "should be defined by the EA"; RA: "the standards-based capability of heterogeneous information systems to communicate, exchange data, and use the exch |
| Interoperability | PHC, SC, PC, RA | SC | substantive | PHC/PC glossaries agree; SC adds "safe" and "help ensure good health outcomes"; PHC section 4.4 body drops "value sets, concepts" and says standards "should be defined by the EA"; RA: "the standards-based capability of heterogeneous information systems to communicate, exchange data, and use the exch |
| Interoperability | PHC, SC, PC, RA | RA | substantive | PHC/PC glossaries agree; SC adds "safe" and "help ensure good health outcomes"; PHC section 4.4 body drops "value sets, concepts" and says standards "should be defined by the EA"; RA: "the standards-based capability of heterogeneous information systems to communicate, exchange data, and use the exch |
| Non-functional requirements | PHC, SC, PC | SC | substantive | PHC: attributes and features "to ensure usability and overcome technical and physical constraints"; SC: "how the digital system needs to operate and perform" for business-process tasks; PC: "attributes and constraints ... to ensure its quality and performance". |
| Non-functional requirements | PHC, SC, PC | PC | substantive | PHC: attributes and features "to ensure usability and overcome technical and physical constraints"; SC: "how the digital system needs to operate and perform" for business-process tasks; PC: "attributes and constraints ... to ensure its quality and performance". |
| Open source | PHC, SC, PC | SC | wording | Wording differs (automatic comparison; not reviewed as substantive). |
| Open standards | PHC, SC, PC | SC | wording | Near-identical: differs only in phrasing, punctuation or citation markers. |
| organogram | SC, PC | PC | wording | Wording differs (automatic comparison; not reviewed as substantive). |
| Outcome | RA | RA | wording | RA glossary: "An end result or consequence of a set of activities"; RA Table 3.1: "An achieved, and often measurable, result". |
| Product | RA | RA | wording | RA glossary "A concrete offering" vs Table 3.1 "A coherent offering". HOMONYM WARNING: unrelated to "product" in the PC handbook (a health product / generic product). |
| Reference Architecture | RA | RA | wording | Body adds the purpose clause. |
| Registry | PHC, SC, PC, RA | SC | wording | Near-identical: differs only in phrasing, punctuation or citation markers. |
| Registry | PHC, SC, PC, RA | PC | wording | Near-identical: differs only in phrasing, punctuation or citation markers. |
| Registry | PHC, SC, PC, RA | RA | wording | Near-identical: differs only in phrasing, punctuation or citation markers. |
| SMART Guidelines | PHC, SC, PC, RA | SC | substantive | PHC: "recommended digital capabilities, health and data content aligned with normative recommendations"; SC: "The WHO guidelines for developing" SMART components; PC and RA: "a comprehensive set of reusable digital health components" with a five-step pathway. |
| SMART Guidelines | PHC, SC, PC, RA | PC | substantive | PHC: "recommended digital capabilities, health and data content aligned with normative recommendations"; SC: "The WHO guidelines for developing" SMART components; PC and RA: "a comprehensive set of reusable digital health components" with a five-step pathway. |
| SMART Guidelines | PHC, SC, PC, RA | RA | substantive | PHC: "recommended digital capabilities, health and data content aligned with normative recommendations"; SC: "The WHO guidelines for developing" SMART components; PC and RA: "a comprehensive set of reusable digital health components" with a five-step pathway. |
| stakeholder | SC, RA | RA | substantive | SC: "anyone who is affected by or interested in the consequences of the efforts"; RA glossary: "An individual, role, or organisation with an interest in the outcomes of the architecture"; RA Table 3.1: "...in the architecture and its outcomes". |
| stakeholder | SC, RA | RA | substantive | SC: "anyone who is affected by or interested in the consequences of the efforts"; RA glossary: "An individual, role, or organisation with an interest in the outcomes of the architecture"; RA Table 3.1: "...in the architecture and its outcomes". |
| Systems architecture | PHC, SC | PHC | wording | PHC: "how the system is structured"; SC: "how the system should be structured"; PHC section 4.4 body widens it to "all the software and hardware components". |
| Systems architecture | PHC, SC | SC | wording | PHC: "how the system is structured"; SC: "how the system should be structured"; PHC section 4.4 body widens it to "all the software and hardware components". |
| traceability | SC | SC | internal | SC glossary: "The ability to trace something" (verify history, location or application); SC Chapter 4 body quotes GS1: the ability "to see the movement of health products across the supply chain". |
| Trade item | PC | PC | internal | PC glossary (GS1): "Products or services that are priced, ordered or invoiced"; PC Chapter 02 body: "manufacturer-specific branded health products". |
| Use case | PHC, SC | SC | wording | Wording differs (automatic comparison; not reviewed as substantive). |
| User acceptance testing | PHC, PC | PC | wording | Wording differs (automatic comparison; not reviewed as substantive). |
| User persona | PHC | PHC | wording | Glossary: profile "of an end-user"; section 3.2.1: depiction "of a relevant stakeholder, or end-user". |
| User story | PHC | folio-assistant-core/glossary/cat-harness.glossary.json | wording | Compatible template; PHC binds the story to a user PERSONA ("As a... [user persona]"), the platform to a Role. |
| Workflow | PHC | PHC | internal | PHC glossary: "The sequence of activities from one task to another"; PHC section 3.3 body: "a visual representation of the progression of activities" within a business process. |
| ITU | PHC, SC | SC | wording | PHC "Telecommunications" vs SC "Telecommunication" (the organisation's own name is singular). |
| RFQ | SC, PC | PC | wording | SC "request for quotation" vs PC "Request for quote". |
| SCISMM | SC, PC | PC | wording | SC "Supply Chain Information System Maturity Model" vs PC "Supply chain information systems maturity model". |
| SDG | PHC, RA | RA | wording | PHC plural "Goals" vs RA singular "Goal". |

## All glossary terms (241)

| term | kind | status | source |
|---|---|---|---|
| Accesses (relationship) | body | new | RA p.52-59 |
| Actor (conformance model) | body | overlaps:folio-assistant-core/glossary/cat-harness.glossary.json | RA p.90-94 |
| Adaptation (country-to-reference) | body | new | RA p.96-97 |
| Adoption (country-to-reference) | body | new | RA p.96-97 |
| AEFI | abbreviation | new | PC p.6 |
| AI | abbreviation | new | RA p.1-19 |
| AIDC | abbreviation | new | PC p.6 |
| Algorithm | glossary | new | PHC p.8 |
| ANC | abbreviation | new | PHC p.7-8 |
| Annotation | glossary | new | PHC p.8 |
| API | abbreviation | new | PHC p.7-8 |
| Application Component | glossary | new | RA p.1-19 |
| Application Function | body | new | RA p.90-94 |
| Application Interaction | body | new | RA p.90-94 |
| Application Service | glossary | new | RA p.1-19; RA p.52-59 |
| Artificial intelligence | body | new | RA p.114-115 |
| As-is | glossary | new | PHC p.8 |
| Assignment (relationship) | body | new | RA p.90-94 |
| ATC | abbreviation | new | PC p.6 |
| Benefits Package Registry | body | new | RA p.210-218 |
| Beta version | glossary | new | PHC p.8 |
| BPMN | abbreviation | overlaps:skills/process/workflow/bpmn-authoring.md | PHC p.7-8 |
| Build | glossary | new | PHC p.8 |
| Business Domain | glossary | new | RA p.1-19 |
| Business objective | glossary | new | PHC p.8 |
| Business process | glossary | overlaps:docs/artifact/StructureDefinition-BusinessProcessWorkflow.md | PHC p.8 |
| Business Services layer | glossary | new | RA p.1-19 |
| Capability | glossary | new | RA p.1-19; RA p.52-59 |
| Care pathway | glossary | new | PHC p.8 |
| Client | glossary | new | RA p.1-19 |
| Client Registry | body | new | RA p.125-135 |
| Clinical protocol | glossary | new | PHC p.8 |
| Community-based information system | glossary | new | PHC p.8 |
| Composes (relationship) | body | new | RA p.52-59 |
| Computable Decision Support Engine (CDSE) | body | new | RA p.191-202 |
| Conformance | body | new | RA p.90-94 |
| Coverage (adoption) | body | new | RA p.96-97 |
| CRDM | abbreviation | overlaps:skills/sdlc/crdm/crdm-requirements-workflow.md | PHC p.7-8 |
| DAK | abbreviation | overlaps:docs/artifact/StructureDefinition-DAK.md | PHC p.7-8; PC p.6 |
| Data custodian (body, ch. 02) | body | new | PC p.26 |
| Data dictionary | glossary | new | PHC p.8 |
| Data element | glossary | overlaps:docs/artifact/StructureDefinition-CoreDataElement.md | PHC p.8; PC p.8 |
| Data Governance | glossary | new | RA p.1-19 |
| Data Object | glossary | new | RA p.1-19 |
| Data owner (body, ch. 02) | body | new | PC p.26 |
| Data steward (body, ch. 02) | body | new | PC p.26 |
| DBP | abbreviation | new | PHC p.7-8 |
| Decision support logic | glossary | overlaps:docs/artifact/StructureDefinition-DecisionSupportLogic.md | PHC p.8 |
| Decision support system | glossary | new | PHC p.8 |
| Decision-support table | glossary | overlaps:methodologies/dmn.md | PHC p.8 |
| Deploy | glossary | new | PHC p.8; SC p.8 |
| DevSecOps | glossary | new | PHC p.8 |
| DH&I | abbreviation | new | PC p.6 |
| DH&I WG | abbreviation | new | SC p.7 |
| DHA | abbreviation | new | PHC p.7-8 |
| DHSC | abbreviation | new | SC p.7; PC p.6 |
| DICOM | abbreviation | new | PHC p.7-8 |
| Digital adaptation kits (DAKs) | glossary | overlaps:docs/artifact/StructureDefinition-DAK.md | PHC p.9 |
| Digital health | glossary | new | PHC p.9; SC p.8 |
| Digital health intervention | glossary | overlaps:docs/artifact/CodeSystem-CDHIv2.md | PHC p.9 |
| digital health supply chain (DHSC) (body) | body | new | SC p.12 |
| digital health supply chain intervention | glossary | new | SC p.8 |
| Digital Infrastructure | glossary | new | RA p.1-19 |
| Digital Public Infrastructure (DPI) | glossary | new | RA p.1-19; RA p.19-21 |
| Digital transformation | glossary | new | PHC p.9; SC p.8 |
| Digitalization | glossary | new | PHC p.9; SC p.8 |
| Digitization | glossary | new | PHC p.9; SC p.8 |
| DIIG | abbreviation | overlaps:methodologies/diig.md | PHC p.7-8; SC p.7 |
| DPI | abbreviation | new | RA p.1-19 |
| DPI-F | abbreviation | new | RA p.1-19 |
| DPI-H | abbreviation | new | RA p.1-19 |
| EA | abbreviation | new | PHC p.7-8 |
| Electronic health record system | glossary | new | PHC p.9 |
| eLMIS | abbreviation | new | PC p.6 |
| End-user | glossary | new | PHC p.9; SC p.8 |
| Enterprise architecture | glossary | new | PHC p.9; SC p.8 |
| eRIS | abbreviation | new | SC p.7 |
| ERP | abbreviation | new | SC p.7 |
| Fast Healthcare Interoperability Resources (FHIR) | glossary | new | RA p.1-19 |
| FDA | abbreviation | new | PC p.6 |
| Features | glossary | new | PHC p.9; SC p.8 |
| FHIR | abbreviation | new | PHC p.7-8; PC p.6 |
| Flag | glossary | new | PHC p.9 |
| foundational components (body, DHSC architecture) | body | new | SC p.35 |
| FTE | abbreviation | new | SC p.7 |
| Functional application | glossary | new | RA p.1-19 |
| Functional requirements | glossary | overlaps:docs/artifact/StructureDefinition-FunctionalRequirement.md | PHC p.9; SC p.8 |
| Functions | glossary | new | PHC p.9; SC p.8 |
| GDSN | abbreviation | new | PC p.6 |
| Generic product or product information | glossary | new | PC p.8; PC p.28 |
| GFPVAN | abbreviation | new | SC p.7 |
| GHSC-PSM | abbreviation | new | SC p.7 |
| Goal | glossary | new | RA p.1-19 |
| governance (body, health supply chain) | body | new | SC p.45; RA p.64-65 |
| GTIN | abbreviation | new | PC p.6 |
| Health Digital Public Infrastructure (DPI-H) | glossary | new | RA p.1-19; RA p.19-21 |
| Health Facility Registry | body | new | RA p.135-146 |
| Health Information Exchange | glossary | new | RA p.1-19 |
| Health Management Information System (HMIS) | body | new | RA p.221-229 |
| Health Programme | glossary | new | RA p.1-19 |
| Health service users | glossary | new | PHC p.9 |
| Health service user’s health records | glossary | new | PHC p.9 |
| health supply chain information system | glossary | new | SC p.8 |
| Health Workforce Registry | body | new | RA p.146-156 |
| HL7 | abbreviation | new | PHC p.7-8; PC p.6 |
| HL7 FHIR® | abbreviation | new | RA p.1-19 |
| HRP | abbreviation | new | PHC p.7-8 |
| HSCIS | abbreviation | new | SC p.7 |
| HTSS | abbreviation | new | SC p.7 |
| ICD-11 | abbreviation | new | PHC p.7-8; PC p.6 |
| ICF | abbreviation | new | PHC p.7-8 |
| ICHI | abbreviation | new | PHC p.7-8; PC p.6 |
| ICT | abbreviation | new | SC p.7 |
| ICVP | abbreviation | new | RA p.1-19 |
| ID | abbreviation | new | PHC p.7-8; PC p.6 |
| IDMP | abbreviation | new | PC p.6 |
| IHE | abbreviation | new | PHC p.7-8 |
| INN | abbreviation | new | PC p.6 |
| Input | glossary | new | PHC p.9 |
| Integration | glossary | new | RA p.1-19 |
| Interoperability | glossary | new | PHC p.9; PHC p.56-60 |
| interoperability layer (body, DHSC architecture) | body | new | SC p.35 |
| IPS | abbreviation | new | RA p.1-19 |
| IT | abbreviation | new | PHC p.7-8; SC p.7 |
| ITU | abbreviation | new | PHC p.7-8; SC p.7 |
| JSON | abbreviation | new | PHC p.7-8 |
| KPI | abbreviation | new | SC p.7 |
| Legacy system | glossary | new | PHC p.10 |
| Lifelong Health Record (LHR) | body | new | RA p.166-175 |
| LMIC | abbreviation | new | RA p.1-19 |
| Logical Information Model Repository (LIMR) | body | new | RA p.183-191 |
| Logical Observation Identifiers Names and Codes (LOINC) | glossary | new | RA p.1-19 |
| LOINC | abbreviation | new | PHC p.7-8; RA p.1-19 |
| Longitudinal tracking [of a health service user] | glossary | new | PHC p.10 |
| Mapping (country-to-reference) | body | new | RA p.96-97 |
| MAPS | abbreviation | new | PHC p.7-8 |
| Minimum viable product (MVP) | glossary | new | PHC p.10 |
| Mock-up | glossary | new | PHC p.10 |
| MOH | abbreviation | new | SC p.7 |
| MVP | abbreviation | new | PHC p.7-8 |
| NAFDAC | abbreviation | new | PC p.6 |
| National digital architect | body | new | RA p.104-105 |
| National digital health architecture roadmap | body | new | RA p.99-100 |
| NGO | abbreviation | new | PC p.6 |
| Non-functional requirements | glossary | overlaps:docs/artifact/StructureDefinition-NonFunctionalRequirement.md | PHC p.10; SC p.8 |
| NPC | abbreviation | new | SC p.7; PC p.6 |
| NPC (national product catalogue tool) (body, ch. 03) | body | new | PC p.35 |
| NRA | abbreviation | new | PC p.6 |
| NSCA | abbreviation | new | SC p.7 |
| Open source | glossary | new | PHC p.10; SC p.8 |
| Open standards | glossary | new | PHC p.10; SC p.9 |
| OpenHIE | abbreviation | new | PHC p.7-8; SC p.7 |
| Operational governance | body | new | RA p.67-68 |
| order management | glossary | new | SC p.9 |
| order management system | glossary | new | SC p.9 |
| organogram | glossary | new | SC p.9; PC p.8 |
| Outcome | glossary | new | RA p.1-19; RA p.52-59 |
| Output | glossary | new | PHC p.10 |
| Pain point | glossary | new | PHC p.10 |
| PCMT | abbreviation | new | PC p.7 |
| PCPOSS | abbreviation | new | PHC p.7-8 |
| Person-centred | glossary | new | PHC p.10 |
| Person-centred point of service system (PCPOSS) | glossary | new | PHC p.10 |
| PHC | abbreviation | new | PHC p.7-8 |
| Point-of-service applications | glossary | new | RA p.1-19 |
| Pop-up message | glossary | new | PHC p.10 |
| POS | abbreviation | new | PHC p.7-8 |
| Product | glossary | new | RA p.1-19; RA p.52-59 |
| Product master data (body) | body | new | PC p.10 |
| Product Registry | body | new | RA p.156-166 |
| Prototype | glossary | new | PHC p.10 |
| Public Health Surveillance Platform (PHSP) | body | new | RA p.229-240 |
| QA | abbreviation | new | SC p.7 |
| Realises (relationship) | body | new | RA p.52-59 |
| REDDHI | abbreviation | new | RA p.1-19 |
| Reference Architecture | glossary | new | RA p.1-19; RA p.19 |
| Reference software | glossary | new | PHC p.10 |
| Register | glossary | new | PHC p.11 |
| Registry | glossary | new | PHC p.11; SC p.9 |
| Regulated Trade Item (body, ch. 02) | body | new | PC p.28 |
| Resilient Essential Data and Digital Health Infrastructure (REDDHI) | body | new | RA p.38-39 |
| RFP | abbreviation | new | SC p.7; PC p.7 |
| RFQ | abbreviation | new | SC p.7; PC p.7 |
| RMS | abbreviation | new | PC p.7 |
| Rule | glossary | new | PHC p.11 |
| SBP | abbreviation | new | PHC p.7-8 |
| SCISMM | abbreviation | new | SC p.7; PC p.7 |
| SCSA | abbreviation | new | SC p.7 |
| SDG | abbreviation | new | PHC p.7-8; RA p.1-19 |
| Semantic Governance Infrastructure (SGI) | body | new | RA p.68-73 |
| Serves (relationship) | body | new | RA p.52-59 |
| SMART | abbreviation | new | SC p.7; PC p.7 |
| SMART Guidelines | glossary | new | PHC p.11; SC p.9 |
| SMART Guidelines | abbreviation | new | RA p.1-19 |
| SNOMED CT | glossary | new | RA p.1-19 |
| SNOMED CT | abbreviation | new | RA p.1-19 |
| SNOMED GPS | glossary | new | RA p.1-19 |
| SNOMED-GPS | abbreviation | new | PHC p.7-8; RA p.1-19 |
| Software platform | glossary | new | PHC p.11 |
| Solution Architecture | glossary | new | RA p.1-19 |
| SOP | abbreviation | new | PC p.7 |
| stakeholder | glossary | new | SC p.9; RA p.1-19 |
| Strategic governance | body | new | RA p.65-67 |
| Subsidiarity (governance principle) | body | new | RA p.65 |
| Supplier Registry | body | new | RA p.202-210 |
| SWG | abbreviation | new | PC p.7 |
| Systems architecture | glossary | new | PHC p.11; PHC p.56-60 |
| Technical Debt | glossary | new | PHC p.11 |
| Terminology Service | body | new | RA p.175-183 |
| To-be | glossary | new | PHC p.11 |
| TOGAF | abbreviation | new | SC p.7; RA p.1-19 |
| TOR | abbreviation | new | PC p.7 |
| total cost of ownership | glossary | new | SC p.9 |
| traceability | glossary | new | SC p.9; SC p.54 |
| traceability models (centralized, semi-centralized, distributed) | body | new | SC p.54 |
| Trade item | glossary | new | PC p.9; PC p.28 |
| Transaction | body | new | RA p.90-94 |
| Transactional data (body) | body | new | PC p.10 |
| Trigger event | glossary | new | PHC p.11 |
| Triggering (relationship) | body | new | RA p.90-94 |
| TSS | abbreviation | new | SC p.7; PC p.7 |
| TWG | abbreviation | new | SC p.7 |
| UAT | abbreviation | new | PHC p.7-8; PC p.7 |
| UI | abbreviation | new | PHC p.7-8 |
| UMC | abbreviation | new | PC p.7 |
| USAID | abbreviation | new | SC p.7; PC p.7 |
| USAID GHSC-PSM | abbreviation | new | PC p.7 |
| Use case | glossary | new | PHC p.11; SC p.9 |
| User acceptance testing | glossary | new | PHC p.11; PC p.9 |
| User persona | glossary | overlaps:docs/artifact/StructureDefinition-GenericPersona.md | PHC p.11; PHC p.33-35 |
| User story | glossary | overlaps:folio-assistant-core/glossary/cat-harness.glossary.json | PHC p.11 |
| Value | glossary | new | RA p.1-19 |
| warehouse management system | glossary | new | SC p.9 |
| WHO | abbreviation | new | PHC p.7-8; SC p.7 |
| WHO-FIC | abbreviation | new | PHC p.7-8 |
| WHODrug | abbreviation | new | PC p.7 |
| Wireframes | glossary | new | PHC p.11 |
| WMS | abbreviation | new | SC p.7; PC p.7 |
| Workflow | glossary | new | PHC p.11; PHC p.35-39 |
| ZAMMSA | abbreviation | new | PC p.7 |
| ZAMRA | abbreviation | new | PC p.7 |
