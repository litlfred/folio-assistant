---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-102-health-management-information-system
section_title: "Health Management Information System"
section_number: null
pages: 221-229
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
2 
Business Services Layer  ·  Health System Performance and Analytics  
3 
 
4 
TERMINOLOGY 
AND SCOPE 
The Health Management Information System (HMIS) is also commonly referred to as 
a Routine Health Information System (RHIS). In the DPI-H reference architecture the 
HMIS sits in the business services layer; it is not a foundational component but a 
shared operational service that depends on foundational components — particularly 
the Lifelong Health Record (LHR), the Core Registries for Health, and the 
Terminology Service — to function. Analytics capabilities are treated as integral to 
the HMIS, consistent with the architecture's principle that the HMIS is the primary 
vehicle for deriving population-level and programme-level insight from data already 
captured through shared infrastructure. 
 
5 
1  WHAT IT IS 
 
6 
The Health Management Information System is a governed, sharedapplication component responsible for 
7 
the systematic collection, aggregation, analysis, and dissemination of population-level and facility-level 
8 
health data to support routine monitoring, programme performance measurement, strategic planning, 
9 
health services commissioning, and public health decision-making. It consolidates data from the Lifelong 
10 
Health Record (LHR), clinical systems, public health surveillance platforms, logistics systems, community 
11 
health programmes, and other sources, transforming person-level and facility-level data into health 
12 
indicators, dashboards, and reports that give health system managers, policymakers, and other relevant 
13 
stakeholders the information they need to assess health system performance, identify trends and gaps, and 
14 
guide resource allocation. 
15 
Operating as shared infrastructure rather than a programme-specific tool, the HMIS serves multiple health 
16 
domains simultaneously. Its defining architectural characteristic in the DPI-H ecosystem is that it is 
17 
designed to derive aggregate information from data already captured at the point of care and held in shared 
18 
infrastructure, rather than to collect data independently through parallel reporting mechanisms. This shift 
19 
— from a system that extracts information from health workers to one that derives information from data 
20 
that already exists — is what allows the HMIS to simultaneously reduce reporting burden, improve data 
21 
quality, and deliver more timely and comprehensive information than traditional approaches have been able 
22 
to provide. 
23 
Analytics capabilities are integral to the HMIS rather than constituting a separate component. The distinction 
24 
between data collection and aggregation on one hand, and analysis and visualisation on the other, is a 
25 
functional distinction within the HMIS — both are capabilities of the same component, not separate systems. 
26 
Both serve the same purpose — turning health data into health information — and both depend on the 
27 
same foundational data infrastructure. The DPI-H reference architecture does not prescribe a single 
28 
implementation model; the HMIS may be implemented as a unified platform or as a set of interoperable 
29 
services, provided the functional outcomes described here are achieved. 
30 
 
31 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
32 
Health systems generate substantial volumes of data through the daily delivery of care — patient 
33 
encounters, diagnoses, treatments, laboratory results, immunisations, referrals, and community health 
34 
interactions. In the majority of health systems, this data does not flow naturally into the information that 
35 
 
 
211 
health system managers and policymakers need to make decisions. Health workers are instead required 
36 
to manually compile and submit reports, extracting from registers and patient records information that was 
37 
already captured at the point of care, reformatting it for each programme that requests it, and submitting it 
38 
through parallel channels that operate independently. The result is a system in which the people who deliver 
39 
care spend significant time producing information for those who manage it, while the information produced 
40 
is frequently incomplete, delayed, and difficult to compare across facilities, programmes, or time. 
41 
Without a governed, shared health management information capability, every health programme 
42 
establishes its own data collection, aggregation, and reporting infrastructure. The consequence is a 
43 
proliferation of parallel reporting systems, each placing its own demands on facilities and health workers, 
44 
each producing data in formats that resist integration, and each requiring separate maintenance and 
45 
technical support. The administrative burden of parallel reporting has been consistently identified in the 
46 
literature as one of the most significant barriers to data quality, health worker satisfaction, and the 
47 
productive use of health information at every level of the system. 
48 
When a governed HMIS is in place, several outcomes become achievable.  
49 
• 
The reporting burden on the health workforce is reduced because aggregate health information is 
50 
derived from data already captured at the point of care through shared infrastructure.  
51 
• 
Health system managers and policymakers receive timely, accurate, and comparable indicators 
52 
that reflect the current state of the health system, consistent across facilities and administrative 
53 
levels, and reliably comparable over time and across geographies.  
54 
• 
Cross-programme visibility allows health authorities to understand performance across disease 
55 
areas, population groups, and levels of care simultaneously.  
56 
• 
Evidence-based resource allocation becomes possible when ministries of health and finance have 
57 
access to current, credible performance data.  
58 
• 
Population-level analytical capabilities — the ability to detect trends, identify gaps, and monitor 
59 
programme outcomes — are available across the health system without requiring each programme 
60 
to build and maintain its own analytical infrastructure. 
61 
 
