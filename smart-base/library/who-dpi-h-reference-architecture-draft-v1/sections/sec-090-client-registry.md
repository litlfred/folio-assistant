---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-090-client-registry
section_title: "Client Registry"
section_number: null
pages: 125-135
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
19 
• 
Health Facility Registry 
20 
• 
Health Workforce Registry 
21 
• 
Product Registry 
22 
• 
Lifelong Health Record 
23 
• 
Terminology Service 
24 
• 
Logical Information Model Repository 
25 
 
26 
 
27 
 
28 
 
29 
 
30 
 
31 
 
32 
 
33 
 
34 
 
35 
 
36 
 
37 
 
38 
 
39 
 
40 
 
41 
 
 
115 
DPI-H Reference Architecture  |  Component Articulation 
42 
Client Registry 
43 
Core Registries for Health  ·  DPI-H Foundational Layer  
44 
 
45 
ARCHITECTURE 
PLACEMENT 
The Client Registry is a core DPI-H foundational component — the shared identity 
anchor for the entire health ecosystem. It does not duplicate or replace national 
foundational identification systems (civil registries, national IDs). Where a 
foundational ID system exists, the Client Registry references and leverages it. 
Where one does not, the Client Registry provides the health sector's own identity 
resolution capability. In both cases, it is the single authoritative source of health-
specific person identity and identifier cross-referencing within the DPI-H 
architecture. 
 
46 
1  WHAT IT IS 
 
47 
The Client Registry is the national authoritative source of health-specific person identity. It is the 
48 
foundational health-sector component that maintains a unique, verifiable identity record for every person 
49 
who accesses health services and provides the identity resolution services that allow other systems to 
50 
consistently identify that same person across the fragmented landscape of health information systems. It 
51 
holds the minimum set of demographic attributes needed to uniquely identify a person, assigns and 
52 
manages health-specific unique identifiers, links multiple local or system-specific identifiers to a single 
53 
person record, and resolves ambiguous matches through deduplication and probabilistic matching. 
54 
The Client Registry is not a clinical record. It holds identity data — who a person is — not health data that 
55 
describes what has happened to them. Its purpose is to ensure that every other system that records, stores, 
56 
or exchanges health data about a person can be certain it is referring to the same individual. Without that 
57 
assurance, person-centred care, longitudinal health records, and cross-programme data aggregation 
58 
cannot be achieved with the reliability or integrity that health system decision-making requires. 
59 
In the DPI-H reference architecture, the Client Registry may also be described as a Master Patient Index 
60 
(MPI) or Enterprise Master Patient Index (EMPI), particularly in contexts where the scope spans multiple 
61 
health care organisations or information systems. The term 'Client Registry' is used here in preference to 
62 
'patient registry' to reflect the broad range of interactions a person has with the health system — as a 
63 
patient, a carer, a health service user, or a community member — none of which are fully captured by the 
64 
clinical connotations of 'patient'. 
65 
 
66 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
67 
Person-centred care depends on knowing who the person is. A clinician ordering a test, dispensing a 
68 
medicine, or reviewing a referral needs confidence that the record they are looking at belongs to the person 
69 
in front of them — not a near-duplicate created by a different facility, a name variant, or a data entry error. 
70 
When that confidence is absent, the integrity of every clinical decision that depends on it is at risk. At scale, 
71 
fragmented identity produces fragmented data: disease surveillance is unreliable, population health 
72 
indicators are inflated by duplicates, and programme performance cannot be measured with integrity. 
73 
The stakes are higher for vulnerable populations. People who access services under different names — 
74 
due to stigma, discrimination, or transient living circumstances — are especially susceptible to identity 
75 
fragmentation. Migrants and refugees without foundational identification documents risk being invisible to 
76 
the health system entirely. Children born outside formal registration systems may be denied services. A 
77 
 
 
116 
well-designed Client Registry, drawing on inclusive identity approaches and supporting multiple identifier 
78 
types, is itself a health equity instrument. 
79 
When a Client Registry is in place and functioning, every system it connects to gains the ability to produce 
80 
a longitudinal view of an individual's health encounters — across facilities, programmes, and time periods. 
81 
This is the enabling condition for a Lifelong Health Record, for cross-programme care coordination, for 
82 
financial protection through accurate beneficiary identification, and for trustworthy public health 
83 
surveillance. The Client Registry does not deliver these outcomes directly; it makes them structurally 
84 
achievable. 
85 
 
