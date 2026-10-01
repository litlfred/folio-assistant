---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-099-supplier-registry
section_title: "Supplier Registry"
section_number: null
pages: 202-210
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
2 
Business Services Layer  ·  Health Supply Chain 
3 
 
4 
ARCHITECTURE 
PLACEMENT 
AND AN 
IMPORTANT 
GOVERNANCE 
NOTE 
The Supplier Registry sits in the business services layer of the DPI-H reference 
architecture, as a reusable component serving the health supply chain domain. It is 
domain-specific shared infrastructure that serves the multiple functional applications 
involved in supply chain operations. This positioning reflects both the domain-
specific nature of supplier identity and an important governance reality: supplier 
registries are typically not owned by Ministries of Health — they commonly sit within 
finance, procurement, trade, or regulatory authorities and serve multiple sectors 
simultaneously. The health sector's need for a Supplier Registry is therefore a cross-
sectoral infrastructure requirement. Where a cross-sectoral supplier or vendor 
registry exists at foundational DPI level, the health sector should leverage it. Where 
none exists, a health-sector implementation in the business services layer may be 
necessary as a transitional measure, with a view to eventual stewardship transfer to 
the appropriate cross-sectoral authority. The Supplier Registry is architecturally 
distinct from the Supplier and Contracts Management System, which manages the 
operational relationships — tendering, contracting, performance monitoring, and 
dispute resolution — that the registry's identity data supports. 
 
5 
1  WHAT IT IS 
 
6 
The Supplier Registry is the authoritative master data source for identity, classification, and regulatory 
7 
status of suppliers engaged in the health supply chain — including manufacturers, distributors, wholesalers, 
8 
third-party logistics providers, importers, donor organisations, and NGO supply partners. It maintains a 
9 
standardised, uniquely identified record for each supplier, providing the common reference point against 
10 
which procurement, order management, warehouse, transport, and contract management systems can 
11 
consistently identify, verify, and classify the organisations from which health products are sourced and 
12 
through which they are distributed. 
13 
The Supplier Registry is a metadata component in the architectural sense: it holds identity data, not 
14 
transactional data. It records who a supplier is, where they operate, what they are certified and licensed to 
15 
do, and under what regulatory conditions they are authorised to supply health products. It does not record 
16 
what a supplier has been contracted to supply, at what price, or with what performance history — those 
17 
functions belong to the Supplier and Contracts Management System, which consumes the Supplier 
18 
Registry as its reference source. 
19 
The Supplier Registry should have governance, like other registries, and gives every system in the supply 
20 
chain a single, consistent answer to the question 'who is this supplier?' Without it, every procurement 
21 
system, logistics platform, and contract management tool maintains its own local supplier list — with 
22 
different identifiers, different classifications, and different data quality standards — making cross-system 
23 
analysis, supplier performance comparison, and end-to-end traceability difficult to achieve with confidence. 
24 
 
25 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
26 
Reliable access to safe health products depends not only on what is ordered and how it is managed within 
27 
the health system, but also on who supplies it and under what conditions. Procurement decisions, quality 
28 
 
 
192 
assurance processes, regulatory compliance, and supply chain traceability all require a consistent, 
29 
trustworthy reference for supplier identity. In most health systems, that reference does not exist as shared 
30 
infrastructure: each system that transacts with suppliers maintains its own version of supplier information, 
31 
and those versions accumulate differences over time. The same manufacturer may appear under three 
32 
different names in three different systems, with different contact details, different registration statuses, and 
33 
different records of which products they are authorised to supply. 
34 
This fragmentation has direct supply chain consequences. Procurement systems cannot reliably verify that 
35 
a supplier is currently licensed and certified before issuing a purchase order. Regulatory authorities cannot 
36 
quickly identify all products from a specific manufacturer when a quality alert or recall is issued. Logistics 
37 
systems cannot efficiently identify alternative suppliers when primary supply chains fail. Cold chain 
38 
management systems cannot confirm whether a particular supplier meets the storage and handling 
39 
standards required for temperature-sensitive products. In each case, the underlying cause is the same: 
40 
absence of a shared, authoritative supplier identity layer. 
41 
This fragmentation has direct supply chain consequences. Without a shared supplier identity layer: 
42 
• 
Procurement systems may struggle to verify that a supplier is currently licensed and certified 
43 
before issuing a purchase order 
44 
• 
Regulatory authorities are likely to face difficulty quickly identifying all products from a specific 
45 
manufacturer when a quality alert or recall is issued 
46 
• 
Logistics systems may be unable to efficiently identify alternative suppliers when primary supply 
47 
chains are disrupted 
48 
• 
Cold chain management systems may lack the information needed to confirm whether a particular 
49 
supplier meets the storage and handling standards required for temperature-sensitive products. 
50 
A governed Supplier Registry makes the consistent, verified supplier identity available as a service to all 
51 
supply chain systems, reducing duplication of supplier verification effort, improving the reliability of 
52 
regulatory compliance checking, enabling more effective response to supply disruptions, and supporting 
53 
end-to-end traceability by anchoring product and transaction records to verified supplier identities. It also 
54 
enables better procurement decisions: when lead times, geographic constraints, and minimum order 
55 
requirements are governed centrally rather than maintained in individual procurement systems, demand 
56 
planning and supplier sourcing become more reliable and more equitable across the network. 
57 
 