62 
3  CORE ATTRIBUTES 
 
63 
– Data collection and ingestion. Reception of health data through multiple channels, including 
64 
direct facility-based and community-based reporting, automated ingestion from the LHR and other 
65 
DPI-H components, and bulk import of structured datasets. Data derivation from shared 
66 
infrastructure is prioritised over parallel data collection from health workers wherever possible. 
67 
– Indicator definition and management. Maintenance of a configurable, versioned registry of 
68 
health indicators — including their definitions, numerators, denominators, disaggregation 
69 
dimensions, data sources, and calculation logic — aligned to national health strategies and 
70 
international reporting frameworks, with a governed change management process that preserves 
71 
comparability over time. 
72 
– Data aggregation and transformation. Aggregation of individual-level or facility-level data into 
73 
summary indicators at configurable levels of the administrative and health system hierarchy, 
74 
applying defined aggregation rules, periodicity, and data quality checks, enabling information to be 
75 
available at the level of granularity required by different users without separate data collection for 
76 
each level. 
77 
– Data quality assurance. Built-in validation rules, completeness checks, consistency checks, and 
78 
outlier detection that flag and support the resolution of data quality issues at the point of entry and 
79 
during aggregation, with structured feedback to contributing facilities and programmes so that 
80 
issues identified centrally can be resolved at source. 
81 
– Analysis and visualisation. Analytical tools and configurable dashboards enabling users to 
82 
explore data, generate charts and maps, perform trend analysis, compare performance across 
83 
 
 
212 
organisational units, and conduct ad hoc queries, making health information accessible and 
84 
actionable for users at all levels of the health system. 
85 
– Reporting and dissemination. Generation and distribution of standard and custom reports 
86 
aligned to national reporting requirements, donor frameworks, and international obligations, in both 
87 
human-readable and machine-readable formats, supporting timely flow of health information to all 
88 
stakeholders who depend on it for planning, accountability, and oversight. 
89 
– Geographic information integration. Integration of geographic data, linked to the Health Facility 
90 
Registry, to support spatial analysis, thematic mapping, and location-based comparison of health 
91 
indicators across administrative and service delivery boundaries. 
92 
– Programme and cohort tracking. Identification and tracking of defined patient or population 
93 
cohorts over time, enabling programme-specific performance monitoring and outcome evaluation 
94 
across disease areas without requiring each programme to maintain its own data collection 
95 
infrastructure. 
96 
– De-identification and privacy protection. Systematic de-identification of data presented for 
97 
aggregate analysis, reporting, and secondary use, in accordance with national data protection 
98 
regulations, ensuring that population-level insight is delivered without exposing individual health 
99 
information. 
100 
– Secondary use and research support. Provision of mechanisms for making de-identified, 
101 
aggregate, or anonymised datasets available for approved secondary uses — including 
102 
operational research, health system evaluation, and academic study — subject to appropriate 
103 
governance and ethical review. 
104 
– Interoperability and data exchange. Standardised exchange of data with other DPI-H 
105 
components — including the Lifelong Health Record, the Public Health Surveillance Platform, the 
106 
Terminology Service, and logistics systems — using agreed data standards and integration 
107 
profiles. 
108 
 
