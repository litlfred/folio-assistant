---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-100-benefits-package-registry
section_title: "Benefits Package Registry"
section_number: null
pages: 210-218
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
2 
Business Services Layer  ·  Health Financing 
3 
 
4 
ARCHITECTURE 
PLACEMENT 
The Benefits Package Registry sits at the business services layer of the DPI-H 
reference architecture. It references and depends on core registries (Client, Health 
Facility, Product) but is more domain-specific and operationally dynamic than those 
foundational components. It is architecturally distinct from two adjacent components, 
which sit in the functional application layer: (1) the Contract and Benefits 
Management System, which manages the operational relationships between 
payers, providers, and beneficiaries; and (2) the Beneficiary Registry, which records 
which individuals are enrolled in which schemes. The Benefits Package Registry is 
the shared reference that both depend on. 
 
5 
1  WHAT IT IS 
 
6 
The Benefits Package Registry is the national authoritative record of all health benefit packages offered 
7 
within a country's health financing ecosystem. It holds the definitive description of what each package 
8 
covers, who defines it, who finances it, and under what conditions a person may be eligible for it — spanning 
9 
government-funded entitlements, social health protection schemes, community-based programmes, donor-
10 
supported benefits, disease-specific subsidies, private insurance schemes, and NGO-run schemes. Its 
11 
defining purpose is to provide a shared, machine-readable reference against which any system in the health 
12 
ecosystem can determine what a given benefit package contains, without needing to duplicate or 
13 
independently maintain that definition. 
14 
The registry is a metadata component in the precise architectural sense: it holds definitions, not 
15 
transactions. It does not enrol beneficiaries, process claims, or manage payer-provider contracts. Those 
16 
functions belong to operational systems that consume the registry as their reference source. What the 
17 
registry provides is the stable, governed, agreed-upon description of what has been promised — the 
18 
canonical answer to the question: what is covered, for whom, by whom, under what conditions, and to what 
19 
limits — including which providers and facilities are accredited to deliver covered services, and which 
20 
specific products are covered and under what conditions, including any restrictions on generic medicines 
21 
substitution or emergency alternatives. 
22 
In health financing, health coverage schemes refer to any organised arrangement through which a defined 
23 
population is entitled to a defined set of health services or products, regardless of the financing mechanism 
24 
or institutional form. This includes contributory and non-contributory health insurance schemes, 
25 
government-funded entitlement programmes, employer-provided health benefits, donor-funded service 
26 
delivery programmes, community-based health financing arrangements, and targeted service delivery 
27 
models for specific population groups. What distinguishes a scheme from general health service provision 
28 
is the existence of a defined benefit package — a governed specification of what is covered, for whom, and 
29 
under what conditions. 
30 
 
31 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
32 
Progress toward universal health coverage depends on knowing, with precision and consistency, what 
33 
services people are entitled to receive. In most countries today, that knowledge is fragmented — held in 
34 
separate documents, scheme-specific databases, donor agreements, and operational systems that do not 
35 
 
 
200 
share a common reference. Some challenges faced in countries are that a provider is unable to reliably 
36 
determine at the point of care what a patient is covered for and a Ministry of Health cannot assess coverage 
37 
gaps or identify which populations are unprotected without manually reconciling information held across 
38 
multiple institutions. The result is a system that formally promises coverage but cannot operationally deliver 
39 
it with consistency or transparency. 
40 
When a Benefits Package Registry is in place, a shared, authoritative definition of entitlements becomes 
41 
available across the health system: 
42 
• 
Claims systems can validate against an authoritative package definition rather than a local copy 
43 
that may have drifted.  
44 
• 
Eligibility for a specific individual and service combination can be consistently determined, 
45 
regardless of which system or channel is querying.  
46 
• 
Governments gain the visibility to identify populations not reached by any scheme, detect benefit 
47 
overlaps, and make evidence-based decisions about package design and financing.  
48 
• 
For beneficiaries, this transparency means that what they are entitled to is discoverable, checkable, 
49 
and comparable to what they actually receive — a foundational condition for accountability in health 
50 
financing. 
51 
• 
Providers and pharmacies can access up-to-date information on covered services, medicines, and 
52 
conditions at the point of care, supporting prescribing and treatment decisions that are consistent 
53 
with what benefit packages include and what patients are entitled to receive. 
54 
 
55 
3  CORE  ATTRIBUTES 
 
