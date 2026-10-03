---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-19
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
DRAFT V1.0 
 
 
Reference Architecture and Guidance 
for Digital Public Infrastructure for the 
Health Sector 
A Digital Transformation Handbook for Digital Public Infrastructure for 
Health (DPI-H) 
 
 
1 
Contents 
Chapter 1 
Introduction 
1.1 
About the Reference Architecture for health Digital Public Infrastructure (DPI-H) 
Guidance ......................................................................................................................................... 8 
1.1.1 What is a reference architecture, and why does it matter for the health sector? 8 
1.1.2 Understanding Digital Public Infrastructure (DPI) and health Digital Public 
Infrastructure (DPI-H) ............................................................................................................ 8 
1.1.3 Building on existing foundations ............................................................................. 10 
1.1.4 Who can benefit from this guidance? ...................................................................... 12 
1.2 
Why health needs more than foundational DPI................................................................. 13 
1.2.1 Identity DPI and Identification in Healthcare .......................................................... 13 
1.2.2 Data exchange DPI and Interoperability in the health sector ............................... 15 
1.2.3 Payments DPI and financial transactions in the health sector ............................. 16 
1.3 
Value of DPI-H ................................................................................................................... 17 
1.3.1 The Cost of Fragmentation ....................................................................................... 17 
1.3.2 What DPI-H Makes Possible ...................................................................................... 18 
1.3.3 Value Across Stakeholders ....................................................................................... 19 
1.4 
DPI-H Principles ................................................................................................................. 20 
1.5 
The Seven Priority Health Sector Goals............................................................................ 21 
1.5.1 The Health Sector Goals ............................................................................................ 22 
Chapter 2 
DPI-H Reference Architecture Framework 
2.1 
The Reference Architecture Scope ................................................................................... 24 
2.1.1 Metadata registries and foundational components ............................................... 25 
2.1.2 Business services layer ............................................................................................ 25 
2.1.3 Relationship to foundational DPI ............................................................................. 26 
2.2 
Resilient Essential Data and Digital Health Infrastructure (REDDHI) ............................... 26 
2.2.1 What REDDHI is and its foundational core ............................................................. 26 
2.2.2 The enabling conditions for REDDHI ....................................................................... 28 
2.3 
DPI-H Reference Architecture Design Principles .............................................................. 31 
2.4 
Methodology: Mapping Health Goals to DPI-H ................................................................. 37 
2.4.1 How each health goal is articulated ......................................................................... 38 
2.4.2 Worked example: Advance Efficient and Equitable Health Financing ................ 39 
Chapter 3 
The Reference Architecture for DPI-H 
3.1 
The architecture description approach .............................................................................. 41 
 
 
2 
3.2 
Reading and navigating the reference architecture .......................................................... 46 
3.3 
The reference architecture in practice ............................................................................... 48 
3.4 
Governance of Digital Health Architectures and DPI-H .................................................... 53 
3.4.1 Purpose and framing ................................................................................................. 53 
3.4.2 Governance principles............................................................................................... 54 
3.4.3 Strategic governance ................................................................................................. 55 
3.4.4 Operational governance ............................................................................................ 56 
3.4.5 Semantic Governance Infrastructure ....................................................................... 57 
3.4.6 Regional governance considerations ...................................................................... 62 
3.4.7 Governance maturity considerations ...................................................................... 63 
3.5 
DPI-H Application Components ......................................................................................... 63 
3.5.1  What Distinguishes a DPI-H Application Component........................................... 63 
3.5.2 How each component is described .......................................................................... 65 
3.5.3 How the components are organised ........................................................................ 66 
3.5.3.1 The foundational shared data layer ................................................................... 67 
3.5.3.2 The business services layer ............................................................................... 70 
3.6 
Interoperability Architecture within DPI-H.......................................................................... 71 
3.6.1 Interoperability as a capability, not just a component .......................................... 72 
3.6.2 Data and health content standards .......................................................................... 73 
3.6.3 Interoperability between DPI-H and foundational DPI ........................................... 74 
3.6.4 Cross-border health data flows ................................................................................ 77 
3.6.5 Conformance .............................................................................................................. 78 
3.7 
Conformance and Testing across Architecture and Components .................................... 78 
3.7.1 Purpose ....................................................................................................................... 78 
3.7.2 The model .................................................................................................................... 79 
3.7.3 Alignment with IHE profiles ...................................................................................... 83 
3.7.4 Planning testing from the architecture .................................................................... 84 
3.7.5 Validating goals and adoption .................................................................................. 85 
3.7.6 Constructs and their counterparts ........................................................................... 86 
Chapter 4 
Implementing a National Digital Health Architecture 
4.1 
Understanding the Starting Point....................................................................................... 88 
4.1.1 No Country Starts from Zero..................................................................................... 88 
4.1.2 Assessing Where You Are ........................................................................................ 88 
 
 
3 
4.2 
Charting a Path to REDDHI ............................................................................................... 89 
4.2.1 Different Entry Points toward REDDHI .................................................................... 89 
4.2.2 A Phased Implementation Approach ....................................................................... 90 
4.2.3 Navigating Legacy Systems...................................................................................... 93 
4.2.4 The Role of the National Digital Architect ............................................................... 93 
4.3 
Profiles and Specifications for Implementation ................................................................. 94 
4.3.1 Design Data Structures and Data Models First ...................................................... 94 
4.3.2 Actors and Roles: Defining Who Participates ........................................................ 95 
4.3.3 Services and Transactions: FHIR as the Recommended Framework ................. 96 
4.3.4 Integration Interfaces with Foundational DPI ......................................................... 96 
4.3.4 Interoperability Implementation Pathways ............................................................. 97 
4.3.5 Minimum Conformance and Testing ........................................................................ 98 
4.4 
Measuring Progress and Impact........................................................................................ 98 
4.4.1 Assessing impact: Are goals being achieved? ...................................................... 99 
4.4.2 Tracking progress over time ..................................................................................... 99 
4.5 
Roles, Skills, and Capacity .............................................................................................. 100 
4.5.1 How to Use This Architecture ................................................................................. 100 
4.5.2 The Roles and Skills Needed to Build and Govern the Architecture ................. 100 
4.5.3 Building and Sustaining National Capacity .......................................................... 101 
4.6 
Financing and Partnerships ............................................................................................. 102 
4.6.1 The Investment Case ............................................................................................... 102 
4.6.2 Sustainability by Design .......................................................................................... 102 
4.6.3 Approaches to Financing ........................................................................................ 103 
4.6.4 Partnerships .............................................................................................................. 103 
Chapter 5 
Future proofing the Architecture 
5.1 Emerging technologies and the foundations they depend on .............................................. 104 
5.2 Why data foundations determine what AI can deliver .......................................................... 105 
5.3 Where artificial intelligence can support the health system ................................................. 107 
5.4 Readiness, oversight, and responsible adoption ................................................................. 107 
5.4.1 What AI readiness means ........................................................................................ 107 
5.4.2 Trustworthy AI in a health setting .......................................................................... 108 
5.4.3 Equity and safety ...................................................................................................... 109 
5.4.4 Cost, sustainability, and commercial pressure .................................................... 109 
 
 
4 
5.5 Keeping the architecture open and adaptable ..................................................................... 109 
Appendix A .................................................................................................................................. 112 
Appendix B .................................................................................................................................. 113 
Appendix C: DPI-H Application Component Descriptions ......................................................... 114 
Metadata registries and foundational components .................................................................114 
Client Registry ................................................................................................................... 115 
Health Facility Registry ..................................................................................................... 124 
Health Workforce Registry ............................................................................................... 135 
Product Registry ................................................................................................................ 145 
Lifelong Health Record ..................................................................................................... 155 
Terminology Service ......................................................................................................... 164 
Logical Information Model Repository ........................................................................... 172 
Business Services Components ............................................................................................. 180 
Computable Decision Support Engine ........................................................................... 181 
Supplier Registry ............................................................................................................... 191 
Benefits Package Registry ............................................................................................... 199 
Distinguishing the Benefits Package Registry, Contract & Benefits Management 
System, and Beneficiary Registry ............................................................................... 207 
Health Management Information System ....................................................................... 210 
Public Health Surveillance Platform ............................................................................... 218 
Appendix D: Country and Regional Implementation Examples ................................................. 229 
D.1  Illustrative tools and technologies.............................................................................. 229 
Client Registry ................................................................................................................... 229 
Lifelong Health Record ..................................................................................................... 229 
Computable Decision Support Engine ........................................................................... 230 
Health Management Information Service ....................................................................... 230 
Public Health Surveillance Platform ............................................................................... 230 
Terminology Service and Logical Information Model Repository ............................... 231 
D.2  Country implementation examples ............................................................................. 231 
Australia.............................................................................................................................. 231 
Denmark.............................................................................................................................. 232 
Estonia ................................................................................................................................ 232 
India ..................................................................................................................................... 232 
 
 
5 
Kenya .................................................................................................................................. 232 
Nigeria ................................................................................................................................. 233 
Rwanda ............................................................................................................................... 233 
Spain ................................................................................................................................... 233 
Spain — Catalonia (subnational) ..................................................................................... 233 
Tanzania.............................................................................................................................. 234 
Uganda ................................................................................................................................ 234 
United Kingdom (England) ............................................................................................... 234 
United States ...................................................................................................................... 234 
D.3  Regional and multi-country examples ........................................................................ 234 
European Union and European Economic Area — regional surveillance.................. 234 
WHO SMART Guidelines pilot implementations............................................................ 235 
Appendix E: Health Goals to DPI Mapping ................................................................................ 236 
Appendix F: Semantic Governance Infrastructure: capability details ........................................ 241 
 
 
 