109 
4  HOW IT CONNECTS 
 
110 
The HMIS occupies a distinctive position in the DPI-H architecture: it is a major consumer of data from 
111 
foundational DPI-H components and a primary producer of information for health system management and 
112 
policy.  
113 
The Lifelong Health Record is the primary source of person-level clinical data from which the HMIS 
114 
derives aggregate health indicators. Rather than requiring facilities and health workers to submit the same 
115 
data through parallel reporting channels, the HMIS draws on data already captured at the point of care and 
116 
held in the LHR, de-identifying and aggregating it in accordance with defined indicator logic. This 
117 
relationship is central to the architecture's principle of capturing data once and using it many times, and is 
118 
what distinguishes the HMIS in a DPI-H ecosystem from traditional routine health information systems. 
119 
The Client Registry provides the person identity foundation that enables the HMIS to correctly attribute 
120 
clinical data to individuals before aggregation, supporting cohort identification, programme enrolment 
121 
tracking, and the accurate calculation of population denominators for health indicators. The HMIS does not 
122 
hold personal identifiers in its aggregate outputs but depends on the Client Registry to ensure that the 
123 
person-level data it draws from is correctly linked before de-identification occurs. 
124 
The Health Facility Registry provides authoritative references for the facilities from which health data 
125 
originates, enabling the HMIS to aggregate indicators at facility, district, regional, and national levels of the 
126 
administrative hierarchy. Facility attributes including location, type, ownership, and service delivery capacity 
127 
support geographic analysis, thematic mapping, and the comparison of indicators across facility categories. 
128 
The Terminology Service ensures that clinical data drawn from the LHR and other source systems carries 
129 
consistent coded meaning when ingested by the HMIS. Aggregate indicators depend on the semantic 
130 
consistency of the underlying data; without governed terminology, the same clinical concept recorded with 
131 
different codes in different systems would be aggregated incorrectly or incompletely. 
132 
 
 
213 
The Health Workforce Registry provides data on workforce distribution, deployment, and composition of 
133 
health worker types and cadres, that the HMIS uses to produce workforce-related health indicators, 
134 
including staffing ratios, health worker density, and deployment gaps across administrative units. These 
135 
indicators feed into national health workforce planning and international reporting frameworks including the 
136 
WHO National Health Workforce Accounts. 
137 
The HMIS and the Public Health Surveillance Platform (PHSP) are complementary but distinct. The 
138 
HMIS aggregates routine health indicators from facility-level reporting and the LHR to support programme 
139 
monitoring and strategic planning. The PHSP focuses on the detection, investigation, and response to 
140 
public health threats through event-based and case-level surveillance. The two exchange data 
141 
bidirectionally: the HMIS provides aggregate indicators that inform surveillance baselines and trend 
142 
analysis, while the surveillance platform contributes case-level and outbreak data that enriches the HMIS's 
143 
picture of health system performance during public health events. Where boundaries between the two are 
144 
unclear, countries should define them through their national health information architecture rather than 
145 
relying on a universal demarcation. 
146 
The Computable Decision Support Engine draws on aggregate performance data and population-level 
147 
indicators from the HMIS to inform the updating and validation of clinical rules and guidelines. Population-
148 
level patterns detected through the HMIS — such as shifts in disease burden, treatment outcomes, or 
149 
screening coverage — can trigger the review and refinement of decision support logic. The relationship is 
150 
primarily unidirectional, with the HMIS informing knowledge governance processes that the CDSE 
151 
operationalises at the point of care. 
152 
The Logical Information Model Repository (LIMR) provides the structural definitions that govern how 
153 
data ingested by the HMIS is organised and interpreted. Consistent data structures across contributing 
154 
systems are a prerequisite for reliable indicator aggregation; the LIMR ensures that the data the HMIS 
155 
receives conforms to the logical models against which its indicator calculations are defined, and that 
156 
changes to those models are managed in a coordinated way rather than introducing silent inconsistencies 
157 
into aggregate outputs. 
158 
 
