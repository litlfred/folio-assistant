---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-093-product-registry
section_title: "Product Registry"
section_number: null
pages: 156-166
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
378 
Core Registries for Health  ·  DPI-H Foundational Layer  
379 
 
380 
ARCHITECTURE 
PLACEMENT 
The Product Registry is a foundational DPI-H component holding core product 
master data — standardised, and cross-sectorally reusable. It is architecturally 
distinct from the Product Catalogue Management tool, which extends the registry 
with richer, operationally enriched attributes specific to health supply chain use 
cases (pricing, substitution rules, clinical interactions, adverse event linkage, volume 
metrics, label & registration information). The distinction between a domain-specific 
product list and a foundational registry lies not in the data it holds but in its scope of 
reuse: the Product Registry earns its foundational status because the same product 
identity data is needed across health, social protection, customs, regulatory 
authorities, and any other government function that transacts in health commodities. 
Countries should implement the Product Registry first; the Product Catalogue 
Management Tool builds on it. 
 
381 
1  WHAT IT IS 
 
382 
The Product Registry is the national authoritative source of core identity and classification data for health 
383 
products — medicines, vaccines, medical devices, diagnostics, and health commodities — recognised for 
384 
use within the national health system. It maintains a standardised, uniquely identified, and governed record 
385 
for each product, providing the common reference point against which all supply chain, clinical, and 
386 
regulatory systems can consistently identify and classify what they are ordering, storing, dispensing, or 
387 
reporting on. 
388 
Unlike the Product Catalogue Management Tool, which extends the registry with pricing, clinical 
389 
enrichment, and procurement-specific attributes, the Product Registry holds the stable core attributes that 
390 
are needed across sectors and systems — the minimum sufficient set to unambiguously identify a product 
391 
and support interoperability. It is a foundational DPI-H component: reusable not only across health supply 
392 
chain systems but potentially across any government function that transacts in health commodities. 
393 
Implementing a Product Registry is as much a data management process as it is a technical deployment. 
394 
The WHO Digital Transformation Handbook for Health Product Catalogue (2025) frames this as a stepwise 
395 
process: assessing the current state of product data, standardising data structures and identifiers, standing 
396 
up the registry capability, and continuously governing data quality over time. Countries should approach 
397 
the Product Registry as an ongoing programme of product master data management, not a one-time system 
398 
implementation. The functional and data requirements in this articulation should be interpreted in that 
399 
context — some attributes are prerequisites for the first usable version; others represent the target state of 
400 
a mature, well-governed implementation. 
401 
 
402 
2  WHY IT MATTERS FOR HEALTH OUTCOMES 
 
403 
Without a shared, authoritative product identity layer, it becomes significantly harder for systems to reliably 
404 
order, track, or dispense medicines and health commodities, as each facility, warehouse, and ordering 
405 
system tends to maintain its own local product list. The same medicine appears under different codes, 
406 
descriptions, and unit definitions in different systems — making it difficult to consolidate demand, track 
407 
 
 
146 
stock across tiers, detect diversions, or produce credible national consumption data53. This fragmentation 
408 
weakens the reliability of supply chain data at every level as forecasting is based on inconsistent product 
409 
definitions, demand cannot be cleanly aggregated across systems, and shortage signals emerge later and 
410 
less clearly than they should — reducing the time available to respond before service delivery is affected. 
411 
When a Product Registry is in place, systems that participate in the health supply chain draw from the same 
412 
product master. For example, forecasting systems can aggregate demand across facilities using consistent 
413 
identifiers, and warehouse systems across different tiers of the supply chain can match incoming deliveries 
414 
to orders without manual reconciliation, even when the delivering party and receiving system use different 
415 
internal identifiers — because both resolve to the same canonical product record. These enabling 
416 
conditions for a supply chain that reliably gets the right product to the right place in the right condition, also 
417 
produce efficiency gains. 
418 
 
419 
3  CORE ATTRIBUTES 
 