6 
Acronyms 
 
 
AI 
Artificial Intelligence 
DIIG 
Digital Implementation Investment Guide 
DPI 
Digital Public Infrastructure 
DPI-F 
Foundational Digital Public Infrastructure 
DPI-H 
Health Digital Public Infrastructure 
HL7 FHIR® 
Health Level Seven Fast Healthcare Interoperability Resources 
ICD-11 
International Classification of Diseases 11th Revision 
ICVP 
International Certificate of Vaccination or Prophylaxis 
IPS 
International Patient Summary 
LMIC 
Low-and-Middle-Income Country 
LOINC 
Logical Observation Identifiers Names and Codes 
OpenHIE 
Open Health Information Exchange 
REDDHI 
Resilient Essential Data and Digital Health Infrastructure 
SDG 
Sustainable Development Goal 
SMART 
Guidelines 
Standards-based, Machine-readable, Adaptive, Requirements-based, 
Testable Guidelines 
SNOMED CT 
Systematized Nomenclature of Medicine - Clinical Terms 
SNOMED GPS 
Systematized Nomenclature of Medicine – Global Patient Set 
TOGAF 
The Open Group Architecture Framework 
DRAFT V1.0 
 
 
Glossary 
 
Term 
Description 
Application Component 
A deployable, modular piece of software that provides a 
defined set of functionality and holds the data it manages, 
exposing both through services. 
Application Service 
An explicitly defined unit of application behaviour. An 
application service exposes the functionality of an application 
component to its environment. 
Capability 
A high-level ability the health system possesses or needs in 
order to achieve its goals. It expresses what the health system 
is able to do, independently of how that ability is implemented. 
Business Domain 
A specific focus area or subsystem within a broader business 
system, characterized by its own essential attributes [Under 
review] 
Outcome 
An end result or consequence of a set of activities; an outcome 
is often measurable and signals progress towards a goal. 
Product 
A concrete offering, bundling services and data, that is made 
available to stakeholders. 
Business Services layer 
A layer of the reference architecture grouping the health 
capabilities that national health systems strive to deliver across 
their principal domains — clinical care, public health, the health 
supply chain, and health financing — together with the shared 
components that enable them. 
Client 
Members of the public who are potential or current users of 
health services, including health prevention and wellness 
activities.  
Data Governance 
The structures and standards (policies & legal frameworks)  
necessary to coordinate and manage the data journey from 
collection, storage, sharing, analysis to use to produce trusted, 
secure and quality data for decision making 
Data Object 
A defined unit of structured data used or produced by an 
application component. 
Digital Health 
The systematic application of information and communications 
technologies, computer science, and data to support informed 
decision-making by individuals, the health workforce, and 
health systems, to strengthen resilience to disease and 
improve health and wellness. 
 
 
1 
Digital Infrastructure 
Infrastructures in the digital domain are digital resources, such 
as systems and specifications, built as shared means to 
achieve many ends 
Digital Public Infrastructure 
(DPI) 
A set of shared digital systems that should be secure and 
interoperable, and can be built on open standards and 
specifications to deliver and provide equitable access to public 
and/or private services at societal scale and are governed by 
applicable legal frameworks and enabling rules to drive 
development, inclusion, innovation, trust, and competition, 
while respecting human rights and fundamental freedoms. 
(G20/UNDP) 
Enterprise Architecture 
The organising logic for business processes and IT 
infrastructure reflecting the integration and 
standardisation requirements of the organisation's operating 
model. [Under review] 
Fast Healthcare 
Interoperability Resources 
(FHIR) 
FHIR is a standard for healthcare data exchange, published by 
HL7® 
Functional application 
Functional applications are application components that deliver 
a specific operational function within a defined domain. They 
are context-specific, reflecting the operational requirements of 
a programme, scheme, or institution that procures them. 
Goal 
A high-level statement of intent, direction, or desired state for 
an organisation and its stakeholders. 
Health Digital Public 
Infrastructure 
Health Digital Public Infrastructure (DPI-H) refers to digital 
resources that are built as a shared means for fulfilling multiple 
health agency functions. 
Health Information 
Exchange 
[To be included before publication] 
Health Programme 
Health programmes are structured and coordinated 
interventions and services, delivered to defined populations or 
patient groups, to prevent disease, promote health, and 
address specific health needs. 
Integration 
Bespoke capability of connecting one application component to 
another [Under review] 
Interoperability 
Interoperability is the standards-based capability of 
heterogeneous information systems to communicate, 
exchange data, and use the exchanged information to execute 
functions effectively. 
Logical Observation 
LOINC is a common language (a set of identifiers, names, and 
 
 
2 
Identifiers Names and 
Codes  
(LOINC) 
codes) for identifying health measurements, observations, and 
documents. 
Point-of-service applications 
Point-of-service applications are end-user application 
components (IT systems or software tools) used by individuals 
directly engaged in healthcare—such as clinicians, community 
health workers, and patients—that enable interaction with the 
broader healthcare ecosystem. [Under review] 
Reference Architecture 
A technology-neutral blueprint that captures the common 
building blocks, relationships, and design principles of a 
technical environment. 
Registry  
A governed, authoritative and centralized information system 
that captures, stores and maintains the unique attributes and 
identifiers of health facilities, health service users, health 
products and/or the health workforce using a predefined 
canonical minimum data set. [Under review] 
Repository 
 