159 
5  FUNCTIONAL REQUIREMENTS 
 
160 
Requirements are grouped by business process and draw on the OpenHIE HMIS specification (HMISF-1 
161 
to HMISF-7; HMISWF-1) and the broader DPI-H architectural context. The DPI-H reference architecture 
162 
extends OpenHIE significantly: the OpenHIE HMIS specification describes only one Required requirement 
163 
(HMISF-1) and six Recommended. The DPI-H extensions reflect the broader role of the HMIS as shared 
164 
infrastructure in a DPI-H ecosystem, where its integration with the LHR, its analytics capabilities, its de-
165 
identification obligations, and its secondary use governance are architecturally material. Where a 
166 
requirement extends beyond OpenHIE, this is noted. 
167 
 
168 
# 
Business process 
Functional requirement 
Status 
DATA COLLECTION AND INGESTION 
1 
Integrated health 
data management · 
HMISF-1 
Data store for integrated health system data.  The 
HMIS shall act as a governed datastore for integrated 
health system data drawn from multiple sources, 
providing the information needed for decision-making 
across all levels of the health system. (HMISF-1 — 
Required) 
Required 
2 
Data ingestion · 
HMISF-2 
Facility and community-based data entry.  The HMIS 
should provide mechanisms — preferably web-based and 
mobile-compatible — for direct data entry by facility-
based and community-based health workers, supporting 
Recommended 
 
 
214 
# 
Business process 
Functional requirement 
Status 
reporting in contexts where automated data derivation 
from the LHR is not yet available. (HMISF-2) 
3 
Data ingestion · 
HMISF-4 
Automated data import from other systems.  The 
HMIS should provide standard interfaces for the 
automated import of data from other systems, including 
the LHR and the PHSP, using agreed data standards 
such as ADX and FHIR, prioritising derivation from data 
already captured at the point of care over parallel 
reporting from health workers. (HMISF-4) 
Recommended 
4 
Data ingestion 
Terminology validation at ingestion.  The HMIS should 
validate coded data ingested from the LHR and other 
source systems against the Terminology Service, 
ensuring that clinical codes used in indicator calculations 
are semantically consistent across contributing systems, 
and should flag or reject contributions containing 
unrecognised or deprecated codes for review. 
Recommended 
INDICATOR MANAGEMENT 
5 
Performance 
monitoring 
Indicator definition and versioned management.  The 
HMIS shall maintain a configurable, versioned registry of 
health indicators including their definitions, numerators, 
denominators, disaggregation dimensions, data sources, 
calculation logic, and lifecycle states, aligned to national 
and international reporting frameworks. 
Required 
6 
Performance 
monitoring 
Indicator change management.  The HMIS shall 
support a governed change management process for 
indicator 
definitions, 
including 
versioning, 
impact 
assessment, stakeholder notification, and backwards 
compatibility management, ensuring that changes to 
indicator definitions do not compromise the comparability 
of historical data. 
Required 
DATA QUALITY ASSURANCE 
7 
Data quality · 
HMISF-3 
Data quality and validation tools.  The HMIS should 
provide mechanisms to improve the quality and validity of 
data, 
including 
smart 
forms, 
validation 
rules, 
completeness checks, consistency checks, and outlier 
detection, to flag and support the resolution of data quality 
issues at the point of entry and during aggregation. 
(HMISF-3) 
Recommended 
8 
Data quality 
Structured quality feedback.  The HMIS should 
generate structured feedback to contributing facilities and 
programmes identifying specific data quality issues for 
resolution, and should maintain records of data quality 
performance over time to support supervisory oversight 
and accountability. 
Recommended 
AGGREGATION AND ANALYSIS 
 
 
215 
# 
Business process 
Functional requirement 
Status 
9 
Routine reporting 
Data aggregation and transformation.  The HMIS shall 
aggregate individual-level or facility-level data into 
summary indicators at configurable levels of the 
administrative and health system hierarchy, applying 
defined aggregation rules, periodicity, and data quality 
checks, and shall support concurrent production of 
indicators at multiple levels of granularity from the same 
underlying dataset. (HMISF-7) 
Required 
10 Programme 
monitoring 
Programme and cohort tracking.  The HMIS should 
support the identification and tracking of defined patient 
or population cohorts over time, enabling programme-
specific performance monitoring and outcome evaluation 
across disease areas without requiring each programme 
to maintain its own separate data collection and reporting 
infrastructure. 
Recommended 
11 Performance 
analysis · HMISF-7 
Analysis and visualisation.  The HMIS should offer 
analytical tools and configurable dashboards that allow 
users to explore data, generate charts and maps, perform 
trend 
analysis, 
compare 
performance 
across 
organisational units, and conduct ad hoc queries, 
including through a flexible analytics API, without 
requiring specialised technical skills. (HMISF-7) 
Recommended 
12 Geographic 
analysis · HMISF-5 
· HMISF-6 
Geographic information integration.  The HMIS should 
support the use of an accurate list of health facilities and 
their geographic and administrative distribution, linked to 
the Health Facility Registry, to support spatial analysis, 
thematic mapping, and location-based comparison of 
health indicators. (HMISF-5; HMISF-6) 
Recommended 
REPORTING AND DISSEMINATION 
13 Routine reporting 
Standard and custom reporting.  The HMIS shall 
support the generation and distribution of standard and 
custom 
reports 
aligned 
to 
national 
reporting 
requirements, donor frameworks, and international 
obligations, in both human-readable and machine-
readable formats. 
Required 
14 Transparency 
Public dissemination of aggregate indicators.  The 
HMIS should support the public dissemination of 
aggregate, de-identified health indicators in accordance 
with the applicable governance framework, consistent 
with a default position of openness for population-level 
health data. 
Recommended 
PRIVACY AND SECONDARY USE 
15 Data protection 
De-identification and privacy protection.  The HMIS 
shall ensure that data presented for aggregate analysis, 
reporting, and secondary use is de-identified in 
accordance with nationally defined standards and 
applicable data protection regulations, including in 
contexts where small population sizes or rare conditions 
Required 
 
 
216 
# 
Business process 
Functional requirement 
Status 
create heightened re-identification risk. De-identification 
standards shall be documented, audited, and reviewed as 
the granularity of outputs evolves. 
16 Secondary data use 
Secondary use and research support.  The HMIS 
should provide mechanisms for making de-identified, 
aggregate, or anonymised datasets available for 
approved secondary uses — including operational 
research, health system evaluation, and academic study 
— subject to the formal governance framework, ethical 
review requirements, and data sharing agreement 
conditions defined at national level. 
Recommended 
INTEGRATION AND INTEROPERABILITY 
17 System integration 
Standards-based data exchange.  The HMIS shall 
support standardised data exchange with other DPI-H 
components — including the LHR, Public Health 
Surveillance Platform, Terminology Service, LIMR, and 
logistics systems — using agreed data standards and 
integration profiles, enabling the derivation of aggregate 
health indicators from shared infrastructure and avoiding 
parallel data collection that increases reporting burden. 
Required 
GOVERNANCE AND ACCESS CONTROL 
18 Governance 
Role-based access control.  The HMIS shall enforce 
role-based access controls governing who may enter 
data, validate data, access analytics, configure indicators, 
and administer the system, aligned to organisational roles 
across the health system hierarchy and consistent with 
the access management principles established in the 
national data governance framework. 
Required 
19 Governance 
Audit 
logging. 
 