420 
– Product identity and master data management. Creation, maintenance, and publication of 
421 
authoritative product records, covering the standardised core attributes that uniquely identify each 
422 
product at both generic and item (brand/pack) level. 
423 
– Identifier management and cross-referencing. Management of multiple identifier schemes — 
424 
including global trade identifiers (GTINs) and national product codes — and the mappings between 
425 
them, enabling systems that use different identifiers to resolve to the same product. 
426 
– Multi-scheme product classification. Classification of products under applicable international 
427 
and national coding schemes (e.g., UNSPSC for pharmaceuticals, GPC for medical devices, ATC 
428 
for medicines), supporting simultaneous classification under multiple schemes where required. 
429 
– Packaging hierarchy and unit of measure management. Definition and maintenance of the 
430 
packaging levels for each product (unit, inner pack, case, pallet) with the associated GTINs and 
431 
quantity conversions across levels, enabling consistent unit-of-measure handling across ordering, 
432 
warehousing, and dispensing. 
433 
– Generic-to-item mapping. Management of the relationship between a generic product definition 
434 
(e.g., amoxicillin 500mg capsule) and the specific branded items that fulfil it, supporting therapeutic 
435 
substitution, equivalence determination, and brand-agnostic procurement. 
436 
– Product lifecycle and change management. Maintenance of full version history for product 
437 
records, including capture of all changes with timestamps and author attribution, and support for 
438 
defined lifecycle states (draft, active, deprecated, retired). 
439 
– Access-controlled governance workflow. Role-based access management for product record 
440 
authoring, review, approval, and publication, supporting the governance processes required to 
441 
maintain master data quality and integrity. 
442 
– Bulk data onboarding and external source integration. Capability to receive product data from 
443 
external authoritative sources — including manufacturers, the Global Data Synchronisation 
444 
Network (GDSN), and regulatory bodies — via both bulk upload and system-to-system integration. 
445 
 
446 
4  HOW IT CONNECTS 
 
447 
The Product Registry is one of the Core Registries for Health within the DPI-H reference architecture. Its 
448 
closest structural counterpart is the Product Catalogue Management Tool, which extends the registry with 
449 
health-specific operational attributes — dosage guidance, substitution rules, adverse event linkage, 
450 
procurement pricing, and clinical interaction data — that are too domain-specific and dynamically changing 
451 
to belong in the foundational registry layer. The Product Catalogue Management Tool consumes the 
452 
 
53 USAID GHSC-PSM Product Master Data Management Reference Guide (2020) 
https://www.ghsupplychain.org/sites/default/files/2021-11/2021_GHSC-PSM%20PMDM%20Reference%20Guide_Final.pdf  
 
 
147 
Product Registry as its master source: all items in the catalogue it produces should trace to a registry record, 
453 
and the registry's identifiers are the canonical keys used throughout the supply chain. 
454 
Within the supply chain domain, the Product Registry is consumed by every operational system – 
455 
forecasting and planning systems use product identifiers to aggregate demand signals; order management 
456 
and warehouse systems use GTINs and packaging hierarchy data to match orders to receipts and manage 
457 
stock; procurement and supplier contract systems reference product identifiers when creating and 
458 
evaluating tenders; cold chain and transportation systems apply storage requirements and volumetric data 
459 
held in the registry to plan and monitor product movement; and dispensing systems use generic-to-item 
460 
mappings to confirm brand equivalence. 
461 
The Product Registry depends on the Terminology Service for the standardised codes used in classification 
462 
(ATC, UNSPSC, GPC) and for the controlled vocabularies governing dosage form, route of administration, 
463 
and unit of measure. The Logical Information Model Repository would hold the structural model defining 
464 
which data elements the registry should capture, their cardinalities, and their terminology bindings. The 
465 
Product Registry is also the foundational anchor for batch and serial traceability, as any system that tracks 
466 
individual product batches, lot numbers, or serialised units requires a canonical product master record to 
467 
give those tracking identifiers meaning. This relationship is described in both the GS1 Standards in the 
468 
Medicines Supply Chain Implementation Guidance and the Center for Global Development's work on 
469 
improving global health supply chains through traceability, both of which position product master data 
470 
management as the prerequisite capability for any traceability programme54,55. The Health Facility Registry 
471 
and Supplier Registry are co-dependencies in the supply chain domain — together, they provide the three 
472 
master data pillars (product, location, supplier) on which all supply chain transactions depend. 
473 
 
