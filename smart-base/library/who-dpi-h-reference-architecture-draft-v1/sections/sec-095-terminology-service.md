---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-095-terminology-service
section_title: "Terminology Service"
section_number: null
pages: 175-183
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
WITH THE LIMR 
The Terminology Service (TS) sits in the shared data layer of the DPI-H foundational 
infrastructure, alongside the Logical Information Model Repository (LIMR), the Core 
Registries for Health and the Lifelong Health Record. It is a cross-cutting component: 
virtually every DPI-H component and every point-of-care system that exchanges 
health data depends on the TS for the consistent meaning of the coded values it 
uses. Together, the TS and the LIMR constitute the semantic governance 
infrastructure of the DPI-H ecosystem. The TS manages meaning — what coded 
concepts represent, how they relate to each other, and what values are permitted in 
a given field. The LIMR manages structure — what fields exist, what data types they 
hold, what cardinalities apply, and which value sets from the TS bind to them. 
Neither is sufficient without the other. For example, the TS does not know about 
cardinality or field optionality and the LIMR does not know what a code means. Both 
depend on the other, and changes in either component can affect the other — a 
relationship that requires coordinated governance. 
 
5 
1  WHAT IT IS 
 
6 
The Terminology Service is a governed, publicly accessible service that manages, publishes, and provides 
7 
access to the standardised terminologies, code systems, value sets, and concept maps used across the 
8 
digital health ecosystem. It hosts both internationally recognised terminologies — such as ICD-11, 
9 
SNOMED CT (and SNOMED GPS), LOINC, International Classification of Primary Care (ICPC), Anatomical 
10 
Therapeutic Chemical (ATC), and International Classification of Functioning, Disability and Health (ICF) — 
11 
and nationally or locally defined code systems and value sets, exposing them through standards-based 
12 
APIs that enable consuming systems to validate codes, expand value sets, look up concept properties, and 
13 
translate between code systems. It provides the meaning layer of the digital health ecosystem, 
14 
complementing the structural definitions held in the LIMR. 
15 
An important distinction in the DPI-H context is the difference between a Terminology Service deployed at 
16 
facility or programme level — which provides operational terminology capabilities for local use — and the 
17 
national Terminology Service, which functions as semantic governance infrastructure for the whole country. 
18 
The national TS is not just a technical service; it is the authoritative institutional source for what coded 
19 
concepts mean across the health system, managing the lifecycle of terminologies from international 
20 
adoption through national extension to local use, and governing the change processes that ensure updates 
21 
are made consistently and transparently. This governance function is what distinguishes the national TS 
22 
from a locally deployed terminology tool, and it is the capability the DPI-H reference architecture is 
23 
describing when it specifies the TS as a foundational component. 
24 
The TS is not limited to widely used clinical terminologies. It equally serves the need for locally defined 
25 
code systems — including local laboratory codes, national drug codes, local procedure classifications, and 
26 
programme-specific indicator codes — where no international standard yet covers the relevant clinical or 
27 
administrative domain. Supporting local and national code systems, and governing the relationships 
28 
between local codes and their international equivalents through concept maps, is as important a function 
29 
of the national TS as managing internationally adopted terminologies. 
30 
 
31 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
 
165 
 