58 
3  CORE ATTRIBUTES 
 
59 
– Supplier identity and master data management. Creation, maintenance, and publication of 
60 
authoritative identity records for all suppliers engaged in the health supply chain, covering all 
61 
supplier types, with a unique, persistent, centrally assigned supplier identifier as the canonical 
62 
cross-system reference key. 
63 
– Supplier classification and type management. Classification of suppliers by their role in the 
64 
supply chain — manufacturer, distributor, wholesaler, logistics provider, importer, donor, NGO — 
65 
using a nationally governed classification scheme that enables consistent segmentation across 
66 
procurement, logistics, and traceability functions. 
67 
– Registration, licence, and certification management. Storage and governance of regulatory 
68 
licences, import and export permits, quality certifications, and item-specific product registrations 
69 
held by each supplier, with expiry date tracking and lifecycle status management enabling 
70 
proactive compliance verification at the point of procurement or onboarding. 
71 
– Multi-identifier management and GLN cross-referencing. Maintenance of multiple identifiers 
72 
per supplier — including the national business registration number, the canonical supplier 
73 
identifier, and Global Location Numbers (GLNs) — and the mappings between them, enabling 
74 
systems that use different identifier schemes to resolve to the same supplier record. 
75 
 
 
193 
– Geographic scope and multi-level supplier management. Recording of the operational 
76 
countries, regions, and administrative levels at which each supplier is authorised to operate and 
77 
supply health products, supporting pre-qualification rules and geographic constraints that apply in 
78 
different parts of the supply network. 
79 
– Procurement performance attribute management. Maintenance of key procurement attributes 
80 
— including minimum order size and typical lead times — as centrally governed data that 
81 
forecasting, planning, and procurement systems can consume as a shared reference rather than 
82 
maintaining independently. 
83 
– Access-controlled governance workflow. Role-based access management for supplier record 
84 
authoring, review, approval, and publication, with a defined governance process that includes 
85 
supplier self-registration capability where appropriate, verification by authorised procurement or 
86 
regulatory staff, and version-controlled publication. 
87 
– Standards-based API and integration. Exposure of machine-readable APIs enabling consuming 
88 
systems — including procurement, order management, warehouse, transport, and contract 
89 
management platforms — to retrieve supplier identity data in a consistent and portable manner. 
90 
 
91 
4  HOW IT CONNECTS 
 
