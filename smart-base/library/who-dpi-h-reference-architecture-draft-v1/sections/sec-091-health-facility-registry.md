---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-091-health-facility-registry
section_title: "Health Facility Registry"
section_number: null
pages: 135-146
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
2 
Core Registries for Health  ·  DPI-H Foundational Layer   
3 
 
4 
ARCHITECTURE 
PLACEMENT 
AND KEY 
DISTINCTION 
The Health Facility Registry is a core DPI-H foundational component — the national 
authoritative source of identity, location, and classification data for health facilities. 
It is closely related to two other concepts that warrants distinction. The Master 
Facility List (MFL) is the standardised dataset that the Health Facility Registry 
produces and governs — the registry is the technology; the MFL is the data. The 
Common Geo-Registry (CGR) is a cross-sectoral foundational component that 
manages geographic objects (administrative units, settlements, boundaries) with 
temporal integrity. The Health Facility Registry would depend on a CGR (where it 
exists) for its geographic reference data but is not the same thing: the CGR governs 
geography; the Health Facility Registry governs health facilities positioned within 
that geography. 
 
5 
1  WHAT IT IS 
 
6 
The Health Facility Registry is the national authoritative source of identity, location, and classification data 
7 
for all facilities, locations, and organisations through which health services are delivered or that are of direct 
8 
relevance to the Ministry of Health’s mandate. This scope is intentionally broader than a list of permanent 
9 
clinical facilities. It encompasses: permanent clinical facilities such as hospitals, health centres, clinics, 
10 
pharmacies, and laboratories; logistics facilities such as warehouses and distribution centres; community 
11 
health posts and outreach sites; temporary and campaign facilities such as vaccination posts, emergency 
12 
field hospitals, and mobile clinics established for specific programmes or emergencies; and, where 
13 
nationally defined, other locations whose activities intersect with public health responsibilities. The registry 
14 
covers facilities across all sectors: public, private, faith-based, and NGO. A single standardised, uniquely 
15 
identified, and centrally governed record is maintained for each facility, providing the common reference 
16 
against which clinical, financial, logistical, and administrative systems can consistently identify and locate 
17 
the places where health services are delivered. 
18 
The registry and the Master Facility List are closely related but architecturally distinct. The Health Facility 
19 
Registry is the system — the technology, governance processes, and workflows that collect, validate, 
20 
maintain, and publish facility data. The Master Facility List (MFL) is the output of that system: the 
21 
standardised, uniquely coded list of all active facilities that the registry produces and keeps current. A 
22 
country may have an MFL without having a formal Health Facility Registry; the DPI-H reference architecture 
23 
calls for the registry infrastructure that makes the MFL reliable, interoperable, and sustainably maintained. 
24 
An important architectural principle underlies the design of the Health Facility Registry: facilities, buildings, 
25 
locations, and organisations are distinct entities that should not be conflated. A facility is a defined health 
26 
service delivery unit — it has a scope of services, an operator, and a governance status. A building is a 
27 
physical structure: a facility may operate across multiple buildings, or multiple facilities may share one 
28 
building. A location is a geographic reference: a facility may have a primary location and satellite locations 
29 
or move entirely. An organisation is the legal entity that operates the facility. Keeping these distinctions 
30 
clear matters for practical registry design. A facility that relocates to a new building retains its identity and 
31 
service history. A temporary vaccination post is a distinct facility record with its own lifecycle, linked to the 
32 
organising entity but not absorbed into a permanent facility’s record. An organisation that operates multiple 
33 
facilities appears in a separate organisational register but is linked to many facility records. These 
34 
distinctions also underpin the principle of referential integrity: each entity should be managed in one 
35 
authoritative place and referenced everywhere else, not duplicated across systems. 
36 
 
 
125 
The geographic dimension of the Health Facility Registry deserves particular attention. Facilities exist at 
37 
specific geographic locations within administrative and reporting hierarchies that change over time — 
38 
districts split, boundaries are redrawn, new administrative levels are created. A Health Facility Registry that 
39 
treats geographic location as a static attribute quickly becomes unreliable for aggregate reporting, 
40 
particularly when data from different periods needs to be compared across changing administrative 
41 
boundaries. Managing this temporal dimension — knowing not just where a facility is now but which 
42 
administrative unit it belonged to on a given date — is one of the most technically and institutionally 
43 
demanding aspects of facility data governance. 
44 
 