32 
Health data exchange is only meaningful if the parties exchanging data share a common understanding of 
33 
what each coded value represents. Without a centrally governed source of terminologies and value sets, 
34 
every digital system tends to maintain its own local code lists. Digital systems accumulate local copies of 
35 
code systems that diverge over time as updates are applied inconsistently; the same clinical concept 
36 
receives different codes in different facilities; and aggregate data cannot be reliably compared across 
37 
programmes, facilities, or time periods. The consequence is health information that is syntactically 
38 
exchangeable but semantically incomparable — a health system that can move data between systems but 
39 
cannot reliably understand what it means once it arrives. 
40 
The incentives that produce this problem are strong. Individual systems have limited visibility of or interest 
41 
in how their local code choices affect other systems' ability to interpret the same data. Without a shared 
42 
infrastructure that makes the semantic consistent coding available as a service, the path of least resistance 
43 
is to define codes locally and map to standards only when forced to by specific exchange requirements. A 
44 
national Terminology Service makes the consistent choice the easy choice: consuming systems query the 
45 
TS rather than maintaining their own code lists, and the meaning of coded values is determined once, 
46 
centrally, rather than being independently interpreted by each consuming system. 
47 
The governance dimension is equally important. International terminology standards — SNOMED CT/GPS, 
48 
ICD-11, LOINC — are updated regularly. National extensions to those standards, and national value sets 
49 
built on them, require expert clinical and informatics review before changes are adopted. Without 
50 
governance infrastructure, changes to international standards propagate unevenly into national 
51 
implementations, creating a patchwork of systems running different versions of the same terminology and 
52 
unable to reliably compare data across the versions. The TS is the institutional mechanism through which 
53 
this change is managed, reviewed, versioned and disseminated in a controlled and traceable way. 
54 
When a governed Terminology Service is in place, there are potential cumulative effects on health 
55 
outcomes: 
56 
• 
Clinicians and health systems can act on data that means the same thing across facilities, 
57 
programmes, and borders — improving the reliability of clinical decisions, the accuracy of disease 
58 
surveillance, and the integrity of the population-level information that guides resource allocation 
59 
and health policy.  
60 
• 
Digital systems no longer need to maintain their own local copies of code systems and value sets, 
61 
reducing duplicated effort and the risk of divergence that undermines data comparability over time. 
62 
• 
Compliance with licensing obligations for proprietary terminologies (such as SNOMED CT) is 
63 
achieved through a single managed point of access rather than uncontrolled local copies, lowering 
64 
the barrier to adoption of international standards and improving the quality and consistency of 
65 
coded clinical data across the ecosystem. 
66 
 
67 
3  CORE ATTRIBUTES 
 
68 
– Code system management. Storage and lifecycle management of code systems — including 
69 
their concepts, designations, properties, hierarchical relationships, and versions — covering both 
70 
internationally recognised terminologies and locally or nationally defined code systems. Local 
71 
modifications of international terminologies, national extensions of SNOMED CT/GPS or ICD, and 
72 
locally defined procedure or product codes are as important a scope of management as the 
73 
international standards themselves. 
74 
– Value set management. Definition, storage, and publication of value sets using both intensional 
75 
(rule-based selection of concepts from a code system) and extensional (explicitly enumerated list 
76 
of codes) definitions, with full versioning and lifecycle states, enabling consuming systems to 
77 
retrieve the exact set of permitted values for a given data element at any given point in time. 
78 
– Concept map management. Definition and publication of mappings between concepts in different 
79 
code systems — establishing equivalence, broader-than, narrower-than, and related-to 
80 
 
 
166 
relationships — enabling translation between terminologies and crosswalk between local and 
81 
international coding schemes. 
82 
– Standards-based runtime terminology services. Exposure of operations conformant to 
83 
recognised terminology service specifications — including code validation, value set expansion, 
84 
concept lookup, subsumption testing, and code translation — through machine-readable APIs, 
85 
supporting both design-time configuration and runtime clinical and administrative transactions. 
86 
– Multilingual support. Management of language-specific designations and translations for 
87 
concepts, enabling consuming systems to display terms in the language appropriate to users and 
88 
patients across the country, and supporting the addition of national language translations to 
89 
internationally defined code systems. 
90 
– Governance workflow and access control. Role-based access supporting editorial workflows — 
91 
drafting, peer review, clinical validation, technical quality assurance, publication, and retirement — 
92 
with full audit trails and provenance tracking, ensuring that terminology content is reviewed by 
93 
authorised stewards with clinical and domain expertise before publication. 
94 
– Licensing management. Enforcement of licensing terms and access restrictions associated with 
95 
proprietary terminologies, ensuring that consuming systems and users access content in 
96 
compliance with applicable licence conditions, and providing a single managed point of access that 
97 
satisfies licence compliance obligations rather than requiring each consuming system to hold its 
98 
own licence. 
99 
– Federation and alignment with international sources. Synchronisation with or referencing of 
100 
content published by international terminology authorities — including SNOMED International, 
101 
WHO-FIC, and Regenstrief — enabling national extensions of globally curated content and 
102 
establishing feedback mechanisms through which local change requests are submitted to global 
103 
standards development organisations. 
104 
 