474 
5  FUNCTIONAL REQUIREMENTS 
 
475 
Functional requirements are grouped by the business process they support. Requirements marked 
476 
‘Required’ are mandatory for conformance. Requirements marked ‘Recommended’ are strongly advised 
477 
but represent capabilities that countries may implement incrementally depending on maturity and context. 
478 
 
479 
# 
Business process 
supported 
Functional requirement 
Status 
CONTENT MANAGEMENT 
1 
Product master 
data management 
Product data management.  The Product Registry shall 
support the capture, storage, and publication of 
standardised product information for medicines, vaccines, 
medical devices, diagnostics, and health commodities, 
including the ability to store product images and 
supporting documentation. 
Required 
2 
Product master 
data management · 
Procurement & 
contracting 
Multi-classification support.  The Product Registry shall 
support the simultaneous classification of products under 
multiple international and national classification schemes, 
including UNSPSC, GPC, and ATC, and the WHODrug 
data dictionary (for medicinal products), and shall allow 
additional classification schemes to be configured without 
modification to the core data model. 
Required 
 
54 https://www.gs1belu.org/sites/gs1belu/files/2020-07/20191029_implementation_gs1_standards_traceability_medicines_hc_supply_chain_v20_0.pdf 
55 https://www.cgdev.org/sites/default/files/improving-global-health-supply-chains-through-traceability.pdf 
 
 
148 
# 
Business process 
supported 
Functional requirement 
Status 
3 
Inventory 
management · 
Order management 
· Distribution 
Packaging hierarchy management.  The Product 
Registry shall support the definition and maintenance of 
packaging hierarchies for each product, capturing the 
GTIN, unit of measure, and quantity conversion factor for 
each packaging level (unit, inner pack, case, pallet). 
Required 
4 
Dispensing & point 
of care · 
Procurement 
Generic-to-item mapping.  The Product Registry shall 
support the explicit mapping of generic product definitions 
to the specific branded items that fulfil them, including the 
maintenance of brand name, manufacturer name, and 
country of origin for each item record. 
Required 
5 
Product master 
data management · 
Regulatory 
compliance 
Product history and versioning.  The Product Registry 
shall capture and retain the full history of changes made 
to product records, including the nature of the change, the 
date and time, and the user who made it, supporting 
retrospective audit and impact analysis. 
Required 
IDENTIFIER MANAGEMENT 
6 
System integration · 
Order management 
Multi-scheme identifier support.  The Product Registry 
shall assign and manage product identifiers under 
multiple schemes, including Global Trade Item Numbers 
(GTINs) and nationally defined product codes, and shall 
maintain the mappings between them. 
Required 
7 
System integration · 
Procurement 
Identifier cross-referencing.  The Product Registry shall 
provide the capability to link a national product identifier 
to its equivalent standardised global identifier (e.g., 
GTIN), enabling systems that use different identifier 
schemes to resolve to the same product record. 
Required 
GOVERNANCE WORKFLOW & ACCESS CONTROL 
8 
Governance & data 
stewardship 
Role-based access control.  The Product Registry shall 
enforce role-based access control, restricting the ability to 
create, update, and delete product records to users and 
systems with the appropriate authority, and providing 
read-only access to consuming systems. 
Required 
9 
Governance & data 
stewardship 
Governance workflow management.  The Product 
Registry shall support configurable workflows for the 
review and approval of updates to product information, 
requiring designated approvers to accept or reject 
proposed changes before they are published to 
consuming systems. 
Required 
10 Product master 
data management · 
Governance 
Activation and deactivation.  The Product Registry shall 
support the activation, deactivation, deprecation, and 
retirement of product records, with appropriate notification 
to consuming systems when a product status changes. 
Required 
DATA ONBOARDING & INTEGRATION 
11 Data onboarding & 
migration 
Bulk data import.  The Product Registry shall support the 
bulk import of product master data from external sources, 
Recommended 
 
 
149 
# 
Business process 
supported 
Functional requirement 
Status 
including 
manufacturer-supplied 
spreadsheets 
and 
structured data files, with the ability to perform insert-or-
update operations and report on import results. 
12 Data onboarding · 
System integration 
External source integration.  The Product Registry shall 
support system-to-system integration with external 
authoritative data sources, including manufacturer 
systems and the Global Data Synchronisation Network 
(GDSN), the WHODrug data dictionary, and national 
IDMP implementations, to receive standardised product 
data at agreed intervals or on a triggered basis. 
Integration pathways shall not be limited to GDSN where 
countries use alternative authoritative sources. 
Recommended 
13 System integration · 
Supply chain 
operations 
Downstream system integration.  The Product Registry 
shall expose machine-readable APIs enabling consuming 
systems — including forecasting, order management, 
warehouse, procurement, cold chain, and dispensing 
systems — to retrieve product data in a consistent and 
portable manner. 
Required 
CROSS-CUTTING 
14 Governance & data 
stewardship · 
Regulatory 
compliance 
Audit logging.  The Product Registry shall maintain a 
comprehensive audit log of all authoring actions, 
publication events, access control changes, and bulk 
import operations. 
Required 
15 System integration · 
Supply chain 
operations 
Subscription and notification.  The Product Registry 
shall provide a mechanism for consuming systems to 
subscribe to changes in specific product records or 
product categories and to receive notifications when 
records are created, updated, deprecated, or retired. 
Recommended 
16 System integration · 
Supply chain 
operations 
Performance and availability.  The Product Registry 
shall be designed for high availability, given that supply 
chain systems at all levels of the health system depend 
on access to product master data for operational 
transactions. 
Required 
 