SMART Guidelines 
 Standards-based, Machine-readable, Adaptive, 
Requirements-based, Testable Guidelines are a 
comprehensive set of reusable digital health components (e.g., 
interoperability standards, code libraries, algorithms, technical 
and operational specifications) that transform the guideline 
adaptation and implementation process to preserve fidelity and 
accelerate uptake. SMART Guidelines provide a five-step 
pathway to advance the adoption of best clinical and data 
practices, even if a country is not yet fully digital. 
SNOMED CT 
Systematized Nomenclature of Medicine Clinical Terms is a 
structured clinical terminology standard for use in electronic 
health records. 
SNOMED GPS 
Systematized Nomenclature of Medicine – Global Patient Set 
is a list of basic clinical terms. It is an open and freely 
accessible subset of SNOMED CT terms that represents the 
breadth of concepts included in the SNOMED CT International 
Edition. 
Solution Architecture 
The design of a specific application component or HDPI 
expressed through specifications and diagrams [Under review] 
Stakeholder 
An individual, role, or organisation with an interest in the 
outcomes of the architecture. 
Value 
The benefit or utility a stakeholder gains from using a service, 
product, or capability. 
 
 
 
Executive Summary 
1 
Countries are unlikely to achieve their health goals through investing in isolated or siloed health 
2 
systems. Instead, they should build shared data and digital capabilities that support multiple 
3 
programmes, multiple diseases and multiple levels of care. 
4 
This Reference Architecture Guidance for Digital Public Infrastructure for Health (DPI-H) sets 
5 
out how countries can build those shared foundations. It is written for the governments, 
6 
development partners and technical stakeholders responsible for planning, financing and 
7 
implementing national digital health infrastructure, and it brings policy intent and technical 
8 
design into a single, coherent frame. DPI-H refers to digital resources built as a shared means 
9 
for fulfilling multiple health agency functions — distinct from the foundational digital public 
10 
infrastructure, such as identity, payments and data exchange, upon which the health sector can 
11 
build. 
12 
There is a need for solid foundations based on common structures and standards, that are 
13 
applicable and adaptable to local contexts, to strengthen data and digital infrastructure and 
14 
architecture. These foundations should promote: 
15 
a) The production of trusted, secure and quality data for decision making,  
16 
b) Interoperability as a cross-cutting property of the architecture, and  
17 
c) The grounding of health digital public infrastructure (DPI-H) in common standards.  
18 
In turn these are essential foundations for ‘AI for health’ and ‘AI-ready data’. 
19 
The Reference Architecture Guidance also recognises the complex state of digital 
20 
implementations across countries and proposes adaptive architecture concepts to suit different 
21 
contexts, and which can be achievable by countries. It recognises resource constraints in low- 
22 
and middle-income countries, that a one-size-fits-all approach is not realistic, and acknowledges 
23 
varying starting points for countries, providing implementation pathways suited to each context. 
24 
The guidance also introduces the concept of Resilient Essential Data and Digital Health 
25 
Infrastructure (REDDHI) — the state that countries are working towards through their digital 
26 
health investments — and describes the minimum set of shared capabilities and application 
27 
components that form the foundation of REDDHI. This provides countries with a practical entry 
28 
point for their DPI-H journey, whatever their current context. 
29 
To connect these foundations to concrete outcomes, the guidance takes an enterprise 
30 
architecture approach, using the established TOGAF® and ArchiMate® methods, anchored on 
31 
seven priority health goals: building trusted data foundations; supporting a capable, well-
32 
distributed health workforce; ensuring quality and continuity of care; establishing trusted 
33 
personal health records; optimising supply chain management; strengthening health financing; 
34 
and building resilience to climate change and epidemics. Each goal is mapped systematically to 
35 
the shared capabilities and application components required to achieve it, so that architectural 
36 
 
 
1 
choices trace back to the health outcomes they serve rather than being made component by 
37 
component. 
38 
It is important to note that the WHO-ITU DHP Handbook, the OpenHIE Architecture and the 
39 
DPI-H Reference Architecture recognise similar foundational components such as metadata 
40 
registries, a terminology services component and interoperability. Accordingly, the guidance 
41 
builds on proven concepts rather than reinventing them, maintaining continuity with established 
42 
approaches. However, the Reference Architecture Guidance introduces additional components 
43 
as DPI-H, reflecting the evolution of technology and learnings from the intervening years. 
44 
The Reference Architecture Guidance also extends the WHO Digital Implementation Investment 
45 
Guide (DIIG) by providing the technical and architectural foundation for implementing a national 
46 
digital health enterprise architecture. The reference architecture specifies the what and how of 
47 
the enterprise architecture itself, addressing the technical questions that arise during 
48 
implementation: which types of systems should countries invest in? How do these systems 
49 
connect and exchange data? What are the dependencies between components? What technical 
50 
specifications ensure interoperability? Countries using the DIIG to plan their digital health 
51 
investments can leverage this reference architecture to ensure their technical implementations 
52 
are coherent, avoid fragmentation, and align with global standards. With both resources, 
53 
countries can move from strategic intent to technical implementation with confidence that their 
54 
architectural choices support long-term health sector goals. 
55 
Figure 1: The Reference Architecture within planning and implementing a digital health 
56 
enterprise 
57 
 