56 
– Benefit package catalogue management. Creation, maintenance, and publication of authoritative 
57 
benefit package definitions, covering all scheme types within a country's financing ecosystem — 
58 
insurance-based, government-funded, community-based, and donor-financed — without assuming 
59 
any single financing model. 
60 
– Benefit structure and coverage definition. Structured definition of what each package covers: 
61 
included services, procedures, diagnostics, medicines, and devices; exclusions; co-payment and 
62 
cost-sharing rules; utilisation caps; and annual limits — at a level of granularity sufficient to support 
63 
claims validation and eligibility determination. 
64 
– Eligibility criteria management. Definition and governance of the eligibility criteria associated 
65 
with each benefit package, including demographic, socioeconomic, employment-status, disease-
66 
specific, and geographic criteria, and support for referencing eligibility rules that sit in external 
67 
systems (social protection registries, poverty databases) without replicating them. 
68 
– Multi-scheme and multi-payer association. Management of the payer or funding source 
69 
associated with each benefit package, supporting environments with multiple concurrent schemes 
70 
operated by different institutions — public insurers, social health protection agencies, private 
71 
insurers, and government programmes — within a single registry. 
72 
– Facility and service empanelment linkage. Support for linking benefit packages to the facilities, 
73 
service categories, and provider types through which covered services may be accessed, enabling 
74 
the registry to inform referral and eligibility determination at point of care. 
75 
– Coverage rules and limits management. Management of service-level coverage rules including 
76 
coverage levels by facility tier, geographic availability, referral requirements, and any differential 
77 
coverage conditions applied under specific schemes or population groups. 
78 
– Package lifecycle and version management. Maintenance of full version history for benefit 
79 
package definitions, with support for concurrent versions, defined lifecycle states, and backward-
80 
compatible referencing so that claims submitted against prior package versions can be validated 
81 
correctly. 
82 
 
 
201 
– Cross-scheme visibility and gap analysis. Query capability enabling authorised users — 
83 
Ministry of Health officials, health financing analysts, regulators — to view benefit coverage across 
84 
all registered schemes, identify populations not covered by any package, and detect coverage 
85 
overlaps or duplication across schemes. 
86 
 
87 
4  HOW IT CONNECTS 
 
88 
The Benefits Package Registry occupies a central position in the health financing architecture by providing 
89 
the reference data on which multiple systems and processes depend. Its relationships fall into four 
90 
categories: the components it depends on, the components that consume it, the operational systems it is 
91 
architecturally distinct from, and the cross-sectoral systems it interacts with. 
92 
A. The registry depends on foundational DPI-H components for its anchor data.  
93 
• 
The Client Registry provides the shared identity layer; the Benefits Package Registry does not 
94 
replicate identity but records which schemes a person may be enrolled in as a cross-reference.  
95 
• 
The Health Facility Registry provides the authoritative list of facilities; the registry references this to 
96 
associate benefit packages with empanelled providers and to determine where covered services 
97 
can be accessed.  
98 
• 
The Product Registry provides the standardised catalogue of medicines and health commodities; 
99 
benefit package definitions that include medicine coverage reference product identifiers from that 
100 
registry rather than maintaining parallel lists.  
101 
• 
The Terminology Service provides the standardised coding of services, procedures, and diagnoses 
102 
that benefit definitions use to specify covered items unambiguously — an essential dependency if 
103 
the registry is to support consistent claims validation across systems. 
104 
B. The registry is consumed by every system that needs to determine what is covered or validate a claimed 
105 
benefit. Eligibility verification services query the registry to determine whether a specific service is 
106 
covered under a person's scheme. Claims management systems validate submitted claims against the 
107 
benefit package definitions held in the registry, checking that claimed services, quantities, and amounts 
108 
are within coverage rules. Analytics and reporting systems draw on the registry to produce population-
109 
level coverage assessments, national health accounts analyses, and purchasing performance reports. 
110 
Beneficiary-facing portals and health wallets reference the registry to show individuals what they are 
111 
entitled to. 
112 
C. Two adjacent operational components are architecturally distinct from the registry and should not be 
113 
conflated with it.  
114 
• 
The Contract and Benefits Management System manages the operational relationships between 
115 
payers, providers, and beneficiaries — it handles enrolment transactions, payer-provider contracts, 
116 
premium collection, and individual eligibility determination. It consumes the Benefits Package 
117 
Registry as its reference source but manages dynamic, transactional data that does not belong in 
118 
the registry. 
119 
• 
The Beneficiary Registry records which individuals are enrolled in which schemes and under what 
120 
conditions; it is a scheme-management tool that references the package definitions held in the 
121 
Benefits Package Registry to resolve coverage for specific individuals. 
122 
D. The registry also interacts with systems and registries outside the health sector. Eligibility for some 
123 
benefit packages depends on social protection status, poverty classification, or employment data held 
124 
in external registries. The reference architecture's orchestration model enables eligibility checking to 
125 
reference these external sources without the health sector owning or duplicating that data. Government 
126 
payment infrastructure (e-payment systems, treasury systems) and public financial management 
127 
systems are further downstream dependencies that receive the financial flows triggered by eligibility 
128 
and claims decisions that reference package definitions. 
129 
 
