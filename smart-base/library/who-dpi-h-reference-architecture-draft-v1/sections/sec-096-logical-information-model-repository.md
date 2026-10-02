---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-096-logical-information-model-repository
section_title: "Logical Information Model Repository"
section_number: null
pages: 183-191
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
2 
DPI-H Foundational Layer  ·  Shared Data Layer  ·  Semantic Governance Infrastructure   
3 
 
4 
ARCHITECTURE 
PLACEMENT 
AND 
RELATIONSHIP 
WITH THE 
TERMINOLOGY 
SERVICE 
The Logical Information Model Repository (LIMR) sits in the shared data layer of the 
DPI-H foundational infrastructure, alongside the Terminology Service (TS) and the 
Core Registries for Health. The LIMR is a DPI-H-specific component with no direct 
equivalent in the OpenHIE architecture specification, though it is anchored in 
internationally recognised standards including HL7 FHIR StructureDefinitions, 
openEHR archetypes, and WHO SMART Guidelines data dictionaries. Together 
with the TS, the LIMR constitutes the semantic governance infrastructure of the DPI-
H ecosystem: the TS manages the meaning of coded values; the LIMR manages 
the structure within which those values appear. The LIMR is not a prerequisite for 
the minimum REDDHI components — countries can implement the foundational 
shared data layer, including the core registries and the Lifelong Health Record 
without an explicit LIMR — but it becomes increasingly essential as the health 
ecosystem matures and cross-sector interoperability requirements become more 
demanding. Countries should approach the LIMR as a progressive enabler, not an 
immediate prerequisite. 
 
5 
1  WHAT IT IS 
 
6 
The Logical Information Model Repository is a governed, publicly accessible repository and management 
7 
platform for computable clinical and administrative information models that define the logical structure, 
8 
semantics, and constraints of health data, independently of any specific technology implementation. These 
9 
models serve as the canonical, shared definitions of how health concepts are structured — what a blood 
10 
pressure measurement contains, what fields a medication order has, how a referral request is organised — 
11 
that all actors in the health ecosystem use to produce, exchange, and consume interoperable data. 
12 
The LIMR provides the structural layer of the semantic governance infrastructure, complementing the 
13 
meaning layer provided by the Terminology Service. Where the TS answers the question 'what does this 
14 
code mean?', the LIMR answers the question 'what fields does this data object contain, which are 
15 
mandatory, what are their data types, and which terminology value sets bind to them?' A data element's 
16 
cardinality, optionality, and relationships to other elements are properties of the LIMR; the permitted values 
17 
within that element — and what those values mean — are properties of the TS. Neither is sufficient without 
18 
the other. 
19 
Even where a LIMR does not exist explicitly, logical information models are always implicitly present: every 
20 
system that stores and exchanges health data embeds assumptions about structure in its database 
21 
schemas, API definitions, and data entry forms. Without a governed LIMR, those implicit models diverge 
22 
over time as different systems make different structural choices for the same clinical concepts. The 
23 
consequence is semantic fragmentation at the structural level — systems can exchange data syntactically 
24 
but interpret it differently because their underlying structural assumptions differ. The LIMR makes the 
25 
implicit explicit, subjecting it to clinical governance and making it a shared public asset rather than an 
26 
embedded private assumption of each individual system. 
27 
The LIMR can also serve as the home for computable clinical guidelines developed in accordance with the 
28 
WHO SMART Guidelines framework. The Computable Guideline Repository — the artefact repository for 
29 
SMART Guidelines L3 computable content — can be incorporated into the LIMR rather than defined 
30 
separately. This consolidation enables integrated governance and versioning of both structural information 
31 
models and the computable guidelines that build on them. 
32 
 
 
173 
 