480 
Note: Cross-cutting requirements (audit logging, subscription and notification, performance and 
481 
availability) apply consistently across all registry components. Where these appear in individual 
482 
component specifications they are written for completeness. 
483 
6  DATA REQUIREMENTS 
 
484 
The following table consolidates the data requirements drawn from all supply chain system components 
485 
that consume the Product Registry. Status reflects the minimum requirement for a product record to be 
486 
considered complete for interoperability purposes. 
487 
Note: This is illustrative rather than an exhaustive list and countries can extend based on needs. 
488 
 
489 
 
 
150 
Data element 
Description 
Requirement 
Status 
Generic product 
identifier 
The canonical, system-independent identifier for a product 
at generic level (e.g., amoxicillin 500mg capsule), 
independent of brand or manufacturer. 
Mandatory 
Generic product 
description 
Human-readable description of the generic product, 
including key clinical attributes in standardised form. 
Mandatory 
Item identifier 
(GTIN) 
Global Trade Item Number or equivalent standardised trade 
item identifier assigned at the specific product/brand/pack 
level. 
Mandatory 
Brand name 
Proprietary or trade name of the product as registered by 
the manufacturer. 
Mandatory 
Unit of measure 
The base unit in which the product is counted, dispensed, 
or issued (e.g., tablet, vial, sachet). 
Mandatory 
Product 
classification 
Classification of the product under applicable schemes 
such as UNSPSC (pharmaceuticals), GPC (medical 
devices), or ATC (medicines). For medicinal products, 
alignment 
with 
the 
WHODrug 
data 
dictionary 
is 
recommended. Supports multi-classification. 
Mandatory 
Dosage form 
Physical form of the product (e.g., tablet, capsule, oral 
solution, injection). 
Mandatory 
Strength 
Quantity of active ingredient per unit of the product (e.g., 
500mg, 10mg/mL). 
Mandatory 
Manufacturer name 
Name of the legal manufacturer responsible for production 
of the item. 
Mandatory 
Country of origin 
Country in which the product is manufactured. 
Mandatory 
Route of 
administration 
How the product is intended to be administered (e.g., oral, 
intravenous, topical). 
Mandatory 
Shelf life from 
production 
The maximum shelf life of the product from date of 
manufacture, expressed in months. 
Mandatory 
Storage 
requirements 
Conditions under which the product must be stored, 
particularly temperature range (min/max) and humidity 
where applicable. 
Mandatory 
Volumetrics 
Physical dimensions and weight of the product and its 
packaging levels, used for transport and storage capacity 
planning. 
Mandatory 
Packaging 
hierarchy level 
Definition of the packaging levels (unit, inner pack, case, 
pallet) with the applicable GTIN and quantity conversion for 
each level. 
Mandatory 
Generic product to 
item mapping 
The relationship between the generic product definition and 
the specific branded item(s) that fulfil it, supporting 
substitution and equivalence management. 
Mandatory 
 
 
151 
Data element 
Description 
Requirement 
Status 
Brand mappings 
Cross-references between a generic product identifier and 
all known brand/trade names under which it is marketed. 
Recommended 
Item registration 
details 
Regulatory registration or marketing authorisation details 
for the product, including registration number, registering 
authority, and expiry date. 
Recommended 
 