58 
 
59 
 
 
2 
Beyond the architecture itself, the guidance offers practical support for implementation. It 
60 
describes how interoperability is realised as a cross-cutting property of the architecture rather 
61 
than a single component; how a semantic governance infrastructure sustains the shared 
62 
meaning of data over time; and how countries can approach conformance, coverage and 
63 
progress, the roles and skills required, and the financing and partnership arrangements that 
64 
make DPI-H sustainable. A dedicated treatment of emerging technologies positions artificial 
65 
intelligence as a cross-cutting consideration that depends on — and raises the importance of — 
66 
the trusted, well-governed data foundations the architecture establishes. 
67 
This guidance was developed jointly by the World Health Organization and the International 
68 
Telecommunication Union, working with a technical working group drawn from enterprise 
69 
architecture, clinical, health informatics, public health and digital health backgrounds across 
70 
low-, middle- and high-income settings. It applies established enterprise architecture methods 
71 
— TOGAF® and ArchiMate® — and builds on existing frameworks, including the OpenHIE 
72 
Architecture, the WHO-ITU Digital Health Platform Handbook and the WHO Digital 
73 
Implementation Investment Guide. It was refined through successive rounds of drafting and 
74 
expert review and released for public consultation ahead of publication. 
75 
The following highlight the distinct contributions of the DPI-H Reference Architecture Guidance: 
76 
• 
Articulation of DPI-H and their value 
77 
• 
Articulation of DPI-F and DPI-H relationships 
78 
• 
An enterprise architecture approach anchored on seven priority health goals 
79 
• 
Systematic mapping of required capabilities to achieve each health goal 
80 
• 
Articulation of health-specific requirements that foundational DPI would need to satisfy 
81 
• 
Articulation of minimum capabilities for Resilient Essential Data and Digital Health 
82 
Infrastructure (REDDHI) 
83 
• 
Introduction of additional components not previously described as part of a digital 
84 
health architecture — Logical Information Model Repository (LIMR), Computable 
85 
Decision Support Engine, Benefits Package Registry, Public Health Surveillance 
86 
Platform, Supplier Registry 
87 
• 
Reconceptualisation of the shared health record as the Lifelong Health Record, a 
88 
capability-based framing that reflects the person-centred, longitudinal nature of health 
89 
information, without prescribing how countries implement it 
90 
• 
Introduction of a Semantic Governance Infrastructure 
91 
• 
Introduction of SMART Guidelines as a standard for computable clinical and health 
92 
content that connect clinical guidelines to DPI-H 
93 
• 
A structured framework and methodology that countries can adopt and adapt to their 
94 
context to make architecture decisions 
95 
• 
Detailed ArchiMate models to support technical teams’ implementation 
96 
• 
A testable architecture, whose structured, machine-readable elements enable 
97 
conformance to the reference to be verified against published profiles rather than only 
98 
described. 
99 
 
 
3 
Taken together, these contributions give countries a structured framework and a shared 
100 
vocabulary that they can adopt and adapt to their own context — moving from strategic intent to 
101 
coherent, standards-based technical implementation, whatever their starting point.
102 
 
 
4 
How to use this guidance 
Reading paths by audience 
This guidance is written so that no single reader needs to read all of it. The cards below describe what each audience will get most from, and 
roughly how many pages that core path runs to. The matrix that follows shows, section by section, what is essential, useful, or optional for you. 
Find your column and follow it down the table.  
Policy Makers, Health 
Ministries & 
Programme Managers 
Understand the purpose, the 
health sector goals, and the 
decisions you own. 
See how health infrastructure 
connects to your government's 
broader DPI, and which health 
DPIs to invest in to serve multiple 
programmes, disease areas, and 
levels of care. 
 