86 
3  CORE ATTRIBUTES 
 
87 
– Person identity record management. Creation, maintenance, and lifecycle management of 
88 
demographic records for individuals accessing health services, including support for newborns, 
89 
minors, and persons with incomplete or provisional demographic information. 
90 
– Health Unique Identifier (HUID) assignment and management. Assignment of a nationally 
91 
unique, non-intelligent health identifier to each registered person, and management of that 
92 
identifier throughout the person's engagement with the health system — including across name 
93 
changes, demographic updates, and administrative boundary changes. 
94 
– Multi-identifier management and cross-referencing. Storage and management of multiple 
95 
identifiers per person — including the HUID, foundational identifiers (national ID, CRVS number), 
96 
and local facility or programme identifiers — and the cross-referencing mappings that allow any 
97 
one of these to resolve to the person's canonical record. 
98 
– Identity resolution and deduplication. Application of configurable matching algorithms — both 
99 
probabilistic and deterministic — to detect and resolve duplicate records, link records representing 
100 
the same person, and maintain deduplication at scale as new records are submitted from multiple 
101 
sources. 
102 
– Identity verification and assurance. Support for verification of a person's identity against external 
103 
authoritative sources, including foundational ID systems, biometric services, and civil registration, 
104 
providing differentiated assurance levels to consuming systems. 
105 
– Relationship and household management. Persistence of defined relationships between 
106 
registered persons — parent-child, household membership, spousal — supporting family-based 
107 
care coordination, child health linkage, and household-level eligibility assessment for health 
108 
financing schemes. 
109 
– Privacy-preserving and inclusive identity services. Support for pseudo-anonymisation of 
110 
person identifiers for population-level analysis and research; inclusive registration pathways for 
111 
persons without foundational documentation; and compliance with applicable data protection 
112 
frameworks including right-to-be-forgotten and data correction rights. 
113 
– Standards-based identity APIs. Exposure of machine-readable, standards-based APIs 
114 
supporting identity creation, query, cross-referencing, and subscription, enabling any conformant 
115 
system to resolve and exchange person identity data consistently. 
116 
 
117 
4  HOW IT CONNECTS 
 
118 
Relationship with foundational identification systems 
119 
The relationship between the Client Registry and foundational identification infrastructure is the most 
120 
architecturally significant dependency in the health identity domain, and the one most frequently 
121 
misunderstood. It is therefore given dedicated treatment here. 
122 
Foundational ID systems — civil registration and vital statistics (CRVS) systems, national ID systems, and 
123 
population registers — exist to provide legal identity to the general population for a wide range of civic, 
124 
 
 
117 
administrative, and social transactions. They are owned and governed outside the health sector. They are 
125 
the authoritative source for a person's legal identity: name, date of birth, sex, and nationality. They are not 
126 
owned by the health sector, and the Client Registry does not replicate them. 
127 
Functional health ID systems, including the Health Unique Identifier (HUID), are created to manage 
128 
identification for the specific use cases of health service delivery. They may or may not be linked to 
129 
foundational ID, depending on a country's context. The WHO HUID Guidance (2023) identifies three primary 
130 
implementation models that countries have adopted: 
131 
– Model A — HUID linked to national ID or CRVS. Where a robust foundational ID system exists, 
132 
the HUID is derived from or permanently linked to the foundational identifier. The Client Registry 
133 
stores the linkage and uses the foundational ID as the primary identity proofing source. This 
134 
reduces duplication and strengthens the accuracy of identity resolution. 
135 
– Model B — HUID not linked to national ID. Where a foundational ID system is absent, unreliable, 
136 
or inaccessible to the health sector, the health system creates its own functional identifier 
137 
independently. The Client Registry is the authoritative source for this health-specific identifier and 
138 
manages its own identity proofing processes. 
139 
– Model C — Multiple local health IDs linked through an EMPI. Where multiple facilities or 
140 
programmes have each assigned their own local identifiers to the same population, the Client 
141 
Registry functions as an Enterprise Master Patient Index — maintaining a cross-reference map 
142 
that links these local identifiers to a single canonical person record. 
143 
In all three models, the Client Registry does not duplicate foundational ID data or attempt to replicate civil 
144 
registration. Where a foundational ID exists, the Client Registry stores the identifier as a reference attribute 
145 
and may query the foundational system to verify identity at registration; it does not absorb or maintain the 
146 
authoritative record. Where foundational ID is absent, the Client Registry is the health sector's fallback, not 
147 
a substitute for foundational infrastructure. 
148 
Countries should be aware that linking a health identifier to a national ID or social protection registry creates 
149 
both opportunities and risks. The opportunity is stronger identity assurance and more accurate cross-
150 
programme coordination. The risk is that health data becomes accessible to actors outside the health 
151 
sector, or that individuals in vulnerable circumstances — undocumented migrants, people accessing 
152 
stigmatised services, stateless persons — may be deterred from seeking care if health identity is tied to 
153 
civic registration. The reference architecture does not prescribe which model a country should adopt; it 
154 
requires that whichever model is chosen, the linkage decisions and their implications are governed explicitly 
155 
and transparently. 
156 
 