33 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
34 
Health data interoperability ultimately depends not just on transport standards or API specifications, but on 
35 
shared agreement about what the data means and how it is structured. Syntactic interoperability — the 
36 
ability to exchange data between systems in a common format — is necessary but not sufficient. Two 
37 
systems can exchange a message in HL7 FHIR and still fail to interoperate meaningfully if they have defined 
38 
the blood pressure measurement, medication order, or patient demographic record differently. Semantic 
39 
interoperability at the structural level — agreement about which fields exist, what they contain, and how 
40 
they relate — is what enables data from different systems to be aggregated, compared, and acted on with 
41 
confidence. 
42 
Without a curated, governed repository of logical models, each system defines its own interpretation of 
43 
clinical concepts, and those interpretations proliferate and diverge over time. A canonical example is the 
44 
handling of administrative gender and social gender: without a shared logical model definition specifying 
45 
how these two attributes relate and which value sets bind to each, different systems handle the distinction 
46 
differently, making reliable cross-system analysis of gender-related health data significantly harder to 
47 
achieve, regardless of whether both systems use FHIR or the same coding system. The LIMR is the 
48 
infrastructure that establishes the shared structural agreement before systems are built, rather than 
49 
attempting to reconcile differences after the fact. 
50 
The LIMR also reduces duplicated modelling effort. When a national health authority publishes a governed 
51 
logical model for a blood pressure observation, every system that needs to capture blood pressure data 
52 
can implement against that model rather than independently defining the same concept, reducing variation 
53 
in data capture across care settings and compounding the value of the initial modelling investment. 
54 
When logical models are governed independently of software implementations, clinical and public health 
55 
domain experts can update data definitions as evidence and priorities evolve, without depending on 
56 
software vendors to make those changes. This enables health systems to respond to emerging needs – 
57 
whether a new disease, a revised clinical guideline, or a change in reporting requirements – more 
58 
effectively. 
59 
Experience from countries that have attempted to build semantic interoperability infrastructure without this 
60 
foundation shows that defining standards and exposing APIs is not sufficient for adoption. Even technical 
61 
implementers struggle to understand, integrate, and use metadata effectively if the structural definitions 
62 
they need to implement against are not clear, accessible, and well-governed. The LIMR addresses this by 
63 
making structural definitions discoverable, computable, and governable as public goods rather than 
64 
embedded in proprietary implementations. 
65 
 
66 
3  CORE  ATTRIBUTES 
 
67 
– Model authoring and lifecycle management. Support for creating, versioning, reviewing, 
68 
approving, deprecating, and retiring logical information models through defined governance 
69 
workflows involving both clinical and technical stakeholders, with full version history, lifecycle 
70 
states (draft, active, deprecated, retired), and traceability of changes over time. 
71 
– Data element governance. Maintenance of a canonical registry of data elements — including their 
72 
names, definitions, data types, cardinalities, relationships, and bindings to terminology codes or 
73 
value sets managed by the TS — as a shared national asset that all systems implementing against 
74 
the logical model can rely on as authoritative. 
75 
– Semantic binding to terminologies. Mechanisms to bind model elements to international 
76 
terminologies and value sets managed by the Terminology Service, establishing the value set 
77 
binding declarations that define which terminology codes are permitted in a given field. 
78 
Management of the dependency relationship with the TS, including impact assessment when TS 
79 
value sets change. 
80 
 
 
174 
– Multi-formalism support. Ability to host and relate models expressed in different but 
81 
complementary formalisms — including HL7 FHIR StructureDefinitions and Implementation 
82 
Guides, openEHR archetypes and templates and WHO SMART Guidelines data dictionaries — 
83 
supporting the reality that most health ecosystems operate with multiple standards and that a 
84 
national LIMR should bridge between them rather than mandate one. 
85 
– Computable guideline repository. Storage, versioning, and publication of computable clinical 
86 
guidelines and decision support artefacts developed in accordance with the WHO SMART 
87 
Guidelines L3 content, integrated with the logical model management capability to enable coherent 
88 
governance of both structural models and the clinical knowledge that builds on them. 
89 
– Discovery and search. A publicly accessible interface enabling implementers, clinicians, and 
90 
policymakers to find, browse, and understand existing models before building or procuring 
91 
systems, reducing duplicated modelling effort and enabling reuse of nationally governed 
92 
definitions. 
93 
– Dependency and impact tracking. Recording of relationships and dependencies between 
94 
models — including profiles extending base resources, logical models referencing value sets, and 
95 
guidelines building on structural definitions — with support for impact analysis when a model or 
96 
data element is proposed for change, enabling coordinated change management across the 
97 
dependency graph. 
98 
– Computable export and artefact generation. Generation of implementation-ready artefacts from 
99 
logical models — including FHIR profiles, validation schemas, API specifications, and form 
100 
definitions — bridging the gap between logical design and technical deployment, and enabling 
101 
consuming systems to automatically derive their technical implementation specifications from the 
102 
national logical models. 
103 
– Federation and alignment with international repositories. Synchronisation with or referencing 
104 
of models from international clinical knowledge repositories — including for example the HL7 FHIR 
105 
registry, the openEHR Clinical Knowledge Manager, and the WHO SMART Guidelines — enabling 
106 
local adaptation of globally curated models and the submission of national models and extensions 
107 
back to global repositories. 
108 
 