105 
4  HOW IT CONNECTS 
 
106 
The Terminology Service has a dependency relationship with virtually every component in the DPI-H 
107 
ecosystem that stores, exchanges, or analyses coded health data. It is the semantic anchor that gives 
108 
meaning to the codes used across the ecosystem, and its availability and reliability are prerequisites for the 
109 
meaningful operation of all components that depend on it. 
110 
The relationship with the Logical Information Model Repository is the most architecturally significant 
111 
connection. The LIMR defines the structure of health data objects — what fields exist, what their 
112 
cardinalities are, what data types they use. The TS defines the meaning of the coded values that populate 
113 
those fields. Value set bindings declared in LIMR models reference value sets held in the TS, creating a 
114 
bidirectional dependency: the LIMR depends on the TS to hold and serve the value sets it binds to, and 
115 
changes in the TS — particularly the deprecation or restructuring of value sets — can affect the logical 
116 
models in the LIMR that bind to them. This dependency must be managed through coordinated governance 
117 
rather than unilateral update by either component. 
118 
The Lifelong Health Record and the health information exchange infrastructure depend on the TS to 
119 
ensure that clinical data contributed from heterogeneous source systems carries consistent meaning when 
120 
stored and exchanged. A coded diagnosis contributed by one system should mean the same thing when 
121 
retrieved by another, and the TS is the authoritative reference that mediates this consistency.  
122 
The Computable Decision Support Engine resolves clinical concepts referenced in its decision logic 
123 
against the TS, ensuring that rules operate on correctly coded data regardless of which source system 
124 
contributed it. Changes in the TS — including the deprecation of codes used in clinical rules — should 
125 
trigger impact analysis in the CDSE to ensure decision logic remains valid. 
126 
The HMIS, the PHSP, and all analytical and reporting functions depend on the TS for semantic 
127 
comparability of data drawn from multiple source systems. Aggregate indicators, case classifications, and 
128 
cross-programme analyses are only reliable if the underlying data uses consistent codes; the TS is the 
129 
infrastructure that makes that consistency achievable.  
130 
 
 
167 
The Product Registry uses the TS for product classification codes and all other Core Registries for Health 
131 
use the TS for the controlled vocabularies governing coded attributes in their minimum datasets. 
132 
 
133 
5  FUNCTIONAL REQUIREMENTS 
 
134 
Requirements are grouped by business process and draw on the OpenHIE Terminology Service 
135 
specification (TSWF-1 to TSWF-8; TSF-1 to TSF-13) and the IHE Infrastructure Technical Framework 
136 
Supplement on Sharing Value Sets, Codes, and Maps (SVCM). The DPI-H reference architecture extends 
137 
OpenHIE in the following principal respects: versioning of code systems and value sets is elevated from 
138 
Recommendation to Required; governance workflow is made an explicit requirement; licensing 
139 
management, multilingual support, search and discovery, subscription and notification, and LIMR 
140 
integration are added; and standards neutrality is maintained — FHIR is referenced as the recommended 
141 
but not the only conformant implementation path. 
142 
 