157 
Relationship with other DPI-H components 
158 
Within the DPI-H reference architecture, the Client Registry is a dependency for almost every other 
159 
component, because nearly every health transaction involves a person whose identity must be resolved. 
160 
The Lifelong Health Record depends on the Client Registry to anchor clinical data to a verified person 
161 
record. The Benefits Package Registry depend on it to confirm the identity of individuals being enrolled in 
162 
health financing schemes. The Facility Registry cross-references it to record which facilities a person has 
163 
attended. Public health surveillance systems use it for deduplication of case reports. Consent management 
164 
services reference it to record which person has granted or withdrawn consent for specific data uses. 
165 
The Health Workforce Registry is an analogous component in the provider domain — it does for health 
166 
workers what the Client Registry does for health service users. The two are architecturally parallel and 
167 
share many functional patterns, including multi-identifier management, deduplication, and standards-based 
168 
API conventions. 
169 
The Client Registry schema — the logical structure defining which demographic attributes are stored and 
170 
how they are typed, constrained, and related — is a concern of the Logical Information Model Repository. 
171 
The LIMR holds the canonical model; the Client Registry implements it. Changes to the schema should be 
172 
proposed, reviewed, and approved through the LIMR's governance process before being implemented. The 
173 
Terminology Service provides the coded value sets for key attributes such as sex, gender, administrative 
174 
territory, language, and relationship type. 
175 
 
 
118 
Public Key Infrastructure (PKI) supports identity verification and credential management — particularly 
176 
where biometric verification or digital identity credentials are used for high-assurance authentication at point 
177 
of care. The Client Registry may consume PKI services to validate identity credentials presented at 
178 
registration or service access, but PKI is a foundational DPI component that sits outside the health sector. 
179 
 
180 
5  FUNCTIONAL REQUIREMENTS 
 
181 
These requirements are consistent with and extend the OpenHIE Client Registry specification. They 
182 
incorporate the WHO HUID Guidance principles, and IHE PMIR and PIX profile requirements (Patient 
183 
Master Identity Registry — PMIR; Patient Identifier Cross-referencing — PIX). The four OpenHIE workflow 
184 
requirements (CRWF-1 to CRWF-4) are treated as foundational and are incorporated into the relevant 
185 
groups below. Where a requirement extends or elevates beyond the OpenHIE specification, this is noted. 
186 
 