130 
 
 
202 
5  FUNCTIONAL REQUIREMENTS 
 
131 
These requirements are consistent with and extend the OpenHIE Finance and Insurance Service (FIS) 
132 
specification58, particularly the Beneficiary Management process group (FISF-01 to FISF-05). They are also 
133 
informed by the JLN health financing business process framework and the World Bank Playbook on Digital 
134 
Social Protection Delivery Systems59. The DPI-H reference architecture extends these sources to cover 
135 
non-insurance financing schemes, the orchestration model for cross-sector eligibility, and the explicit 
136 
governance of benefit package metadata as a shared national asset. 
137 
Functional requirements are grouped by the business process they support. Where OpenHIE Finance and 
138 
Insurance Service (FIS) process references exist, these are noted in the business process column (e.g., 
139 
FISF-03). Requirements marked ‘Required’ are mandatory for conformance; those marked ‘Recommended’ 
140 
are strongly advised and expected in well-functioning implementations but may be phased according to 
141 
country maturity. 
142 
 
143 
# 
Business process 
supported 
Functional requirement 
Status 
CONTENT MANAGEMENT 
1 
Benefit package 
design & definition 
Benefit package authoring.  The Benefits Package 
Registry shall support the creation, update, publication, 
deprecation, 
and 
retirement 
of 
benefit 
package 
definitions, with full version control and the ability to 
manage concurrent active package versions across 
different schemes. 
Required 
2 
Benefit package 
design & definition · 
Claims validation 
Benefit structure definition.  The Benefits Package 
Registry shall support the structured definition of what 
each package covers, including services, procedures, 
diagnostics, medicines, devices, exclusions, co-payment 
and cost-sharing rules, utilisation caps, annual benefit 
limits, and conditions under which covered items may be 
accessed. 
Required 
3 
Eligibility 
determination · 
Beneficiary 
enrolment (FISF-01) 
Eligibility criteria definition.  The Benefits Package 
Registry shall support the formal definition of eligibility 
criteria for each benefit package, including demographic, 
socioeconomic, employment-status, disease-specific, 
and geographic criteria, expressed in a structured form 
that consuming systems can evaluate or reference. 
Required 
4 
Scheme 
governance & 
oversight · 
Coverage planning 
Multi-scheme support.  The Benefits Package Registry 
shall support the coexistence of benefit packages from 
different 
scheme 
types 
— 
government-funded 
entitlements, contributory insurance, community-based 
schemes, donor-financed programmes, disease-specific 
subsidies — under a unified registry structure, without 
prescribing a single financing model or institutional 
ownership arrangement. 
Required 
 