92 
The Supplier Registry completes the three-pillar master data foundation for health supply chain operations 
93 
alongside the Product Registry and the Health Facility Registry. Supply chain transactions — ordering, 
94 
receiving, distributing, tracking — involve products moving between locations through suppliers; without 
95 
authoritative master data for all three, supply chain transactions cannot be consistently attributed, 
96 
aggregated, or traced. 
97 
The Supplier and Contracts Management System is the Supplier Registry's primary operational peer. The 
98 
registry provides the authoritative supplier identity data; the Contracts Management System manages the 
99 
contractual relationships, performance monitoring, and dispute resolution that depend on that identity. 
100 
Every supplier contract and every supplier performance record should reference the canonical supplier 
101 
identifier from the registry. A supplier that appears in a contract management system without a 
102 
corresponding record in the Supplier Registry represents a gap in data governance — analogous to a facility 
103 
receiving supplies without a Health Facility Registry record or a patient being seen without a Client Registry 
104 
identifier 
105 
The Order Management System, Warehouse and Inventory Management System, Procurement System, 
106 
Cold Chain Management System, and Transportation Management System all consume the Supplier 
107 
Registry as a reference for associating transactions with verified supplier identities. When an order is 
108 
placed, fulfilled, or received, the supplier identity recorded in the transaction should trace to a canonical 
109 
Supplier Registry record. This cross-referencing is what makes end-to-end supply chain traceability 
110 
structurally possible. 
111 
The Product Registry is a complementary dependency: supplier records are enriched by their associations 
112 
with specific products, and product traceability depends on knowing which supplier manufactured or 
113 
distributed a given batch. The linkage between product-level registration data in the Product Registry and 
114 
supplier registration data in the Supplier Registry is the foundation for product recall management and 
115 
quality alert dissemination. 
116 
The Supplier Registry also serves as a foundational data input for supply chain traceability. End-to-end 
117 
traceability — tracking a health product from manufacturer through the distribution network to the point of 
118 
dispensing — requires the supplier identity to be in place and governed: without a verified, consistently 
119 
referenced supplier record, batch and serial tracking data cannot be reliably attributed to an authoritative 
120 
source. Where a traceability capability is implemented or planned, the Supplier Registry provides the 
121 
supplier identity anchor on which that capability depends. 
122 
Beyond the health supply chain, the Supplier Registry is a potential shared resource with other government 
123 
functions. Finance systems use supplier identity for payment and audit; customs and trade authorities use 
124 
it for import and export compliance; regulatory bodies use it for market authorisation and quality assurance. 
125 
 
 
194 
Where a cross-sectoral foundational supplier registry exists, the health sector should reference it rather 
126 
than duplicating it. Where it does not, the health sector's Supplier Registry should be designed and 
127 
governed with cross-sectoral reuse in mind from the outset. 
128 
 
129 
5  FUNCTIONAL REQUIREMENTS 
 
130 
Requirements draw on the GS1 Global Location Number (GLN) standards for supplier location identification 
131 
and expert input. There is no direct equivalent of the Supplier Registry in the OpenHIE architecture 
132 
specification. 
133 
 