490 
 
491 
GOVERNANCE 
Governance of the Product Registry follows the cross-cutting governance framework 
set out in Section 3.4 of the guidance document. Component-specific considerations 
include:  
(1) The Product Registry steward should maintain relationships with the relevant 
national regulatory authority to ensure that product approval status is reflected in 
registry records in a timely manner.  
(2) Where a national GDSN data pool exists or a manufacturer data synchronisation 
arrangement is in place, the governance framework should specify how authoritative 
data from those sources is incorporated, and which takes precedence in cases of 
conflict.  
(3) Lifecycle management for product records should be coordinated with the Product 
Catalogue steward, since deprecation of a registry record affects all catalogue entries 
that extend it. 
 
492 
 
493 
A Comparative View of the Product Registry and the Product Catalogue Management Tool 
494 
 
495 
The Product Registry and the Product Catalogue Management Tool address different problems in the 
496 
product data landscape. The registry provides the stable, cross-sectoral identity layer — the minimum 
497 
sufficient description of what a product is. The Product Catalogue Management Tool provides the enriched, 
498 
operationally specific information that health system actors need to use, procure, and prescribe products 
499 
appropriately. Both are necessary; neither is a substitute for the other. 
500 
 
501 
 
Product Registry 
Core Registries for Health  ·  DPI-H 
foundational layer 
Product Catalogue Management Tool 
Functional Application  ·  Health-specific 
operational layer 
Architecture 
layer 
Where each 
component 
sits in the 
DPI-H 
framework 
Core Registries for Health — DPI-H 
foundational layer. Shared infrastructure 
whose master data is reusable across 
sectors: 
health, 
social 
protection, 
customs, and any government function 
transacting in health commodities. 
Functional application — health-specific 
operational layer. Extends the Product 
Registry for health supply chain use 
cases. 
Core 
question 
answered 
What is this product — what is its identity, 
classification, and the minimum attributes 
needed to unambiguously recognise it 
How do we create, validate, maintain, 
govern, and publish enriched product 
information for health supply chain use? 
The Product Catalogue Management 
 
 
152 
 