187 
# 
Business process 
Functional requirement 
Status 
IDENTITY CREATION AND REGISTRATION 
1 
Person registration 
· CRWF-1 
Person demographic record creation.  The Client 
Registry shall support the creation of a demographic 
record for a new person, capturing the minimum dataset 
of identity attributes, assigning a Health Unique Identifier, 
and publishing the record for consumption by connected 
systems. The system shall support registration of persons 
with incomplete demographic data, including newborns 
and persons without foundational documentation. 
Required 
2 
Person registration 
· Identifier 
management 
Multi-identifier capture.  The Client Registry shall 
support the capture of multiple identifiers per person at 
registration, including the HUID, foundational ID numbers 
(national ID, CRVS registration number, passport), and 
local facility or programme identifiers, storing all as cross-
referenced attributes on the same canonical person 
record. 
Required 
3 
Person registration 
Configurable demographic schema.  The Client 
Registry shall support a configurable demographic 
schema, allowing countries to define and extend the 
attributes captured per person record, add context-
specific attributes, and reference the canonical schema 
definition maintained in the Logical Information Model 
Repository. (OpenHIE CRF-6) 
Recommended 
4 
Person registration 
· Inclusive identity 
Registration without foundational documentation.  
The Client Registry shall support identity registration for 
persons who cannot present foundational identification 
documents, including undocumented migrants, stateless 
persons, newborns, and persons accessing stigmatised 
services, using alternative identity proofing methods 
appropriate to the country context. 
Required 
IDENTITY UPDATE AND LIFECYCLE MANAGEMENT 
5 
Identity update · 
CRWF-2 
Demographic record update.  The Client Registry shall 
support the update of a person's demographic record, 
Required 
 
 
119 
# 
Business process 
Functional requirement 
Status 
capturing the change with attribution (source system or 
user, date, and reason for change) and propagating 
updates to subscribed consuming systems. 
6 
Identity update · 
Right to erasure 
Record deactivation and data rights management.  
The Client Registry shall support the deactivation, 
suppression, and — where legally required — deletion of 
person records, including mechanisms to implement data 
subject rights such as right to correction and right to 
erasure in accordance with applicable data protection 
legislation (e.g., GDPR-equivalent frameworks). 
Required 
IDENTITY QUERY AND RETRIEVAL 
7 
Identity resolution · 
CRWF-3 
Query by identifier.  The Client Registry shall support 
the retrieval of a person's demographic record and 
associated identifiers by submitting any known identifier 
— HUID, foundational ID, or local identifier — and 
receiving the canonical record and full cross-reference 
map in response. 
Required 
8 
Identity resolution · 
CRWF-4 
Query by demographics.  The Client Registry shall 
support the retrieval of candidate person records by 
submitting demographic attributes (name, date of birth, 
address, or combinations thereof), returning ranked 
candidate matches to support identity resolution at point 
of registration or service access. 
Required 
9 
Identity resolution 
External ID verification.  The Client Registry shall 
support the verification of a person's identity against 
external authoritative sources, including foundational ID 
systems, civil registration authorities, and biometric 
verification services, returning a verification outcome and 
assurance level to the requesting system. 
Recommended 
IDENTITY RESOLUTION AND DEDUPLICATION 
10 Deduplication · 
CRF-2 
Person linking and deduplication.  The Client Registry 
shall implement accurate and efficient person linking and 
deduplication, detecting records representing the same 
person across systems and merging or linking them into 
a single canonical record. Merge and link operations shall 
be distinct: linking preserves both records with a cross-
reference; merging combines them into one. (OpenHIE 
CRF-2 — Required; elevated from OpenHIE status) 
Required 
11 Deduplication · 
CRF-1 
Configurable entity matching.  The Client Registry shall 
support 
configurable 
matching 
rules 
for 
identity 
resolution, allowing both probabilistic (statistical) and 
deterministic (rule-based) approaches, with configurable 
blocking strategies, a default implementation, and the 
ability for advanced users to provide custom matching 
implementations. (OpenHIE CRF-1) 
Recommended 
12 Deduplication · 
CRF-5 
Manual match adjudication.  The Client Registry shall 
provide a mechanism for authorised reviewers to inspect 
Recommended 
 
 
120 
# 
Business process 
Functional requirement 
Status 
uncertain or potential matches, manually accept or reject 
merge or link suggestions, and override incorrect 
automated decisions. (OpenHIE CRF-5) 
13 Deduplication 
Unlinkage and merge reversal.  The Client Registry 
shall support the reversal of merge and link operations, 
restoring records to their prior state where an incorrect 
deduplication decision is identified. A full history of merge 
and link operations shall be retained. 
Recommended 
RELATIONSHIP MANAGEMENT 
14 Care coordination · 
Financing · CRF-10 
Parent-child and birth relationship management.  The 
Client Registry shall support the persistence of parent-
child relationships, birth order, and multi-birth indicators, 
linking child records to the mother's or guardian's 
canonical record and maintaining the relationship over 
time. (OpenHIE CRF-10) 
Recommended 
15 Care coordination · 
Financing 
Household and spousal relationship management.  
The Client Registry shall support the persistence of 
household membership and spousal relationships 
between registered persons, enabling family-based care 
coordination, 
benefit 
eligibility 
determination, 
and 
household-level health programme management. 
Recommended 
PRIVACY, SECURITY, AND ACCESS CONTROL 
16 Governance · Data 
protection · CRF-8 
Audit logging.  The Client Registry shall maintain a 
comprehensive audit log of all changes to person records, 
identifier cross-references, merge and link operations, 
configuration changes, and user access events, including 
the actor, timestamp, and nature of each action. 
(OpenHIE CRF-8 — Required) 
Required 
17 Governance · Data 
protection · CRF-9 
Role-based access control.  The Client Registry shall 
enforce role-based access control, defining and enforcing 
distinct permissions for record creation, update, query, 
merge, deletion, and administration, and restricting 
access to sensitive identity attributes (such as 
foundational ID linkages or biometric data) to authorised 
roles. (OpenHIE CRF-9 — elevated to Required) 
Required 
18 Population analytics 
· Privacy 
Pseudo-anonymisation for population-based use.  
The Client Registry shall support the generation of 
pseudo-anonymised person identifiers for population-
level analysis, risk stratification, and research use cases, 
enabling secondary use of identity-linked health data 
without exposing personally identifiable information to 
analytical consumers. 
Recommended 
19 Data protection 
Data protection regulatory compliance.  The Client 
Registry shall be designed in conformance with 
applicable data protection legislation and principles, 
including purpose limitation, data minimisation, accuracy, 
Required 
 
 
121 
# 
Business process 
Functional requirement 
Status 
storage limitation, and the individual rights to access, 
correct, and erase personal data. 
INTEROPERABILITY AND INTEGRATION 
20 System integration 
Standards-based identity APIs.  The Client Registry 
shall expose machine-readable, standards-based APIs 
for person identity creation, query, update, and cross-
referencing, conformant with applicable IHE profiles 
(PMIR; PIX) and FHIR Patient resource conventions. 
Required 
21 System integration · 
CRF-3 
Transaction monitoring.  The Client Registry shall 
support the tracking and monitoring of inbound and 
outbound identity transactions, recording the source, 
destination, timestamp, and outcome of each transaction 
to support operational oversight and troubleshooting. 
(OpenHIE CRF-3) 
Recommended 
22 System integration · 
CRF-4 
Shared Health Record ID synchronisation.  The Client 
Registry shall support synchronisation of person 
identifiers with the Lifelong Health Record (or Shared 
Health Record), ensuring that the canonical HUID is 
consistently used as the person anchor across clinical 
and identity systems. (OpenHIE CRF-4) 
Recommended 
CROSS-CUTTING 
23 Governance · Error 
management · 
CRF-7 
Error management.  The Client Registry shall implement 
comprehensive error handling that captures and logs all 
system exceptions, records relationships between 
exceptions, and provides actionable error information to 
source systems in response to failed transactions. 
(OpenHIE CRF-7) 
Recommended 
24 System integration 
Subscription and notification.  The Client Registry shall 
support subscription-based notification for consuming 
systems and users, enabling notification of record 
creation, update, deduplication events, demographic 
changes, and identifier additions or retirements, for both 
DPI-H and functional application layer consumers. 
Recommended 
25 Performance · 
Availability 
Performance and availability.  The Client Registry shall 
be designed for high availability and low-latency 
response, given that identity resolution is invoked 
synchronously by point-of-care, scheduling, claims, and 
surveillance systems across all levels of the health 
system. 
Required 
 