143 
# 
Business process 
Functional requirement 
Status 
CODE SYSTEM MANAGEMENT 
1 
Code system 
management · 
TSF-1 
Code system import.  The TS shall support the import of 
code systems, including both locally defined systems and 
internationally recognised standard terminologies, in 
formats ranging from structured text to FHIR CodeSystem 
resources in XML or JSON. Import should cover not only 
commonly used terminologies but also those requiring 
more flexibility, including local modifications of ICD and 
SNOMED CT, local procedure codes, and national drug 
classification codes. (TSF-1 — Required) 
Required 
2 
Code system 
management · 
TSF-2 
Code system export.  The TS shall support the export of 
code systems, including both locally defined systems and 
standard international terminologies, in formats ranging 
from structured text to FHIR CodeSystem resources in 
XML or JSON. (TSF-2 — Required) 
Required 
3 
Code system 
management · 
TSF-3 
Code system versioning.  The TS shall maintain full 
version history of code systems, supporting concurrent 
active versions, defined lifecycle states (draft, active, 
deprecated, retired), and consumer-specified version 
requests. Note: DPI-H elevates this to Required where 
OpenHIE treats it as a Recommendation; versioning is 
essential for a governance-grade national terminology 
service to honour backwards compatibility obligations. 
(TSF-3 — elevated to Required) 
Required 
VALUE SET MANAGEMENT 
4 
Value set 
management · 
TSF-5 
Value set definition import.  The TS shall support the 
import of value set definitions, including both intensional 
(rule-based) and extensional (enumerated) definitions. 
Import formats may range from a structured text list of 
codes to a FHIR ValueSet resource in XML or JSON. The 
format 
requirements 
should 
be 
standards-neutral; 
countries not using FHIR should be able to import value 
Required 
 
 
168 
# 
Business process 
Functional requirement 
Status 
set definitions in other standard formats. (TSF-5 — 
Required) 
5 
Value set 
management · 
TSF-6 
Value set definition export.  The TS shall support the 
export of value set definitions in formats ranging from 
structured text to FHIR ValueSet resources in XML or 
JSON. (TSF-6 — Required) 
Required 
6 
Value set 
management · 
TSF-7 
Value set expansion import.  The TS shall support the 
import of value set expansions — the enumerated set of 
codes a value set contains at a given point in time — in 
formats ranging from a simple code list to a FHIR 
ValueSet resource in XML or JSON. (TSF-7 — Required) 
Required 
7 
Value set 
management · 
TSF-8 
Value set expansion export.  The TS shall support the 
export of value set expansions in formats ranging from a 
simple code list to a FHIR ValueSet resource in XML or 
JSON. (TSF-8 — Required) 
Required 
8 
Value set 
management · 
TSF-4 
Value set versioning.  The TS shall maintain full version 
history of value sets, supporting concurrent active 
versions, defined lifecycle states, and consumer-specified 
version requests. Note: elevated to Required from 
OpenHIE Recommendation, for the same reasons as 
code system versioning. (TSF-4 — elevated to Required) 
Required 
CONCEPT MAP MANAGEMENT 
9 
Concept map 
management · 
TSF-9 
Concept map import.  The TS shall support the import 
of concept maps defining relationships between codes 
across different code systems, in formats ranging from a 
structured source-target code list to a FHIR ConceptMap 
resource in XML or JSON. (TSF-9 — Required) 
Required 
10 Concept map 
management · 
TSF-10 
Concept map export.  The TS shall support the export of 
concept maps in formats ranging from a structured 
source-target code list to a FHIR ConceptMap resource in 
XML or JSON. (TSF-10 — Required) 
Required 
RUNTIME TERMINOLOGY SERVICES 
11 Clinical data 
validation · TSF-12 
· TSWF-1 
Code validation.  The TS shall validate codes submitted 
by consuming systems, confirming whether a given code 
exists in a specified code system or value set and 
returning the validation result with relevant concept 
details. Consuming systems should be able to specify the 
code system version for version-specific validation. (TSF-
12; TSWF-1 Verify Code Existence; TSWF-2 Verify Code 
Membership — Required) 
Required 
12 Clinical data access 
· TSF-11 · TSWF-7 
Concept lookup and properties.  The TS shall support 
the retrieval of concept details — including preferred 
terms, 
synonyms, 
definitions, 
language-specific 
designations, properties, and hierarchical relationships — 
in response to lookup requests from consuming systems, 
Required 
 
 
169 
# 
Business process 
Functional requirement 
Status 
for a specified code system and optionally a specified 
version. (TSF-11; TSWF-7 Lookup Code — Required) 
13 Value set access · 
TSWF-3 
Value set expansion.  The TS shall expand value sets 
into the explicit list of concepts they contain at a given 
point in time, accounting for the version of the underlying 
code systems and the expansion parameters supplied by 
the consumer. (TSWF-3 Expand Value Set — Required) 
Required 
14 Code translation · 
TSF-13 · TSWF-8 
Code translation using concept maps.  The TS shall 
support the translation of codes from one code system to 
another using published concept maps, returning the 
target code, the equivalence relationship, and relevant 
context for the translation. (TSF-13; TSWF-8 Translate 
Code — Required) 
Required 
15 Terminology 
querying · TSWF-5 
Code system query.  The TS shall support queries 
against code systems, enabling consuming systems to 
retrieve code system metadata, browse hierarchies, and 
search for concepts. (TSWF-5 Query Code System — 
Required) 
Required 
16 Value set querying · 
TSWF-4 · TSWF-6 
Value set and concept map query.  The TS shall 
support queries against value sets and concept maps, 
enabling consuming systems to retrieve metadata, list 
contents, and inspect relationships. (TSWF-4 Query 
Concept Map; TSWF-6 Query Value Set — Required) 
Required 
17 Clinical data access 
Multilingual concept display.  The TS should support 
multilingual 
designations 
for 
concepts, 
enabling 
consuming systems to display terms in the language 
appropriate to the user, and should support the addition 
of national language translations to internationally defined 
code systems where countries have developed them. 
Recommended 
GOVERNANCE AND ACCESS CONTROL 
18 Terminology 
governance 
Governance workflow and access control.  The TS 
shall enforce role-based access to author, review, 
approve, publish, deprecate, and retire terminology 
content, supporting a defined governance workflow that 
ensures content is reviewed by authorised stewards with 
clinical and domain expertise before activation, and that 
the lifecycle of each artefact is transparently documented. 
Required 
19 Terminology 
governance 
Search and discovery.  The TS shall provide search and 
browsing capabilities enabling users and consuming 
systems to locate code systems, value sets, concept 
maps, and individual concepts by name, identifier, 
keyword, domain, or associated standard. 
Required 
20 Terminology 
governance 
Licensing enforcement.  The TS shall manage licensing 
and access restrictions associated with proprietary 
terminologies, ensuring that consuming systems and 
users access content in compliance with applicable 
licence terms, including appropriate authentication and 
Required 
 
 
170 
# 
Business process 
Functional requirement 
Status 
access controls for terminologies whose licences restrict 
access to authorised users or member nations. 
21 Terminology 
governance 
Subscription and notification.  The TS should provide 
a mechanism for consuming systems and users to 
subscribe to changes in specific code systems, value 
sets, or concept maps, and to receive notifications when 
those artefacts are updated, deprecated, or retired, 
enabling dependent systems and the LIMR to initiate 
timely impact analysis and updates. 
Recommended 
INTEGRATION AND INTEROPERABILITY 
22 Semantic 
governance 
LIMR integration. Where a Logical Information Model 
Repository is in place, the TS shall interoperate with it so 
that value set bindings declared in logical information 
models can be resolved against the value sets managed 
by the TS, and so that changes to value sets trigger 
notifications to the LIMR for impact assessment on 
dependent models, maintaining alignment between the 
structure of data and the meaning of its coded elements. 
Where a LIMR is not yet in place, this requirement does 
not apply. 
Recommended 
23 Terminology 
governance 
Federation with international sources.  The TS should 
support synchronisation with or referencing of content 
published by international terminology 
authorities, 
enabling receipt of new releases of international code 
systems, support for local extensions of globally curated 
content, and mechanisms for submitting local change 
requests 
back 
to 
global 
standards 
development 
organisations. 
Recommended 
CROSS-CUTTING 
24 Performance · 
Availability 
Performance and availability.  The TS shall be designed 
for high availability and low-latency response, given that 
terminology operations — code validation, value set 
expansion, concept lookup — are invoked frequently and 
synchronously by point-of-care, analytics, and integration 
systems across the ecosystem. 
Required 
25 Governance · Audit 
Audit logging.  The TS shall maintain a comprehensive 
audit log of all authoring actions, publication events, 
access events for licensed content, and configuration 
changes, recording the actor, the action, the affected 
artefact and version, and the timestamp. 
Required 
 