The 
HMIS 
shall 
maintain 
a 
comprehensive 
audit 
log 
of 
data 
submissions, 
modifications, approvals, indicator configuration changes, 
secondary use data releases, and system administration 
actions, recording the actor, action, affected data or 
configuration, and timestamp. 
Required 
20 Governance 
Notification and workflow management.  The HMIS 
should support configurable notifications and workflow 
triggers — including alerts for overdue reports, data 
quality threshold breaches, indicator target exceedances, 
and pending approvals — to prompt timely action from 
responsible users at all levels of the health system 
hierarchy. 
Recommended 
CROSS-CUTTING 
21 Low-resource 
settings 
Offline and low-connectivity support.  The HMIS 
should support data entry and basic analysis in low-
connectivity and offline environments, with reliable 
synchronisation to the central platform when connectivity 
is restored, ensuring that facilities in remote and under-
Recommended 
 
 
217 
# 
Business process 
Functional requirement 
Status 
resourced settings can participate in routine health 
reporting. 
22 Performance · 
Availability 
Performance and availability.  The HMIS shall be 
designed for high availability, given that health workers at 
all levels of the health system depend on it for routine 
reporting and that policymakers depend on its outputs for 
time-sensitive 
planning 
and 
resource 
allocation 
decisions. 
Required 
 