Product Registry 
Core Registries for Health  ·  DPI-H 
foundational layer 
Product Catalogue Management Tool 
Functional Application  ·  Health-specific 
operational layer 
The 
fundamental 
problem each 
component 
exists to solve 
across any system that orders, stores, 
dispenses, or reports on it? 
Example: "Is this item amoxicillin 500mg 
capsule (ATC J01CA04), manufactured 
by Company X, with GTIN 
12345678901234?" 
Tool provides the workflows, processes, 
and operational capabilities through 
which a product catalogue — the 
enriched, health-specific output — is 
produced and kept current. 
 
What it holds 
The specific 
attributes 
managed by 
each 
component 
Core 
identity 
attributes: 
product 
identifiers (GTIN, UDI, national codes), 
generic product description, brand name, 
manufacturer 
name, 
ATC/UNSPSC/GPC/WHODrug/IDMP 
classification, dosage form, strength, 
route 
of 
administration, 
packaging 
hierarchy, 
storage 
requirements, 
volumetrics, shelf life, generic-to-item 
mapping, and regulatory registration 
details. 
The PCMT produces a product catalogue 
as its output. That catalogue holds 
operationally 
enriched 
attributes: 
formulary status and listing category, 
clinical indications and approved uses, 
therapeutic substitution rules, drug-drug 
interaction data, adverse drug reaction 
profiles, pricing and contract terms, 
minimum order quantities, preferred and 
alternative supplier information, and 
programme-specific configurations. The 
PCMT provides the workflows, approval 
processes, and governance mechanisms 
through which those attributes are 
created, validated, and kept current. 
Data stability 
How 
frequently 
attributes 
change and 
why 
Stable. Core identity attributes change 
infrequently — typically on product 
launch, 
regulatory 
reclassification, 
packaging revision, or manufacturer 
change. The registry is designed for 
master data that is authoritative and slow-
moving. 
Dynamic. Operational attributes change 
regularly — prices are renegotiated 
seasonally or per procurement cycle, 
formulary decisions change with policy 
reviews, clinical guidance is updated with 
evidence. The catalogue is designed to 
accommodate this cadence. 
Number of 
instances in 
a country 
How many of 
each a 
country 
typically has 
One per country. The Product Registry is 
a single national authoritative source. 
Multiple instances or fragmented national 
registries create the same identification 
problems the registry exists to solve. 
Potentially multiple. A country may have 
separate management tools serving 
different operational contexts — a 
national formulary management tool, a 
procurement 
catalogue 
management 
system, 
a 
hospital-level 
medicines 
management 
application 
— 
each 
producing its own catalogue output. All 
should reference the single Product 
Registry as their canonical product 
identity source, ensuring that the different 
catalogues 
they 
produce 
can 
be 
reconciled against a common product 
master. 
What it does 
NOT do 
The boundary 
of each 
Does not hold pricing, formulary status, 
therapeutic substitution rules, clinical 
indications, 
drug 
interaction 
data, 
procurement terms, or any attribute that 
Does not assign or own product 
identifiers. Does not hold canonical 
product identity data. The catalogue it 
produces should trace every product 
entry to a Product Registry record — the 
 
 
153 
 