144 
Conformance note: Requirements are consistent with and extend the OpenHIE TS specification 
145 
(https://guides.ohie.org/arch-spec/openhie-component-specifications-1/openhie-terminology-service-ts) 
146 
and the IHE SVCM specification. The DPI-H reference architecture extends OpenHIE in seven respects: 
147 
(1) code system and value set versioning are elevated from Recommendation to Required; (2) 
148 
governance workflow is added as a Required capability; (3) licensing management is added as Required; 
149 
(4) search and discovery is added as Required; (5) subscription and notification is added as 
150 
Recommended; (6) LIMR integration is added as Recommended; and (7) standards neutrality is 
151 
 
 
171 
maintained throughout — FHIR is the recommended but not the only conformant implementation path. 
152 
TSWF-1 to TSWF-8 and TSF-1 to TSF-13 are all incorporated; TSWF-1 (Verify Code Existence) maps to 
153 
requirement 11; TSWF-2 (Verify Code Membership) also maps to requirement 11; TSWF-3 (Expand 
154 
Value Set) to requirement 13; TSWF-4 (Query Concept Map) and TSWF-6 (Query Value Set) to 
155 
requirement 16; TSWF-5 (Query Code System) to requirement 15; TSWF-7 (Lookup Code) to 
156 
requirement 12; TSWF-8 (Translate Code) to requirement 14. 
157 
GOVERNANCE 
Governance of the Terminology Service follows the cross-cutting governance 
framework in Section 3.4 of the guidance document. Component-specific 
considerations include:  
(1) Institutional ownership. Stewardship should be vested in a national health authority 
or a delegated standards body with a mandate spanning all health programmes and 
domains, not in a single vendor, project, or programme. The national TS is shared 
infrastructure and should be governed in the public interest.  
(2) Multi-disciplinary governance. Terminology governance requires active 
participation of clinical and public health domain experts, not only informaticians, to 
ensure that national value sets reflect local clinical practice, epidemiology, and 
reporting needs. Governance committees should include clinicians, public health 
professionals, pharmacists, and community health specialists alongside technical 
terminology experts.  
(3) Content lifecycle management. A clear content lifecycle — draft, review, approved, 
published, deprecated, retired — with explicit policies on backwards compatibility and 
version pinning is essential. Countries should define the minimum lead time for 
deprecating a code that is in active use in clinical systems, and the mechanism 
through which affected systems are notified.  
(4) Licensing obligations. Licensing of proprietary terminologies, notably SNOMED 
CT, should be planned as an institutional commitment including national member fees 
where applicable. The TS governance framework should define how licence 
compliance is monitored, how access credentials are managed for individual 
consuming systems, and what happens when a consumer's licence lapses.  
(5) International coordination. The Terminology Service governance framework 
should establish processes for monitoring upstream releases from international 
standards development organisations, for reviewing and testing new releases before 
national adoption, for managing the transition period during which multiple versions 
may be in active use, and for submitting local change requests and feedback to 
international bodies.  
(6) Relationship with Semantic Governance Infrastructure. The TS is a component of 
the broader semantic governance infrastructure that also includes the LIMR. 
Governance of the two components should be coordinated rather than managed in 
isolation, particularly regarding change management that crosses the boundary 
between terminology content and structural model definitions. 
 
158 
 
 
172 
DPI-H Reference Architecture  |  Component Articulation 
1