45 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
46 
Effective health service delivery, financing, and planning all depend on knowing where health facilities are, 
47 
what they do, and whether they are operational. Without a reliable, interoperable health facility registry, 
48 
every system in the health ecosystem maintains its own local version of the facility list — and those lists 
49 
may diverge. For example, a logistics management system may route supplies to facilities that may not 
50 
always match to the claims system's provider identifiers; there may be difficulty in attributing a case report 
51 
to the correct administrative unit because its facility list references a district that was divided in a prior 
52 
period; and health system managers may face challenges with reimbursing services at facilities whose 
53 
operational status have not been updated since the last manual audit. 
54 
These examples reflect conditions of health systems that lack a governed health facility registry. The 
55 
consequences, not merely administrative inconvenience, result in reduced ability to allocate resources 
56 
equitably, reduced visibility of where the health system is and is not functioning, and reduced capacity to 
57 
respond to health emergencies. During the COVID-19 pandemic, the absence of geolocated, current facility 
58 
data in many countries made it materially harder to plan vaccine delivery, identify capacity gaps, and route 
59 
supplies. This gap was a key motivation for the WHO Geolocated Health Facilities Data initiative, which 
60 
notes that the pandemic exposed urgent gaps in countries’ ability to locate health facilities, impeding 
61 
equitable access to diagnostics, therapeutics, and vaccines (WHO, Geolocated Health Facilities Data 
62 
initiative, 2022; https://www.who.int/data/GIS/GHFD ). 
63 
When a Health Facility Registry is in place, current and maintained, the entire health information 
64 
infrastructure gains a stable geographic anchor with benefits to health service users and health systems 
65 
stakeholders alike; and while it does not deliver these outcomes directly, it provides the stable reference 
66 
on which they become possible. For example: 
67 
• 
Accurate attribution of health workers to their deployed facilities, supporting workforce planning and 
68 
accountability.  
69 
• 
Routing and delivery of health products and commodities to verified locations.  
70 
• 
Validation of health coverage scheme claims against known, empanelled providers.  
71 
• 
Modelling of service coverage by planners against population distribution.  
72 
• 
Aggregation of case data across administrative hierarchies for public health surveillance, with 
73 
confidence that the boundaries used are consistent over time.  
74 
 
75 
3  CORE ATTRIBUTES 
 
76 
– Facility identity and master record management. Creation, maintenance, and publication of 
77 
authoritative identity records for all facilities within the scope of the Ministry of Health's mandate — 
78 
including permanent clinical facilities, logistics facilities, temporary and campaign facilities, and 
79 
other locations nationally designated as relevant to public health oversight — across all sectors 
80 
and facility types, with a unique, persistent, nationally assigned facility identifier as the canonical 
81 
cross-system reference key. 
82 
 
 
126 
– Multi-axial hierarchy management. Definition and maintenance of three distinct types of location 
83 
hierarchy, each of which should be managed independently because they frequently differ: (1) the 
84 
administrative hierarchy, reflecting political and health administrative divisions used for reporting 
85 
and resource allocation; (2) the operational or health-specific hierarchy, reflecting operational 
86 
districts, programme reporting structures, and health system management units that may not align 
87 
with political boundaries; and (3) the referral and catchment hierarchy, reflecting the referral chains 
88 
and population catchment areas that define how patients flow between facilities. Hierarchical 
89 
relationships should be defined as explicit linkages with periods of validity, not as intrinsic 
90 
attributes of the facility record, to accommodate boundary and restructuring changes over time. 
91 
– Catchment area management. Capture and maintenance of each facility's catchment area, either 
92 
as an enumeration of communities or villages served or as a geographic boundary, enabling equity 
93 
analysis and population-based coverage measurement. 
94 
– Geographic location management with temporal integrity. Maintenance of precise geographic 
95 
coordinates for each facility and their linkage to the relevant administrative units in each hierarchy, 
96 
with full period-of-validity records so that any system can determine which administrative unit a 
97 
facility was assigned to on any given historical date. This attribute depends on — and may be 
98 
synchronised with — a Common Geo-Registry or equivalent geospatial reference source where 
99 
available at the foundational DPI level. 
100 
– Facility status and service change management. Management of facility operational status 
101 
changes (opening, closure, temporary closure, service additions or removals) with effective dates, 
102 
enabling consuming systems to reflect current service availability and enabling retrospective 
103 
analysis of service history. 
104 
– Configurable attribute schema and data dictionary governance. Ability to define, extend, and 
105 
evolve the set of attributes captured per facility record, referenced against the canonical schema 
106 
maintained in a Logical Information Model Repository, and governed through a defined change 
107 
management process. 
108 
– Multi-identifier cross-referencing. Maintenance of all known identifiers assigned to a facility 
109 
across different systems — including location codes assigned by aggregate reporting and 
110 
surveillance platforms, Global Location Numbers (GLNs), supply chain location codes, provider 
111 
codes for health coverage schemes, and others — as cross-references to the canonical facility 
112 
identifier, enabling identity resolution across systems that use different local identifier schemes. 
113 
– Standards-based access and interoperability. 
114 
● 
Mobile and temporary facility management. Support for facilities that operate temporarily, 
115 
move location, or are established for specific campaigns or emergencies — including vaccination 
116 
posts, emergency field hospitals, and mobile clinics — with full lifecycle management (activation, 
117 
relocation, deactivation) and explicit linkage to the permanent facilities or organising entities 
118 
responsible for them. Temporary facility records are distinct from permanent records and should 
119 
be managed accordingly, including retrospective preservation of the services delivered and 
120 
populations served during their active period. 
121 
● 
Standards-based access and interoperability. Exposure of facility data through standards-
122 
based APIs enabling any conformant system to query, retrieve, and receive updates on facility 
123 
records in a consistent and portable manner. 
124 
 
125 
4  HOW IT CONNECTS 
 
126 
Relationship with a Common Geo-Registry 
127 
The most architecturally significant dependency of the Health Facility Registry is on geospatial infrastructure 
128 
— specifically a Common Geo-Registry (CGR); a cross-sectoral foundational component that sits outside 
129 
the health sector and serves the whole of government50. A CGR would manage geographic objects — 
130 
 
50 https://healthgeolab.net/DOCUMENTS/Guidance_Common_Geo-registry_Ve2.pdf 
 
 
127 
administrative units, settlements, boundaries, and their hierarchical relationships — with full temporal 
131 
integrity: it would record not just current geographies but historical changes, enabling any system to query 
132 
the state of a geography on any given date. 
133 
The Health Facility Registry would depend on the CGR for two things: 
134 
• 
First, it would use CGR-assigned administrative unit identifiers as the geographic anchors for its 
135 
hierarchy linkages — the facility would not be assigned to a named district by the registry itself, but 
136 
to the CGR's persistent identifier for that district, which resolves correctly even after boundaries 
137 
change.  
138 
• 
Second, when the CGR records a boundary change such as a district splitting, merging of counties 
139 
or creation of a new administrative level, it would notify dependent registries, including the Health 
140 
Facility Registry, so that affected facility linkages can be reviewed and updated. This notification 
141 
and propagation model, consistent with the approach described in the Health GeoLab Collaborative 
142 
Common Geo-Registry Guidance Version 21, is the mechanism that would prevent geographic 
143 
reference data from silently becoming stale.  
144 
This embodies the principle of authoritative sources and referential integrity: geographic data should be 
145 
maintained once in a CGR and referenced by the Health Facility Registry — not duplicated — so that a 
146 
change in one place propagates correctly to all dependent systems rather than creating divergent copies 
147 
that need to be manually reconciled. 
148 
Where a functioning CGR is not available at the foundational level — as is the case in many countries today 
149 
— it is important that the Health Facility Registry manages its geographic reference data internally, 
150 
accepting the limitations this creates for multi-system geographic consistency. This is a common practical 
151 
situation that the reference architecture acknowledges, as in many cases, the health sector is unable to  
152 
wait for foundational geospatial DPI to be fully developed, but its implementations should be designed with 
153 
the expectation of eventual integration with a CGR as that foundational layer matures. 
154 
 
155 
Relationship with other DPI-H components 
156 
• 
The Health Facility Registry is one of the three master data pillars — product, facility, provider — that 
157 
together support all supply chain transactions. The Health Facility Registry provides the location data, 
158 
the Product Registry provides the commodity data, and the Health Workforce Registry provides the 
159 
provider data. Together they enable end-to-end attribution. The supply chain also depends on it for 
160 
delivery routing and cold chain facility classification 
161 
• 
The Health Workforce Registry is the Health Facility Registry's most direct operational peer. Health 
162 
workers are affiliated with facilities; facilities are served by health workers. The IHE Mobile Care 
163 
Services Discovery (mCSD) profile is designed to be queried across both components simultaneously, 
164 
enabling a system to ask 'which doctors are currently deployed at facilities in this district?' through a 
165 
single standards-based query. Implementations of both components should be designed for 
166 
compliance to standards such as mCSD to enable this joint query capability. 
167 
• 
Clinical and administrative systems all depend on the Health Facility Registry to attribute health events 
168 
to verified facility locations. For example, a clinical record is associated with the facility that created it 
169 
and a consent record notes which facilities have access to a patient's data. In each case the facility 
170 
identifier used should trace to a canonical record in the Health Facility Registry, not to a local code that 
171 
may be inconsistent with other systems. 
172 
• 
The Benefits Package Registry depends on the Health Facility Registry for provider empanelment — 
173 
determining which facilities are contracted to deliver services under a given benefit package, and at 
174 
what tier. Health coverage scheme claims systems, as functional/operational systems that consume 
175 
DPI-H components, similarly rely on verified facility data for claims validation.  
176 
• 
Financial management systems also depend on the Health Facility Registry for budget attribution and 
177 
payment routing.  
178 
 
 
128 
• 
The Terminology Service provides the standardised codes used for facility type, ownership category, 
179 
and service classification — ensuring that the same facility type means the same thing across all 
180 
systems that consume facility data. 
181 
 
182 
5  FUNCTIONAL REQUIREMENTS 
 
183 
Requirements are grouped by business process and draw on the OpenHIE Facility Registry specification 
184 
(FRF-1 to FRF-14; FRWF-1), expert feedback, the WHO/USAID MFL Resource Package, the UNICEF 
185 
Health Facility Registry Toolkit (2024), and WHO Geolocated Health Facilities Data initiative. Where 
186 
requirements extend or elevate beyond OpenHIE, this is noted. Several OpenHIE requirements are 
187 
adjusted: FRF-3 (minimum dataset) is elevated to Required given the WHO GHFD initiative's alignment; 
188 
FRF-6 (standards-based APIs) is elevated to Required; and versioning is elevated to Required to reflect 
189 
the expert consensus on its criticality for temporal data integrity. 
190 
 
191 
# 
Business process 
Functional requirement 
Status 
FACILITY RECORD MANAGEMENT 
1 
Facility registration · 
MFL maintenance 
Facility record creation and maintenance.  The Health 
Facility Registry shall support the creation, update, and 
maintenance of authoritative identity records for all health 
facilities, capturing the minimum dataset defined in 
Section 6 and assigning a unique, persistent, nationally 
assigned facility identifier at registration. (Extends FRF-3) 
Required 
2 
Data dictionary 
governance · FRF-1 
Configurable attribute schema.  The Health Facility 
Registry shall support the ability to create, define, and 
evolve the attributes and associated data dictionary for 
facility records, allowing countries to extend the schema 
to meet national context requirements. (FRF-1 — 
Required) 
Where a Logical Information Model Repository is in place, 
the facility schema should be referenced against and 
governed through the canonical schema maintained 
therein. (Recommended)  
Required 
3 
MFL maintenance · 
FRF-3 
Minimum dataset capture.  The Health Facility Registry 
shall support the collection of data covering a nationally 
defined minimum facility attributes dataset, including at 
minimum the signature domain (facility name, type, 
ownership, address, geographic coordinates, operational 
status, administrative linkage, unique identifier, contact 
information, and record date) and the service domain 
(services offered, HRH by cadre, operating hours, 
infrastructure 
attributes, 
and 
mapped 
identifiers). 
Countries should refer to internationally recognised 
guidance on minimum facility data requirements when 
defining their national dataset (see WHO/USAID Master 
Facility List Resource Package, 2018). (FRF-3 — 
elevated to Required in alignment with WHO GHFD 
initiative) 
Required 
4 
Status management 
· FRF-12 
Facility status and service change management.  The 
Health Facility Registry shall support the curation of 
Required 
 
 
129 
# 
Business process 
Functional requirement 
Status 
facility operational status changes — openings, closures, 
temporary closures, and changes to services offered — 
with effective dates, enabling consuming systems to 
reflect 
current 
service 
availability 
and 
enabling 
retrospective analysis of service history. (FRF-12) 
5 
MFL maintenance 
Multi-identifier cross-referencing.  The Health Facility 
Registry shall maintain cross-references between the 
canonical facility identifier and all known identifiers 
assigned to the facility by other systems, including but not 
limited to Global Location Numbers (GLNs — the GS1 
standard identifier for physical locations used in supply 
chain and cold chain systems), supply chain location 
codes, and health coverage scheme provider codes, 
enabling identity resolution across systems with different 
local identifier schemes. 
Required 
HIERARCHY AND GEOGRAPHIC MANAGEMENT 
6 
Hierarchy 
management · 
FRF-2 
Multi-axial hierarchy management.  The Health Facility 
Registry shall support the creation, definition, and 
maintenance of three distinct types of location hierarchy, 
each managed independently:  
(1) the administrative hierarchy, reflecting political and 
health administrative divisions used for reporting and 
resource allocation;  
(2) the operational or health-specific hierarchy, reflecting 
operational districts and programme reporting structures 
that may not align with political boundaries; and  
(3) the referral and catchment hierarchy, reflecting referral 
chains and catchment area assignments between 
facilities.  
 
The same facility shall be assignable to different positions 
in different concurrent hierarchies, and all hierarchy 
linkages shall carry periods of validity. (FRF-2 — 
Required; extended to name three hierarchy types 
explicitly) 
Required 
7 
Hierarchy 
management 
Hierarchy linkage with period of validity.  The Health 
Facility Registry shall define hierarchical relationships as 
explicit linkages between entities with defined periods of 
validity — start date and end date — rather than as 
intrinsic attributes of the facility record, so that the registry 
can correctly report which administrative unit a facility 
belonged to on any historical date. This is required for 
accurate 
aggregate 
reporting 
across 
changing 
geographic boundaries. 
Required 
8 
Hierarchy 
management 
Catchment area management.  The Health Facility 
Registry shall support the capture and maintenance of 
each facility's catchment area, either as an enumeration 
of communities or settlements served or as a geographic 
boundary reference, enabling population-based service 
coverage analysis and equity mapping. 
Recommended 
 
 
130 
# 
Business process 
Functional requirement 
Status 
9 
Geospatial 
management 
Geographic coordinate management.  The Health 
Facility Registry shall store and maintain verified 
geographic coordinates (latitude and longitude) for each 
facility to a defined precision standard, with the source 
and date of the coordinate record. Where a Common 
Geo-Registry or equivalent authoritative geospatial 
source is available, coordinate data shall be sourced from 
or cross-validated against it. 
Required 
10 Geospatial 
management 
Common Geo-Registry integration.  The Health Facility 
Registry shall support integration with a Common Geo-
Registry (CGR) or equivalent authoritative geospatial 
reference, consuming standardised administrative unit 
identifiers and receiving notifications when geographic 
boundaries or administrative unit assignments change, so 
that affected facility hierarchy linkages can be reviewed 
and updated. (Health GeoLab Collaborative CGR 
Guidance, Version 2) 
Recommended 
QUERY AND ACCESS 
11 Facility discovery · 
FRWF-1 
Query facility records.  The Health Facility Registry shall 
support querying and retrieval of facility records by 
identifier, name, type, ownership, administrative unit, 
geographic area, service type, and operational status, 
conformant with standards such as the IHE mCSD profile. 
(FRWF-1 — Required) 
Required 
12 Facility discovery · 
FRF-9 
Search by attribute.  The Health Facility Registry shall 
support the ability to search for facilities by any 
combination of attributes captured in the registry, 
returning ranked results and supporting partial-match 
queries on name and location fields. (FRF-9) 
Required 
13 Transparency · 
FRF-11 
Public access to facility information.  The Health 
Facility Registry shall support configurable public access 
to facility data relevant to the general population — 
including facility name, type, location, services offered, 
and operating hours — to enable patients, other health 
service users and communities to locate services. (FRF-
11) 
Recommended 
DATA VERSIONING AND AUDIT 
14 Versioning · Data 
integrity 
Full version history.  The Health Facility Registry shall 
maintain full version history for all facility records, 
including the history of attribute changes, operational 
status changes, hierarchy linkage changes, and 
geographic coordinate updates, with timestamps and 
attribution to the source system or user responsible for 
each change. Versioning is critical for running aggregate 
data correctly across changing hierarchies. (Extends 
OpenHIE; elevated to Required from implied status in 
FRF-1 and FRF-12) 
Required 
 
 
131 
# 
Business process 
Functional requirement 
Status 
15 Governance · Audit 
Audit logging.  The Health Facility Registry shall 
maintain a comprehensive audit log of all authoring 
actions, publication events, bulk import operations, 
access control changes, and status updates. 
Required 
GOVERNANCE AND ACCESS CONTROL 
16 Governance · FRF-
4 
Role-based access control.  The Health Facility 
Registry shall enforce role-based access control, 
supporting for example the roles of Master Administrator, 
Data 
Curator, 
and 
Health 
Officer, 
with 
distinct 
permissions for reading, writing, validation, publishing, 
and system administration. (FRF-4 — Required; FRF-5) 
Required 
17 MFL governance · 
FR-14 
Master Facility List alignment.  The Health Facility 
Registry shall align with or serve as the primary source 
for the national Master Facility List, ensuring that the 
registry's canonical records are the authoritative 
reference for all systems that consume facility identity 
data, and that any separately maintained MFL is either 
derived from or updated by the registry. (FR-14) 
Required 
INTEGRATION AND INTEROPERABILITY 
18 System integration · 
FRF-6 
Standards-based APIs.  The Health Facility Registry 
shall expose flexible, standards-based machine-readable 
APIs, preferably conformant with standards such as the 
IHE mCSD profile, enabling any conformant system to 
query, retrieve, and exchange facility data. APIs shall 
support joint queries combining facility and health worker 
data. (FRF-6 — elevated to Required) 
Required 
19 Data exchange · 
FRF-7 
Data push and pull to other systems.  The Health 
Facility Registry shall support the ability to push and pull 
facility data to and from other systems based on defined 
criteria, including bulk export in standard formats and 
event-driven synchronisation. (FRF-7) 
Recommended 
20 Data onboarding · 
FRF-8 
Bulk import.  The Health Facility Registry shall support 
bulk import of facility data from external sources, including 
ministry survey data, and other national data systems, 
with insert-or-update capability and import reporting. 
(FRF-8 — Required) 
Required 
CROSS-CUTTING 
21 System integration 
Subscription and notification.  The Health Facility 
Registry shall support subscription-based notification for 
consuming systems, enabling notification of facility record 
creation, attribute changes, operational status changes, 
hierarchy reassignments, and identifier additions or 
retirements. This is particularly important for downstream 
supply chain, health coverage schemes and surveillance 
systems that need to maintain current facility data. 
Recommended 
 
 
132 
# 
Business process 
Functional requirement 
Status 
22 Performance · 
Availability 
Performance and availability.  The Health Facility 
Registry shall be designed for high availability, given that 
facility identity and location data are referenced by 
operational systems across supply chain, clinical, 
financial, and surveillance domains. 
Required 
 
192 
Note: These requirements are consistent with and extend the OpenHIE Facility Registry specification 
193 
(FRF-1 to FRF-14; FRWF-1). The DPI-H reference architecture extends OpenHIE in six respects: (1) 
194 
multi-axial hierarchy management is made explicit; (2) hierarchy linkages with period of validity are 
195 
introduced as a distinct requirement; (3) versioning is elevated to Required; (4) standards-based APIs 
196 
(FRF-6) are elevated to Required; (5) Common Geo-Registry integration is introduced as a new 
197 
requirement; and (6) minimum dataset capture (FRF-3) is elevated to Required in alignment with the 
198 
WHO GHFD initiative. Sources: OpenHIE FR Specification; WHO/USAID MFL Resource Package; WHO 
199 
Geolocated Health Facilities Data initiative; UNICEF Health Facility Registry Toolkit (2024); Health 
200 
GeoLab Collaborative Common Geo-Registry Guidance Version 2. 
201 
6  DATA REQUIREMENTS 
 
202 
The following table defines the minimum dataset for a facility record in the Health Facility Registry. It draws 
203 
on the WHO/USAID Master Facility List Resource Package (WHO, 2019)51, the WHO Geolocated Health 
204 
Facilities Data initiative minimum data elements (Name, Type, Location, Unique ID)52, and expert feedback. 
205 
The dataset is divided into a signature domain (core identity attributes) and a service domain (operational 
206 
and service attributes). All signature domain elements marked Mandatory should be present for a record to 
207 
be published as active. 
208 
Note: This is illustrative rather than an exhaustive list and countries can extend based on needs. 
209 
 
210 
Data element 
Description 
Status 
Facility unique 
identifier 
Nationally assigned unique, persistent, non-intelligent identifier 
for the facility, used as the canonical cross-system reference key. 
Mandatory 
Facility name 
Official registered name of the facility and common/local name 
where different. 
Mandatory 
Facility type 
Classification of the facility by service level and type (e.g., national 
hospital, district hospital, health centre, dispensary, pharmacy, 
laboratory, mobile clinic), and for supply chain purposes by 
logistics facility type (warehouse, distribution centre, wholesaler), 
using a nationally defined and terminologically governed typology. 
The facility type classification shall cover both clinical and logistics 
facility types to support end-to-end supply chain management. 
Mandatory 
Facility ownership 
and managing 
authority 
Legal ownership category (public, private for-profit, private not-
for-profit, faith-based, NGO, community) and name of the 
managing authority. 
Mandatory 
Physical address 
Physical location address including administrative unit hierarchy 
from national to facility level. 
Mandatory 
 
51 https://iris.who.int/server/api/core/bitstreams/d895078b-b45b-4b2c-b216-b82c07b2d4f7/content  
52 https://www.who.int/news-room/questions-and-answers/item/global-health-facilities-database  
 
 
133 
Data element 
Description 
Status 
Geographic 
coordinates 
Latitude and longitude of the facility to a defined precision 
standard, enabling geospatial analysis and routing. Sourced or 
verified against a Common Geo-Registry or equivalent 
authoritative geospatial source where available. 
Mandatory 
Administrative 
hierarchy linkage 
Explicit linkage of the facility to its position in the relevant 
administrative hierarchy (health administrative, supply chain, 
political) at each applicable level, with period of validity for each 
linkage. 
Mandatory 
Facility catchment 
area 
Definition of the population served by the facility, either as a list of 
communities or villages, or as a geographic boundary polygon. 
Critical for equity analysis and service coverage mapping. 
Recommended 
Catchment area 
population size 
Estimated total population residing within the facility’s catchment 
area, sourced from the most recent census or population 
projection. Used for campaign planning, product quantification, 
and service coverage analysis. 
Recommended 
Operational status 
Current operational status (open, closed, temporarily closed, 
under construction) with effective date of current status. 
Mandatory 
Record date 
Date the record was created and date of last update. 
Mandatory 
Contact 
information 
Telephone number(s), email address, and where applicable 
postal address. 
Mandatory 
Common and 
mapped identifiers 
All known identifiers assigned to the facility by other systems, 
maintained as cross-references to the canonical identifier. 
Mandatory 
Type of services 
offered 
Services available at the facility (e.g., emergency care, ANC, 
laboratory, HIV treatment, TB, surgery, pharmacy), using 
standardised service classification codes from the Terminology 
Service. 
Recommended 
Human resources 
for health — 
numbers by cadre 
Count of health workers deployed at the facility by cadre, linked 
to the Health Workforce Registry. Supports workforce distribution 
analysis. 
Recommended 
Infrastructure 
attributes 
Key infrastructure indicators including availability of electricity, 
water, sanitation, and internet connectivity. Relevant for cold 
chain siting, telemedicine eligibility, and service readiness 
assessments. 
Recommended 
Opening and 
closing times 
Regular operating hours, including any service-specific hours that 
differ from general hours. 
Recommended 
 
211 
Notes: (1) The WHO GHFD initiative identifies four minimum data elements for any global health facility 
212 
record: Name, Type, Location (geographic coordinates), and Unique ID. These four are the minimum for 
213 
international comparability. All other elements in the signature domain are required for full national registry 
214 
functionality. (2) Facility type classification should be governed through the Terminology Service, not as a 
215 
free-text field, to ensure cross-system comparability. (3) Administrative hierarchy linkages should reference 
216 
the canonical identifiers from the Common Geo-Registry (where available) or national administrative unit 
217 
register, not locally assigned text names. (4) The service domain elements are marked Recommended; 
218 
their completeness depends on country capacity and use case requirements. 
219 
 
 
134 
GOVERNANCE 
Governance of the Health Facility Registry follows the cross-cutting governance 
framework in Section 3.4 of the guidance document. Component-specific 
considerations include:  
 
(1) The Health Facility Registry typically has multiple institutional data contributors — 
Ministries of Health, subnational health administrations, professional councils, and 
faith-based and NGO facility networks — each with legitimate authority over different 
subsets of facility data. The governance framework should clearly define which 
institution is the steward for each facility type, what verification is required before a 
new facility can be published, and what approval is needed before a closure is 
recorded. Faith-based and private sector facility data is a particular challenge in many 
countries. In several sub-Saharan African and South Asian countries, a substantial 
proportion of health services — in some cases exceeding 30% of total service delivery 
— is provided by faith-based or private sector facilities that maintain their own 
administrative hierarchies (WHO/USAID MFL Resource Package, 2019). A national 
Health Facility Registry that covers only public sector facilities would not fulfil its full 
function.  
(2) Hierarchy changes require coordinated cross-institutional governance. When a 
district is divided, every system that aggregates data by district — surveillance, HMIS, 
supply chain — is affected. The governance framework should specify who has 
authority to update hierarchy linkages, what notification is required before a change 
is implemented, and what retrospective recalculation obligations apply for historical 
indicators.  
(3) The distinction between provenance and ownership of facility data should be 
defined. A facility may be owned by a faith-based organisation but listed in a national 
public registry; the data custodian (the Ministry of Health) and the data owner (the 
facility operator) have different governance roles and rights. The governance 
framework should address this explicitly.  
(4) The Health Facility Registry should be designed as a public good: facility identity 
and location data, at minimum, should be publicly accessible in alignment with the 
WHO GHFD initiative's open data objectives and the principle that patients and 
communities have a right to know where health services are available. 
 
220 
 
221 
 
222 
223 
 
 
135 
DPI-H Reference Architecture  |  Component Articulation 
224