188 
Note: Requirements CRF-1 through CRF-10 align with the OpenHIE Client Registry specification. The 
189 
DPI-H reference architecture extends OpenHIE in five respects: (1) multi-identifier management is 
190 
elevated to Required; (2) access control (CRF-9) is elevated from Recommended to Required; (3) 
191 
unlinkage and merge reversal are explicitly added; (4) inclusive registration for persons without 
192 
foundational documentation is made an explicit requirement; and (5) pseudo-anonymisation and data 
193 
protection regulatory compliance are introduced as new requirements reflecting the broader DPI-H 
194 
governance context. 
195 
 
 
122 
6  DATA REQUIREMENTS 
 
196 
The following table defines the minimum dataset for a person record in the Client Registry. It draws on the 
197 
WHO HUID Guidance (2023), the HL7 FHIR Patient resource and the IHE PMIR profile minimum attribute 
198 
set. Requirement status reflects the minimum requirement for a record to support identity resolution and 
199 
cross-system use.  
200 
Note: This is illustrative rather than an exhaustive list and countries can extend based on needs. 
201 
 
202 
Data element 
Description 
Requirement 
Status 
Health Unique 
Identifier (HUID) 
The nationally assigned alphanumeric identifier that 
uniquely identifies a person across health services, 
independent of facility-specific identifiers. 
Mandatory 
First / given name 
The person's first or given name as recorded. 
Mandatory 
Family / surname 
The person's family name or surname. 
Mandatory 
Date of birth 
Full date of birth (year, month, day) or estimated date 
where exact date is unknown. 
Mandatory 
Sex at birth 
Biological sex recorded at birth, using standardised coded 
values. 
Mandatory 
Gender 
Self-reported gender identity, captured separately from 
sex at birth to support inclusive care. 
Recommended 
Nationality / 
citizenship 
The country of which the person is a national or resident, 
including stateless or refugee status where applicable. 
Mandatory 
Current address 
Physical residential address at the time of registration, 
including administrative unit hierarchy. 
Mandatory 
Contact 
information 
Telephone number(s) and/or email address for the person 
or a designated contact. 
Mandatory 
Language 
preference 
Primary language for communication and care delivery. 
Recommended 
Foundational 
identifier(s) 
National ID number, CRVS registration number, or 
equivalent government-issued foundational identifier, 
where available and consented. May be multiple. 
Recommended 
Local / facility 
identifiers 
Facility-specific or programme-specific patient identifiers, 
maintained as cross-references to support identity 
resolution across systems. 
Mandatory 
Mother's / 
guardian's name 
Full name of mother or legal guardian, used for newborn 
identification and household linkage. 
Mandatory 
Household / family 
relationships 
Relationships to other registered persons (parent-child, 
household member, spouse), supporting family-based 
care coordination and benefit eligibility. 
Recommended 
Photo 
A photograph of the person to support identity verification 
at point of care. 
Recommended 
 
 
123 
Data element 
Description 
Requirement 
Status 
Biometric data 
Biometric attributes (fingerprint, iris, facial image) where 
legally permitted and technically supported, for high-
assurance identity verification. 
Optional 
Record creation 
and update 
metadata 
Dates of record creation, last update, and the source 
system or user who made the change. 
Mandatory 
 