109 
4  HOW IT CONNECTS 
 
110 
The LIMR's position in the DPI-H architecture is primarily as a design-time reference asset rather than an 
111 
operational runtime service, though it is consulted at runtime for data validation and by the CDSE for 
112 
decision logic evaluation. Its relationships define the semantic governance infrastructure of the ecosystem. 
113 
The Terminology Service is the LIMR's most critical peer. The LIMR declares which value sets bind to which 
114 
model elements; the TS holds and makes those value sets available to consuming systems. This 
115 
dependency is bidirectional: the LIMR depends on the TS to resolve value set bindings at design time and 
116 
runtime, and changes in the TS — particularly deprecation or restructuring of value sets — affect the logical 
117 
models in the LIMR that reference them. Both components must be coordinated through a joint governance 
118 
process that manages the propagation of changes across this dependency boundary. Changes in the TS 
119 
should trigger impact analysis in the LIMR; changes in the LIMR should be communicated to the TS for any 
120 
corresponding terminology implications. 
121 
The Lifelong Health Record and the health information exchange infrastructure implement and validate their 
122 
data storage and exchange structures against the logical models published in the LIMR. The LIMR provides 
123 
the structural schema that defines how clinical data objects are organised, ensuring that data contributed 
124 
from heterogeneous systems conforms to a shared structure rather than to each system's private 
125 
interpretation of the same clinical concept. The Client Registry schema — the logical model defining which 
126 
demographic attributes the Client Registry holds, their cardinalities, and their terminology bindings — is one 
127 
example of a LIMR artefact that the Client Registry implements. 
128 
The Computable Decision Support Engine consumes the LIMR as both a validation reference and a 
129 
computable knowledge source. The CDSE validates the clinical context data it retrieves from the LHR 
130 
 
 
175 
against the structural definitions in the LIMR before evaluating decision logic against it. The computable 
131 
guidelines held in the LIMR provide the logic artefacts — PlanDefinitions, ActivityDefinitions, Libraries, CQL 
132 
expressions — that the CDSE evaluates at the point of care. Changes to computable guidelines in the LIMR 
133 
must be coordinated with the CDSE's knowledge management processes to ensure clinical safety. 
134 
All other DPI-H components that define structured data — the registries, the HMIS, the PHSP — reference 
135 
the LIMR for their data element definitions. The LIMR's canonical registry of data elements is what enables 
136 
the reference architecture to specify data requirements in a way that is structurally consistent across 
137 
components. Without a LIMR, each component's data requirements exist in isolation; with a LIMR, they are 
138 
part of a governed, coherent national health data model. 
139 
 
140 
5  FUNCTIONAL REQUIREMENTS 
 
141 
There is no direct equivalent of the LIMR in the OpenHIE architecture specification. Requirements draw on 
142 
internationally recognised standards and frameworks including HL7 FHIR Clinical Reasoning and 
143 
Terminology modules, openEHR formalism specifications, and the WHO SMART Guidelines L3 framework. 
144 
Interaction models and service definitions for LIMR-equivalent capabilities remain an area where standards 
145 
gaps exist and the reference architecture identifies this as a gap to be addressed through future 
146 
standardisation work. 
147 
 