169 
Note: Requirements align with and extend the OpenHIE HMIS specification (https://guides.ohie.org/arch-
170 
spec/openhie-component-specifications-1/openhie-health-management-information-system-hmis). The 
171 
DPI-H reference architecture extends OpenHIE in five principal respects: (1) LHR derivation is introduced 
172 
as the preferred data sourcing approach; (2) indicator versioning and change management are made 
173 
explicit Required requirements; (3) de-identification is made an explicit Required requirement; (4) 
174 
analytics capabilities are integrated into the HMIS rather than treated as a separate component; and (5) 
175 
several OpenHIE Recommended requirements are elevated to Required to reflect the HMIS's role as 
176 
shared health information infrastructure. The OpenHIE HMIS workflow requirement HMISWF-1 (Validate 
177 
and Save Aggregate Data) is the primary workflow underpinning requirements 1–4 and 7–8. 
178 
GOVERNANCE 
Governance of the HMIS follows the cross-cutting governance framework in Section 
3.4 of the guidance document. Component-specific considerations include:  
 
(1) Institutional ownership: Stewardship of the HMIS should be vested in a health 
authority with a mandate that spans all health programmes rather than being confined 
to any single disease area or vertical initiative. Independence from individual 
programme interests is essential because the HMIS serves the health system as a 
whole and measures the performance of those very programmes. Ownership should 
not be delegated to a vendor, donor-funded project, or programme-specific entity.  
(2) Indicator governance: The definition, calculation, and management of health 
indicators is a governance function, not merely a technical one. Countries should 
establish a formal indicator governance process through which new indicators are 
proposed, reviewed for clinical and epidemiological validity, aligned to reporting 
frameworks, and approved. Changes to indicator definitions should be managed 
through a versioned process that preserves comparability over time and notifies 
stakeholders.  
(3) Data quality accountability: Clear accountability for data quality at every level of 
the reporting hierarchy — from the contributing facility to the national publishing 
authority — should be established, with feedback mechanisms through which quality 
issues identified during aggregation are communicated back and resolved.  
(4) Multi-stakeholder governance: The HMIS serves multiple health programmes 
simultaneously. Countries should establish a multi-stakeholder governance body 
including representatives from all major health programmes, ministry of finance, 
development partners, and civil society, with clear decision rights and accountability 
to the national health authority.  
(5) Financing: The HMIS is shared infrastructure that serves all health programmes 
simultaneously, and its financing should reflect that shared character. Countries 
should avoid models in which the HMIS is financed entirely through project-specific 
donor funding tied to individual programme reporting requirements, as these create 
incentives that fragment the indicator portfolio and undermine institutional 
independence. 
179 
 
 
218 
DPI-H Reference Architecture  |  Component Articulation 
1