134 
# 
Business process 
Functional requirement 
Status 
SUPPLIER IDENTITY AND MASTER DATA MANAGEMENT 
1 
Supplier master 
data management 
Supplier data capture and publication.  The Supplier 
Registry shall support the capture, storage, and 
publication of standardised supplier master data, 
including supplier identifier, legal name, trading names, 
supplier type, registered and operational addresses, 
contact details, country of incorporation, and operational 
countries or regions. 
Required 
2 
Supplier master 
data management 
Supplier type classification.  The Supplier Registry 
shall support the classification of suppliers by their role in 
the supply chain — including manufacturer, distributor, 
wholesaler, 
logistics 
provider, 
importer, 
donor 
organisation, and NGO — using a nationally governed 
classification 
scheme 
that 
enables 
consistent 
segmentation across consuming systems. 
Required 
3 
Supplier master 
data management 
Supplier activation and deactivation.  The Supplier 
Registry shall support the activation, deactivation, 
suspension, and retirement of supplier records, with 
appropriate notification to consuming systems when a 
supplier's status changes, enabling procurement and 
operations systems to reflect current supplier eligibility. 
Required 
4 
Supplier master 
data management 
Supplier history and versioning.  The Supplier Registry 
shall capture and retain the full history of changes to 
supplier records, including the nature of the change, the 
date and time, and the user or system responsible, 
supporting retrospective audit and impact analysis. 
Required 
IDENTIFIER MANAGEMENT 
5 
Identifier 
management 
Multi-identifier support.  The Supplier Registry shall 
support the assignment and maintenance of multiple 
identifiers per supplier, including the nationally assigned 
canonical 
supplier 
identifier, 
national 
business 
registration numbers, and Global Location Numbers 
(GLNs) as the GS1 standard identifier for supplier 
locations. 
Required 
6 
Identifier 
management 
GLN-to-supplier cross-referencing.  The Supplier 
Registry shall support the mapping and cross-referencing 
Required 
 
 
195 
# 
Business process 
Functional requirement 
Status 
of Global Location Numbers (GLNs) to supplier records 
and supplier location records, enabling systems that use 
GLNs for supplier identification in supply chain 
transactions to resolve to the canonical supplier record.  
REGISTRATION, LICENCE, AND CERTIFICATION MANAGEMENT 
7 
Regulatory 
compliance 
Registration and licence management.  The Supplier 
Registry shall support the capture and maintenance of 
regulatory licences, import and export permits, and 
market authorisations held by each supplier, including 
registration numbers, issuing authorities, and expiry 
dates, with active tracking of expiry status to enable 
proactive compliance verification.  
Required 
8 
Regulatory 
compliance 
Quality certification management.  The Supplier 
Registry 
shall 
support 
the 
recording 
of 
quality 
management and distribution practice certifications held 
by each supplier — including the certification type, issuing 
body, scope, and expiry date — enabling procurement 
and quality assurance processes to verify that suppliers 
meet applicable standards before transactions are 
initiated. 
Required 
9 
Procurement 
support 
Item-specific registration linkage.  The Supplier 
Registry should support linkage between supplier records 
and specific health product registrations, enabling 
procurement systems to verify that a supplier holds the 
applicable market authorisation for a specific product 
before issuing a purchase order.  
Recommended 
PROCUREMENT PERFORMANCE ATTRIBUTES 
10 Supply chain 
planning 
Minimum order size management.  The Supplier 
Registry should support the capture and governance of 
minimum order size requirements per supplier, and where 
applicable per product category or delivery location, as a 
shared reference that forecasting and procurement 
systems 
can 
consume 
rather 
than 
maintaining 
independently. 
Recommended 
11 Supply chain 
planning 
Lead time management.  The Supplier Registry should 
support the capture and governance of typical supplier 
lead times — expressed in days from confirmed order to 
delivery, at the relevant administrative level — enabling 
forecasting, planning, and procurement systems to 
incorporate lead time data consistently without each 
maintaining their own local copy. 
Recommended 
GOVERNANCE WORKFLOW AND ACCESS CONTROL 
12 Governance 
Role-based access control.  The Supplier Registry shall 
enforce role-based access control, restricting the ability to 
create, update, and delete supplier records to users and 
systems with the appropriate authority, and providing 
read-only access to consuming supply chain systems. 
Required 
 
 
196 
# 
Business process 
Functional requirement 
Status 
13 Governance 
Governance workflow.  The Supplier Registry shall 
support configurable workflows for the review and 
approval of new supplier registrations and updates to 
existing records, including support for supplier self-
registration with subsequent verification by authorised 
procurement or regulatory staff before a record is 
published as active. 
Required 
DATA ONBOARDING AND INTEGRATION 
14 Data onboarding 
Bulk data import.  The Supplier Registry should support 
the bulk import of supplier master data from external 
sources, including existing procurement system supplier 
lists, regulatory authority databases, and structured data 
files, with insert-or-update capability and import reporting.  
Recommended 
15 System integration 
Downstream system integration.  The Supplier 
Registry shall expose machine-readable APIs enabling 
consuming systems — including procurement, order 
management, warehouse management, cold chain, 
transport, and contract management systems — to 
retrieve supplier identity data in a consistent and portable 
manner.  
Required 
CROSS-CUTTING 
16 Governance · Audit 
Audit logging.  The Supplier Registry shall maintain a 
comprehensive audit log of all authoring actions, 
publication events, access control changes, registration 
status changes, and bulk import operations, with 
attribution to the responsible actor and timestamp. 
Required 
17 System integration 
Subscription and notification.  The Supplier Registry 
should provide a mechanism for consuming systems to 
subscribe to changes in specific supplier records and to 
receive notifications when records are created, updated, 
deactivated, or have registrations or certifications 
approaching expiry. 
Recommended 
18 Performance · 
Availability 
Performance and availability.  The Supplier Registry 
shall be designed for adequate availability, given that 
procurement, order management, and compliance 
systems across all levels of the supply chain depend on 
access 
to 
supplier 
master 
data 
for 
operational 
transactions and regulatory verification. 
Required 
 