Product Registry 
Core Registries for Health  ·  DPI-H 
foundational layer 
Product Catalogue Management Tool 
Functional Application  ·  Health-specific 
operational layer 
component's 
scope 
is health-sector specific, operationally 
dynamic, or programme-dependent. 
management tool enriches and extends 
registry data, it does not replace or 
duplicate it. 
Governance 
Who stewards 
each 
component 
and under 
what authority 
Single national steward — typically the 
national regulatory authority, Ministry of 
Health, or a designated product data 
agency. Governance is cross-sectoral 
because the registry is used beyond 
health. 
Change 
management 
is 
conservative: updates require formal 
approval and version control. 
May have multiple stewards, each with 
authority over different aspects of the 
enriched product information the tool 
manages: a national formulary committee 
for 
clinical 
listing 
decisions, 
a 
procurement authority for pricing and 
contract data, clinical advisory bodies for 
therapeutic 
guidance. 
The 
tool's 
governance 
framework 
should 
accommodate 
this 
multi-stakeholder 
model, with change processes that are 
more frequent and more decentralised 
than those governing the registry 
Relationship 
to each other 
How the two 
components 
depend on 
and interact 
with one 
another 
The Product Registry is the master 
source for all product identity data. The 
Product Catalogue Management Tool 
consumes 
registry 
records 
as 
its 
foundational anchor — every catalogue 
entry should reference a registry record 
by its canonical identifier. When a registry 
record is deprecated or retired, the 
Product Catalogue Management Tool 
should review and update all dependent 
catalogue entries accordingly. 
The Product Catalogue Management 
Tool is always downstream of the Product 
Registry. It references registry records by 
canonical identifier rather than replicating 
their data and enriches them with health-
specific operational attributes to produce 
the catalogue. A product cannot be 
published in any catalogue the tool 
manages before a corresponding record 
exists in the Product Registry. 
Primary 
users 
The roles and 
systems that 
interact 
directly with 
each 
component 
Supply chain planners, procurement 
officers, 
warehouse 
and 
inventory 
management 
systems, 
order 
management 
systems, 
dispensing 
systems, cold chain systems, regulatory 
authorities, 
and 
any 
cross-sectoral 
system that needs to identify a health 
commodity. 
Prescribers, 
pharmacists, 
formulary 
managers, 
clinical 
decision 
support 
systems, 
procurement 
and 
tender 
management systems, health insurance 
claims adjudication systems, and health 
technology assessment bodies. 
Risk if 
absent 
The specific 
failure that 
results if each 
component is 
not in place 
Every system maintains its own product 
list 
with 
its 
own 
identifiers 
and 
classifications. 
The 
same 
product 
appears under different codes in different 
systems, 
making 
cross-system 
aggregation unreliable, duplicate orders 
undetectable, and national consumption 
data untrustworthy. 
Clinical and procurement systems rely on 
manual, 
fragmented, 
or 
non-
standardised 
processes 
to 
access 
enriched product information. Pricing and 
supplier data exist only in dispersed 
contract 
documents 
rather 
than 
a 
structured, 
queryable 
repository. 
Formulary guidance and therapeutic 
substitution rules are harder to maintain 
consistently across facilities, increasing 
the risk of variation in prescribing practice 
and procurement decisions at scale. 
 
 
154 
 
Product Registry 
Core Registries for Health  ·  DPI-H 
foundational layer 
Product Catalogue Management Tool 
Functional Application  ·  Health-specific 
operational layer 
Relevant 
standards 
The technical 
and content 
standards 
each 
component 
draws on 
GS1 (GTIN, GS1 DataMatrix), ISO UDI 
(medical devices), ATC classification, 
UNSPSC, 
GPC, 
WHO 
Drug 
data 
dictionary, WHO Model List of Essential 
Medicines (for scope reference). 
SNOMED CT/GPS and ICD (clinical 
indications), HL7 FHIR Medication and 
MedicationKnowledge 
resources, 
national formulary coding frameworks, 
EDQM standard terms (dosage forms 
and routes for clinical use), GS1 
Healthcare 
for 
procurement 
interoperability. 
 
502 
Note: This table reflects a three-level distinction. A product catalogue is the structured collection and 
503 
presentation of enriched product information and attributes. The Product Catalogue Management Tool is 
504 
the system that provides the functions, workflows, and operational processes used to create, validate, 
505 
maintain, govern, and publish that information — the catalogue is its output. The Product Registry is 
506 
broader and more foundational: it serves as the authoritative reference source for uniquely identifying and 
507 
maintaining core product information across systems, supporting interoperability, governance, and 
508 
linkage across health and non-health sectors. The Product Catalogue Management Tool is not described 
509 
in detail in this articulation; its full component description is a separate document. The table above is 
510 
intended to establish the architectural boundary between the registry and the management tool so that 
511 
each can be designed, procured, and governed without conflation. 
512 
 
 
155 
DPI-H Reference Architecture  |  Component Articulation 
1