58 https://guides.ohie.org/arch-spec/openhie-component-specifications-1/openhie-finance-and-insurance-service 
59 Karippacheril, Tina George; Alberro Encinas, Luis Iñaki; Cardenas Martinez, Ana Lucia; Daly, Conrad; Suri, 
Satyajit. 2024. Playbook on Digital Social Protection Delivery Systems: Towards Dynamic Inclusion and Interoperability. © World 
Bank. http://hdl.handle.net/10986/41527  
 
 
203 
# 
Business process 
supported 
Functional requirement 
Status 
5 
Scheme 
governance & 
oversight · Strategic 
purchasing 
Payer and scheme attribution.  The Benefits Package 
Registry shall capture the payer or funding source 
responsible for each benefit package, including the 
identity of the administering institution, the financing 
mechanism, and the contractual or regulatory basis under 
which the package is offered, supporting multi-payer and 
mixed public-private financing environments. 
Required 
6 
Provider 
empanelment · 
Eligibility 
determination at 
point of care 
Facility and provider type linkage.  The Benefits 
Package Registry shall support the association of benefit 
packages with the facility types, service levels, and 
provider categories through which covered services may 
be accessed, including differential coverage rules that 
apply at different levels of the health system. 
Recommended 
ACCESS, ELIGIBILITY SUPPORT & INTEGRATION 
7 
System integration 
& interoperability 
Machine-readable APIs.  The Benefits Package Registry 
shall expose machine-readable APIs enabling consuming 
systems to query package definitions, coverage rules, 
eligibility criteria, payer associations, and facility linkages 
in a consistent, portable manner, aligned where 
applicable with FHIR Coverage, InsurancePlan, and 
related resources. 
Required 
8 
Provider eligibility 
inquiry (FISF-03) · 
Beneficiary eligibility 
inquiry (FISF-04) 
Eligibility inquiry support.  The Benefits Package 
Registry shall provide the structured benefit and coverage 
data required to support eligibility inquiry processes — 
both provider-initiated (determining whether a patient's 
presenting service is covered) and beneficiary-initiated 
(determining what a person is entitled to). 
Required 
9 
Pre-authorisation 
(FISF-05) 
Pre-authorisation data support.  The Benefits Package 
Registry shall provide the coverage definition data 
needed to support pre-authorisation workflows, enabling 
systems that manage pre-authorisation to determine 
whether a proposed service falls within a person's benefit 
package before the service is rendered. 
Recommended 
10 Eligibility 
determination · 
Cross-sector 
coordination 
External eligibility rule referencing.  The Benefits 
Package Registry shall support the ability to reference 
eligibility conditions that depend on data held in external 
registries — including social protection databases, 
poverty 
classification 
systems, 
and 
employment 
registries — without replicating or owning that external 
data. 
Required 
11 Coverage gap 
analysis & planning 
· Transparency & 
accountability 
Cross-scheme coverage query.  The Benefits Package 
Registry shall support authorised queries across all 
registered benefit packages, enabling analysts and 
administrators to determine which schemes are active, 
what services are covered under each, which population 
groups are eligible, and where coverage gaps or benefit 
overlaps exist. 
Recommended 
 
 
204 
# 
Business process 
supported 
Functional requirement 
Status 
GOVERNANCE WORKFLOW & ACCESS CONTROL 
12 Scheme 
governance & 
oversight · Data 
stewardship 
Role-based access control.  The Benefits Package 
Registry shall enforce role-based access control, 
differentiating between users and systems authorised to 
author and publish package definitions, those authorised 
to manage eligibility criteria and payer associations, and 
those with read-only access for eligibility and claims 
validation purposes. 
Required 
13 Scheme 
governance & 
oversight · Benefit 
package design 
Governance workflow.  The Benefits Package Registry 
shall support configurable review and approval workflows 
for the creation and modification of benefit package 
definitions, requiring designated stewards — which may 
include Ministry of Health officials, scheme regulators, 
and payer representatives — to approve changes before 
publication. 
Required 
14 Transparency & 
accountability · 
Scheme 
governance 
Stakeholder visibility management.  The Benefits 
Package Registry shall support configurable visibility 
levels for benefit package definitions, enabling some 
packages to be publicly accessible (for transparency and 
beneficiary-facing 
applications) 
while 
others 
are 
restricted to authorised institutional users. 
Recommended 
CROSS-CUTTING 
15 Claims validation · 
Governance & data 
stewardship 
Version management.  The Benefits Package Registry 
shall maintain full version history of all benefit package 
definitions, supporting retrospective lookup of prior 
package versions so that claims and eligibility decisions 
referencing earlier package states can be validated 
against the package definition that was in effect at the 
time of the relevant encounter. 
Required 
16 System integration · 
Claims 
management 
Subscription and notification.  The Benefits Package 
Registry shall provide a mechanism for consuming 
systems — including eligibility services, claims systems, 
and beneficiary-facing portals — to subscribe to changes 
in specific packages or scheme categories and receive 
notifications when definitions are updated, deprecated, or 
retired. 
Recommended 
17 Governance & data 
stewardship · 
Transparency & 
accountability 
Audit logging.  The Benefits Package Registry shall 
maintain a comprehensive audit log of all authoring 
actions, publication events, access control changes, and 
bulk import operations, supporting accountability for 
benefit definition governance. 
Required 
18 Eligibility 
determination · 
Claims validation 
Performance and availability.  The Benefits Package 
Registry shall be designed for high availability, given that 
eligibility determination and claims validation processes 
across all levels of the health system depend on access 
to benefit package definitions for real-time and near-real-
time transactions. 
Required 
 
 
205 
 