203 
Notes: (1) 'Biometric data' is listed as Optional rather than Recommended. Its use requires a formal privacy 
204 
impact assessment, an explicit legal basis, and an equity analysis to confirm it does not create access 
205 
barriers for populations with unreadable biometrics (elderly, manual workers, persons with disabilities). (2) 
206 
Countries should not embed personally identifiable attributes — name, date of birth, location — within the 
207 
HUID code itself. The HUID should be an opaque, non-intelligent identifier. (3) The minimum dataset above 
208 
reflects the nationally held Client Registry record; facility-level systems may collect additional clinical 
209 
demographic attributes that do not need to be federated to the national registry. 
210 
GOVERNANCE 
Governance of the Client Registry follows the cross-cutting governance framework in 
Section 3.4 of the guidance document. Component-specific considerations include:  
 
(1) The Client Registry sits at the intersection of health, civil registration, social 
protection, and potentially financial services. Its governance should be explicitly multi-
sectoral: a single Ministry of Health cannot unilaterally govern a component whose 
data is referenced across government. A formal governance body with mandated 
participation from health, civil registration, and data protection authorities is required.  
 
(2) The decision of whether to link the HUID to a foundational identifier — and to which 
one — is a policy decision with significant privacy, equity, and institutional 
implications. This decision should be taken at the highest appropriate level of 
government, supported by a privacy impact assessment and a legal framework, 
before technical implementation proceeds.  
 
(3) The right to be registered should be universal. Governance should ensure that 
absence of foundational documentation never becomes grounds for denial of health 
identity or service access.  
 
(4) Merge and link decisions that affect a person's health record should be reviewable 
by the person themselves where technically and legally feasible, consistent with data 
subject rights under applicable frameworks. 
 
211 
 
 
124 
DPI-H Reference Architecture  |  Component Articulation 
1