148 
# 
Business process 
Functional requirement 
Status 
MODEL STORAGE AND LIFECYCLE MANAGEMENT 
1 
Model governance 
Model storage and versioning.  The LIMR shall store 
logical information models with full version history, 
supporting concurrent versions, lifecycle states (draft, 
active, deprecated, retired), and traceability of all 
changes over time, including the actor, timestamp, and 
reason for each change. 
Required 
2 
Model governance 
Standards alignment.  The LIMR shall support the 
representation of models conforming to recognised health 
data standards, including but not limited to HL7 FHIR 
StructureDefinitions 
and 
Implementation 
Guides, 
openEHR archetypes and templates, and WHO SMART 
Guidelines data dictionaries, supporting the coexistence 
of multiple formalisms within a single governed 
repository. 
Required 
3 
Model governance 
Computable guideline storage.  The LIMR shall support 
the storage, versioning, and publication of computable 
clinical guidelines and decision support artefacts — 
including WHO SMART Guidelines L3 content expressed 
as PlanDefinitions, ActivityDefinitions, Libraries, and CQL 
expressions — integrated within the same lifecycle 
management and governance framework as structural 
logical models. 
Required 
DATA ELEMENT GOVERNANCE 
4 
Semantic 
governance 
Canonical data element registry.  The LIMR shall 
maintain a canonical registry of data elements, including 
their names, definitions, data types, cardinalities, and 
bindings to terminology codes or value sets managed by 
Required 
 
 
176 
# 
Business process 
Functional requirement 
Status 
the Terminology Service, as a nationally governed 
reference that consuming systems can implement against 
with confidence in the authority and stability of the 
definitions. 
5 
Semantic 
governance 
Value set binding declaration.  The LIMR shall support 
the declaration of value set bindings for coded data 
elements — specifying which value set in the 
Terminology Service governs the permitted values for a 
given element — and shall maintain these bindings with 
version specificity, enabling consuming systems to know 
both which value set applies and which version of that 
value set was in effect at any given time. 
Required 
6 
Semantic 
governance 
Dependency and impact tracking.  The LIMR shall 
record relationships and dependencies between models 
— including profiles extending base resources, models 
referencing value sets, and guidelines building on 
structural definitions — and shall support impact analysis 
when a model, data element, or value set binding is 
proposed for change, enabling the governance process 
to assess the downstream consequences before a 
change is approved. 
Required 
7 
Semantic 
governance 
TS change notification handling.  The LIMR shall 
subscribe to change notifications from the Terminology 
Service and shall initiate impact analysis workflows when 
value sets or code systems that are referenced by LIMR 
models are updated, deprecated, or retired, ensuring that 
affected 
models 
are 
reviewed 
and 
updated 
in 
coordination with terminology changes. 
Required 
DISCOVERY AND ACCESS 
8 
Implementation 
support 
Discovery and search.  The LIMR shall expose publicly 
accessible search and browsing capabilities that allow 
users and consuming systems to locate models, data 
elements, and definitions by name, domain, version, 
status, or associated standard, enabling reuse of 
nationally governed definitions and reducing duplicated 
modelling effort. 
Required 
9 
Implementation 
support 
Programmatic access.  The LIMR shall provide 
machine-readable APIs — including where applicable 
FHIR-conformant 
endpoints 
for 
StructureDefinition, 
ImplementationGuide, 
Library, 
PlanDefinition, 
and 
related resources — so that application components can 
retrieve published models at design time and validate 
data instances against them at runtime. 
Required 
10 Implementation 
support 
Conformance and validation support.  The LIMR 
should enable consuming systems to validate data 
instances against published models, either through 
downloadable validation artefacts or through an exposed 
validation service endpoint, supporting the shift from 
Recommended 
 
 
177 
# 
Business process 
Functional requirement 
Status 
model-based specification to model-driven validation 
across the ecosystem. 
11 Implementation 
support 
Computable artefact generation.  The LIMR should 
support the generation of implementation-ready artefacts 
from logical models — including FHIR profiles, validation 
schemas, and API specifications — enabling consuming 
systems to derive their technical implementation 
specifications automatically from nationally governed 
logical models. 
Recommended 
MAPPING AND FEDERATION 
12 Interoperability 
Mapping and crosswalk management.  The LIMR shall 
support the storage and publication of mappings between 
different information models — including between local 
and international model definitions, between models 
expressed in different formalisms, and between national 
models and international standards — facilitating data 
transformation and interoperability across systems that 
use different structural conventions. 
Required 
13 International 
alignment 
Federation with international repositories.  The LIMR 
should support synchronisation with or referencing of 
models from international clinical knowledge repositories 
— including the openEHR Clinical Knowledge Manager 
and HL7 FHIR registries — enabling local adaptation of 
globally curated models and the submission of national 
models back to global repositories for broader review and 
adoption. 
Recommended 
GOVERNANCE AND ACCESS CONTROL 
14 Model governance 
Access control and governance workflow.  The LIMR 
shall enforce role-based access to create, review, 
approve, 
publish, 
deprecate, 
and 
retire 
models, 
supporting a defined governance workflow that requires 
models to be reviewed by authorised stewards with both 
clinical and technical expertise before activation, and that 
ensures clinical governance is not subordinated to 
technical expediency. 
Required 
15 Model governance 
Notification and subscription.  The LIMR shall provide 
a mechanism for subscribing systems and users to be 
notified when models, data elements, or guidelines they 
depend on are updated, deprecated, or retired, enabling 
dependent systems and the CDSE to initiate timely 
impact analysis and updates. 
Required 
CROSS-CUTTING 
16 Governance · Audit 
Audit 
logging. 
 