135 
Note: GS1 Global Location Number (GLN) standards for supplier location identification 
136 
(https://www.gs1.org/standards/gln). There is no direct equivalent of the Supplier Registry in the OpenHIE 
137 
architecture specification. The WHO Digital Transformation Handbook for Health Supply Chain 
138 
Architecture (WHO; 2024; ISBN: 978-92-4-010119-7; https://iris.who.int/handle/10665/379506) provides 
139 
the DHSC architecture framework context within which the Supplier Registry operates, covering the 
140 
sourcing, contract management, and procurement processes that the registry supports. 
141 
 
142 
 
143 
 
 
197 
6  DATA REQUIREMENTS 
 
144 
The following table defines the minimum dataset for a supplier record in the Supplier Registry. Status 
145 
reflects the minimum requirement for a record to be published as active and usable by consuming supply 
146 
chain systems. 
147 
Note: This is illustrative rather than an exhaustive list and countries can extend based on needs. 
148 
 
149 
Data element 
Description 
Status 
Supplier unique 
identifier 
Nationally or system-assigned unique, persistent identifier for 
the supplier, used as the canonical cross-system reference 
key. 
Mandatory 
Supplier legal 
name 
The registered legal name of the supplier entity. 
Mandatory 
Trading name(s) 
Commercial or brand names under which the supplier 
operates, where different from the legal name. 
Recommended 
Supplier type / 
classification 
Classification of the supplier by role in the supply chain: 
manufacturer, distributor, wholesaler, third-party logistics 
provider (3PL), importer, donor organisation, or NGO. 
Mandatory 
Registered 
business address 
Registered legal address of the supplier, including country. 
Mandatory 
Operational / 
shipping 
address(es) 
Address(es) from which the supplier ships or operates, which 
may differ from the registered address. Multiple entries 
supported for suppliers with multiple locations. 
Mandatory 
Contact 
information 
Primary contact details including telephone number(s) and 
email address for procurement and logistics coordination. 
Mandatory 
Country of 
incorporation 
Country in which the supplier is legally incorporated. 
Mandatory 
Operational 
countries / 
regions 
Countries or sub-national regions in which the supplier is 
authorised to operate and supply products. 
Recommended 
Global Location 
Number(s) (GLN) 
GS1 Global Location Number(s) assigned to the supplier's 
registered locations, enabling standards-based supplier 
identification in supply chain transactions. 
Recommended 
National business 
registration 
number 
Registration number issued by the national business or 
corporate registration authority. 
Mandatory 
Regulatory 
licences / import-
export permits 
Numbers, issuing authorities, and expiry dates of regulatory 
licences, import permits, export permits, or market 
authorisations relevant to the supply of health products. 
Mandatory 
Quality 
certifications 
Quality management and distribution practice certifications 
held by the supplier (e.g., ISO 9001, WHO Good Distribution 
Practice, Good Manufacturing Practice), including issuing 
body, certification scope, and expiry date. 
Mandatory 
 
 
198 
Data element 
Description 
Status 
Item-specific 
product 
registrations 
Registrations held by the supplier for specific health products 
they are authorised to supply, with registration number, 
issuing authority, and expiry date. 
Recommended 
Minimum order 
size 
Minimum quantity or value of an order accepted by the 
supplier, per product or product category where applicable. 
Recommended 
Lead time 
Typical lead time from confirmed order to delivery, expressed 
in days, at the relevant administrative level. May vary by 
product category or delivery location. 
Recommended 
Record creation 
and update 
metadata 
Dates of record creation, last update, source system, and 
user responsible for each change. 
Mandatory 
 
150 
GOVERNANCE 
Governance of the Supplier Registry follows the cross-cutting governance framework 
in Section 3.4 of the guidance document. Component-specific considerations include:  
(1) Cross-sectoral stewardship. The most important governance question for the 
Supplier Registry is who should own it. Supplier identity is not a health-sector-specific 
concern; a supplier that manufactures medicines may also supply other sectors, and 
their regulatory status, certifications, and legal identity are matters of national 
commerce and trade policy. Where a cross-sectoral supplier registry exists — in a 
finance ministry, trade authority, or central procurement agency — the health sector 
should establish a formal data sharing arrangement to consume that registry rather 
than building a parallel one. Where none exists, the health sector may need to stand 
up an interim Supplier Registry while advocating for the development of cross-sectoral 
shared infrastructure. Countries should document the stewardship intention explicitly 
rather than defaulting to health-sector ownership by inertia.  
(2) Regulatory authority coordination. Licence and certification data in the Supplier 
Registry must be kept current, and the authoritative sources for that data are 
regulatory authorities rather than health ministries. The governance framework should 
establish formal data sharing arrangements with the national regulatory authority, 
import and export licensing bodies, and quality assurance agencies, so that changes 
in supplier regulatory status are reflected in the registry promptly and without requiring 
manual reconciliation.  
(3) Supplier self-registration. Many effective supplier registries support self-
registration by suppliers as the primary onboarding mechanism, with verification and 
approval by authorised staff as the governance control. This model reduces the data 
entry burden on registry administrators and gives suppliers ownership over the 
accuracy of their own records. Governance must define the data elements that may 
be self-submitted, those that require verification, and the process for resolving 
disputes between submitted and verified data.  
(4) Lead time and order data as governance commitments. Lead time and minimum 
order data held in the registry represent commitments that may conflict with actual 
supplier behaviour. These attributes should be reviewed periodically against actual 
performance data held in procurement and order management systems, and updated 
through a governed change management process rather than being treated as static 
master data. 
 
151 
 
 
199 
DPI-H Reference Architecture  |  Component Articulation 
1