DPI Authorities 
See how DPI-H fits within wider 
cross-sector DPI, governance, and 
standards. 
Understand how the health sector 
becomes a major user of your 
foundational DPI services, and 
what health-specific requirements 
build on top of your infrastructure. 
 
 
Enterprise Architects & 
Technical Teams 
Work through the full architecture, 
application components, 
requirements, and models. 
Use the TOGAF-based 
methodology, architecture 
patterns, and standards-based 
blueprint to guide coherent design, 
integration, and validation at scale. 
 
Development Partners & 
Donors 
Grasp the value case, country 
adoption, and sustainability 
rationale. 
Find a shared framework to 
coordinate investments, reduce 
duplication, and ensure funded 
solutions are interoperable, 
accountable, and aligned with 
country priorities 
 
Procurement Teams 
Find what to specify and evaluate: 
components, requirements, and 
standards. 
Draw on common specifications 
and conformance requirements 
that support transparent 
procurement, vendor neutrality, 
and informed evaluation of 
solutions. 
 
 
 
Key 
● 
Essential — core reading for this 
audience 
◐ 
Recommended — adds useful 
depth 
○ 
Optional — reference only 
– 
Not intended for this audience 
 
Section 
Policy Makers, 
Ministries & 
Programme Managers 
DPI Authorities 
Enterprise Architects & 
Technical Teams 
Development Partners 
& Donors 
Procurement Teams 
Executive Summary 
● 
● 
◐ 
● 
◐ 
How to Use This Guidance 
● 
● 
● 
● 
● 
 
 
5 
Section 
Policy Makers, 
Ministries & 
Programme Managers 
DPI Authorities 
Enterprise Architects & 
Technical Teams 
Development Partners 
& Donors 
Procurement Teams 
Section 1: Introduction 
1.1 About the DPI-H Guidance 
● 
● 
◐ 
● 
○ 
1.2 Why Health Needs More Than 
Foundational DPI 
● 
● 
● 
◐ 
○ 
1.3 Value of DPI-H 
● 
● 
◐ 
● 
◐ 
1.4 DPI-H Principles 
◐ 
● 
● 
◐ 
◐ 
1.5 The Seven Priority Health Sector Goals 
● 
◐ 
● 
● 
○ 
Section 2: DPI-H Reference Architecture Framework 
2.1 The Reference Architecture Scope 
◐ 
◐ 
● 
○ 
◐ 
2.2 Resilient Essential Data and Digital Health 
Infrastructure (REDDHI) 
● 
● 
● 
◐ 
○ 
2.3 DPI-H Reference Architecture Design 
Principles 
◐ 
● 
● 
◐ 
◐ 
2.4 Methodology: Mapping Health Goals to 
DPI-H 
◐ 
◐ 
● 
◐ 
◐ 
Section 3: The Reference Architecture for DPI-H 
3.1 The Architecture Description Approach 
○ 
◐ 
● 
○ 
○ 
3.2 Reading and Navigating the Reference 
Architecture 
◐ 
◐ 
● 
○ 
◐ 
3.3 The Reference Architecture in Practice 
◐ 
◐ 
● 
○ 
◐ 
3.4 Governance of Architectures and DPI-H 
◐ 
● 
● 
○ 
○ 
 
 
6 
Section 
Policy Makers, 
Ministries & 
Programme Managers 
DPI Authorities 
Enterprise Architects & 
Technical Teams 
Development Partners 
& Donors 
Procurement Teams 
3.5 DPI-H Application Components 
◐ 
◐ 
● 
○ 
● 
3.6 Interoperability Architecture 
○ 
◐ 
● 
– 
◐ 
3.7 Conformance and Testing 
○ 
◐ 
● 
○ 
● 
Section 4: Implementing a National Digital Health Architecture 
4.1 Understanding the Starting Point 
● 
◐ 
● 
◐ 
○ 
4.2 Charting a Path to REDDHI 
● 
◐ 
● 
◐ 
◐ 
4.3 Profiles and Specifications for 
Implementation 
– 
○ 
● 
– 
◐ 
4.4 Measuring Progress and Impact 
● 
◐ 
● 
● 
○ 
4.5 Roles, Skills, and Capacity 
● 
◐ 
◐ 
● 
○ 
4.6 Financing and Partnerships 
● 
◐ 
○ 
● 
◐ 
Section 5: Future-Proofing the Architecture 
5.1 Emerging Technologies and Foundations 
They Depend On 
◐ 
◐ 
● 
◐ 
○ 
5.2 Why Data Foundations Determine What AI 
Can Deliver 
◐ 
◐ 
● 
◐ 
○ 
5.3 Where AI Can Support the Health System 
● 
◐ 
● 
◐ 
○ 
5.4 Readiness, Oversight and Responsible 
Adoption 
● 
● 
● 
◐ 
◐ 
5.5 Keeping Architecture Open and Adaptable 
◐ 
◐ 
● 
◐ 
◐ 
 
 
7 
Section 
Policy Makers, 
Ministries & 
Programme Managers 
DPI Authorities 
Enterprise Architects & 
Technical Teams 
Development Partners 
& Donors 
Procurement Teams 
References & Appendices 
References 
○ 
○ 
◐ 
○ 
◐ 
Appendix A: DPI-H Stakeholders Table 
◐ 
◐ 
◐ 
◐ 
○ 
Appendix B: Health Sector Goals to WHO 
Building Blocks Mapping 
◐ 
○ 
◐ 
◐ 
○ 
Appendix C: DPI-H Application Component 
Descriptions & Functional Requirements 
○ 
◐ 
● 
– 
● 
Appendix D: Country Implementation 
Experiences 
◐ 
◐ 
◐ 
● 
○ 
Appendix E: Health Goals to DPI-H Mapping 
◐ 
◐ 
● 
○ 
◐ 
Appendix F: Semantic Governance 
Infrastructure Capability Details 
– 
◐ 
● 
– 
○ 
 
Key 
● 
Essential — core reading for this 
audience 
◐ 
Recommended — adds useful 
depth 
○ 
Optional — reference only 
– 
Not intended for this audience 
For the component articulations, Health Ministries and Development Partners may be best served by the summary rather than reading every individual component entry. 
 
 
 
 
 
8 
1. 
Introduction 
1 
1.1 About the Reference Architecture for health 
2 
Digital Public Infrastructure (DPI-H) Guidance 
3 
Most countries are no longer starting from nothing: by 2025, 129 countries1 had developed 
4 
national digital health strategies aligned with universal health coverage and the Sustainable 
5 
Development Goals. Yet implementation often remains fragmented, with countries lacking a 
6 
systematic way to move from high-level health goals to coherent infrastructure decisions. 
7 
WHO's Global Strategy on Digital Health 2020-20272 calls on Member States to develop digital 
8 
health architectures using enterprise architecture approaches, but guidance at the level of 
9 
specificity countries need has not, until now, been widely available. This guidance responds to 
10 
that gap. 
11