The 
LIMR 
shall 
maintain 
a 
comprehensive audit log of all authoring actions, review 
and 
approval 
decisions, 
publication 
events, 
and 
configuration changes, recording the actor, the action, the 
affected artefact and version, and the timestamp, 
Required 
 
 
178 
# 
Business process 
Functional requirement 
Status 
ensuring full traceability of the governance process for 
each model throughout its lifecycle. 
17 Performance · 
Availability 
Availability and performance.  The LIMR shall be 
available to consuming systems for design-time model 
retrieval and runtime validation with sufficient reliability 
and performance to support its use as a shared reference 
asset across the health ecosystem, accepting that 
design-time access will typically be less latency-sensitive 
than the runtime terminology operations served by the 
TS. 
Required 
 
149 
Note: There is no direct equivalent of the LIMR in the OpenHIE architecture specification. The component 
150 
was introduced to the DPI-H reference architecture as a relevant DPI-H component. Requirements draw 
151 
on: HL7 FHIR R5/R6 StructureDefinition, ImplementationGuide, Library, PlanDefinition, and related 
152 
Clinical Reasoning resources; openEHR archetype and template specifications; and the WHO SMART 
153 
Guidelines L3 framework (https://www.who.int/teams/digital-health-and-innovation/smart-guidelines). The 
154 
DPI-H Reference Architecture TWG noted that standard interaction models for LIMR-equivalent 
155 
capabilities remain an active area of standards development, and the Reference Architecture should 
156 
identify this as a gap to be addressed through future standardisation work.  
157 
 
 
179 
GOVERNANCE 
Governance of the LIMR follows the cross-cutting governance framework in Section 
3.4 of the guidance document. Component-specific considerations include:  
(1) Institutional ownership. Stewardship should be vested in a national health authority 
or delegated standards body with a mandate spanning all health domains, not in a 
single vendor, project, or clinical programme. The LIMR is shared infrastructure for 
the whole health system.  
(2) Clinical and technical co-governance. Logical model governance requires active 
participation of clinical domain experts — clinicians, public health professionals, 
pharmacists, and patient representatives — not only informaticians. The clinical 
authority to determine how a clinical concept should be structured is distinct from the 
technical authority to implement that structure; both are needed. Models should be 
reviewed by clinical stewards for clinical validity and by technical stewards for 
structural quality and consistency before publication.  
(3) Content lifecycle and backwards compatibility. A clear model lifecycle — draft, 
review, approved, published, deprecated, retired — with explicit policies on 
backwards compatibility is essential. Countries should define the minimum lead time 
before a published model can be deprecated, the conditions under which a breaking 
change may be made, and the obligations of the LIMR to notify dependent systems 
of impending changes.  
(4) Openness and transparency. Models developed under national governance 
should be published under open licences wherever possible, to maximise adoption 
and avoid vendor lock-in. The investment made in national logical models should 
benefit the whole health system, not be a proprietary asset of the organisation or tool 
that was used to author them.  
(5) Relationship with Semantic Governance Infrastructure. The LIMR is one element 
of the broader semantic governance infrastructure that also includes the TS. 
Governance of the two components should be coordinated, with particular attention 
to the dependency boundary between model structure and terminology content, and 
to the change management processes that cross that boundary.  
(6) Relationship with WHO SMART Guidelines. Countries adopting WHO SMART 
Guidelines computable content should engage with WHO governance processes for 
that content, contributing national implementation experience and adaptation 
requirements back to the global process, ensuring that the LIMR's computable 
guideline holdings remain aligned with international developments rather than 
diverging through unilateral national modification.  
(7) Maturity and progressive adoption. Countries at earlier stages of digital health 
maturity should not feel that a fully operational LIMR is a prerequisite for adopting 
other DPI-H components. The LIMR can be developed progressively, starting with the 
most critical data element definitions and expanding coverage as the ecosystem 
matures. The Reference Architecture presents the LIMR as a progressive enabler with 
a maturity pathway, rather than a binary requirement. 
 
158 
 
 
180 
DPI-H Application Component Descriptions