144 
Note: These requirements are consistent with and extend the OpenHIE Finance and Insurance Service 
145 
specification. The DPI-H reference architecture extends OpenHIE's scope in three respects: benefit 
146 
packages are generalised beyond insurance-specific definitions to cover all health financing mechanisms; 
147 
eligibility criteria management explicitly accommodates cross-sector external rule referencing; and the 
148 
registry is defined as a shared national metadata asset under formal governance, rather than a functional 
149 
component of a specific claims or insurance management system. 
150 
6  STAKEHOLDERS 
 
151 
The Benefits Package Registry serves a broad and institutionally diverse set of stakeholders, reflecting the 
152 
multi-actor nature of health financing in most countries. The table below identifies primary stakeholders, 
153 
their relationship to the registry, and the value they derive from it. 
154 
Stakeholder 
Relationship to the registry 
Value derived 
Ministry of Health 
Would be the primary steward in 
most countries. Authors and governs 
the benefit package definitions that 
represent national health policy. 
Single authoritative view of all health 
entitlements 
across 
schemes; 
capability to identify coverage gaps 
and policy-design evidence. 
National 
health 
insurance 
agency 
/ 
Social 
Health 
Protection (SHP) body 
Scheme 
operator. 
Authors 
and 
manages package definitions for 
schemes 
under 
its 
mandate; 
accesses other schemes for cross-
scheme coordination. 
Authoritative 
package 
definitions 
anchoring enrolment, eligibility, and 
claims 
processes; 
reduced 
duplication with other payers. 
Private insurers 
Participating institution in multi-payer 
systems. May author and manage 
definitions for their schemes; queries 
public 
package 
definitions 
for 
coordination and anti-duplication. 
Consistent 
national 
definitions 
supporting claims exchange and 
interoperability 
with 
government 
schemes. 
Healthcare providers 
Consuming institution. Queries the 
registry at point of care to determine 
what services are covered for a 
presenting patient and under which 
scheme conditions. 
Reliable, 
system-accessible 
coverage 
information 
reducing 
manual 
verification, 
pre-
authorisation delays, and denied-
claims rates. 
Beneficiaries 
/ 
patients 
End users of benefit entitlements. 
Access 
definitions 
through 
beneficiary-facing portals and health 
wallets referencing the registry. 
Transparent, accessible information 
about what they are entitled to, 
enabling informed engagement with 
services and accountability for what 
is delivered. 
Social 
protection 
/ 
welfare agencies 
External eligibility data provider. 
Holds eligibility criteria (poverty 
classification, welfare enrolment) 
referenced by the registry without 
being replicated in it. 
Reduced data duplication; clear 
institutional 
boundary 
between 
health benefit definition and social 
protection administration. 
Development partners 
and donors 
Scheme 
funders. 
Register 
and 
manage 
definitions 
for 
donor-
financed 
benefit 
programmes 
alongside government schemes. 
Visibility of their programmes within 
the 
national 
health 
benefit 
landscape; ability to coordinate 
coverage with government schemes. 
 
155 
 
 
206 
GOVERNANCE 
Governance of the Benefits Package Registry follows the cross-cutting governance 
framework set out in Section 3.4 of the guidance document. Component-specific 
considerations include:  
(1) The Benefits Package Registry has a uniquely complex multi-institutional 
governance context. Unlike registries with a single steward (such as the Health Facility 
Registry owned by the MoH), benefit package definitions may be authored by multiple 
institutions — the Ministry of Health, national health insurance agencies, private 
scheme operators, and donor-financed programme managers — each with legitimate 
authority over their own schemes. The governance framework should clearly define 
which institution has stewardship authority for each package type, and what approval 
is required before a package definition can be published or modified.  
(2) Because eligibility for some benefit packages depends on data held in external 
social protection systems, the governance framework should address cross-
institutional data referencing — including data sharing agreements, refresh 
schedules, and dispute resolution for cases where an external eligibility source returns 
inconsistent data.  
(3) The registry should be designed to support the central oversight principle: central 
visibility without central control. Ministries of Health and regulators require aggregate 
visibility across all schemes to support coverage analysis and policy; this does not 
imply that they control the operational management of individual schemes. 
 
156 
 
 
207
