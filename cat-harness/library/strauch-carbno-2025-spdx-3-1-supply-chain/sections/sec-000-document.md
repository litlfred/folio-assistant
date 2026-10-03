---
doc_id: strauch-carbno-2025-spdx-3-1-supply-chain
doc_title: "Capturing the Supply Chain as HBOMs, SBOMs and more with SPDX 3.1"
section_id: sec-000-document
section_title: "Document"
section_number: null
pages: 1-43
source_pdf: strauch-carbno-2025-spdx-3-1-supply-chain.pdf
source_sha256: 2fa09a12a579750a
toc_source: outline
---
Licensed under CC-BY-SA-3.0
Capturing the Supply Chain as HBOMs, 
SBOMs and more with SPDX 3.1
Alfred Strauch, Smart Talk Beacon Solutions Ltd.
Steven Carbno, Smart Talk Beacon Solutions Ltd.
Date: Sept 10, 2025

Licensed under CC-BY-SA-3.0
SPDX is a graph language with an integrated ontology for 
universal data capture and sharing.
Supply Chains need Universal Data Capture and Sharing 
Take Away Message 
Dynamic Data  
Management
Static Data 
Management
Universal Data 
Merging
Today
System Package Data Exchange (SPDX)
Operational Solutions

Licensed under CC-BY-SA-3.0
Topics
SPDX 3.1 Overview
Supply Chain Integration SPDX 3.1
●
SPDX history
●
New profiles
●
Action ontology: Defined process, actions and requirements 
●
SPDX ontology used as part of the Graph Language
●
Supply Chain methodology
●
Supply Chain traceability
●
Reading Supply Chain examples
●
Regulatory compliance with SPDX

Licensed under CC-BY-SA-3.0
SPDX History

Licensed under CC-BY-SA-3.0
SPDX 3.1 Profiles
2024 Sept.
Version 3.0
2025 Q3 
Version 3.1
2025 Q4
Version 3.1+
Profiles: 3.1+ Additions
-
Cryptology
-
Security
-
Threat and Controls
Profiles: New
-
Safety
-
Operations
-
Dataset
-
AI
-
Hardware
-
Supply Chain
Engineering Ontology
Graph Language
Cross Profile Integration
Operational Solutions
Additional Timeline Items

Licensed under CC-BY-SA-3.0
SPDX 3.1+ Profiles
○
Core
○
Software
○
Hardware 
○
Supply Chain
○
Licensing
○
Services
○
Operations
○
AI
○
Dataset
○
Security
○
Cryptology
○
Safety
○
Threat Analysis
○
Lite
SPDX is a graph language driven by relationships

Licensed under CC-BY-SA-3.0
SPDX 3.1 is built upon abstraction for optimal information capture and relationship definition.
Empowering Data Exchange
SPDX as a Knowledge Graph
Requirements 
(goal)
Defined Process
(plans)
contains
contains
Action
Evidence
contains
Starting Point
(Inception)
Design Assurance abstraction

Licensed under CC-BY-SA-3.0
The requirements to define a product. Processes define how. Actions is the 
execution of processes. Data is who, how, what and when which is evidence. Evidence
allows you make decisions.
Addition of Action Methodology  
SPDX as a Knowledge Graph
Requirements 
(goal)
Defined Process
(plans)
contains
contains
Action
Evidence
contains
Starting Point
(Inception)

Licensed under CC-BY-SA-3.0
Process (plan) of building is followed by Action (doing).
Modelling the building of a paper airplane
Paper Airplane 
Standard
generates
Build Plan for Paper 
Plane
Build Paper Plane
Resource
(Sheet of Paper)
Paper Airplane
Resource
contains
Test Plan
hasRequirement
Test
Evidence 
End Event
(Data)
Requirements
dependsOn
generates
contains
hasTestPlan
fulfillment
output
Design Paper Plane
generates
Input
generates
Requirements
Processes
Actions
Hardware

Licensed under CC-BY-SA-3.0
Core Elements
SPDX 3.1 Core 
●
Requirements
●
Relationships
●
Agents
●
Location
●
Defined Processes
●
Specification
●
Action
●
Organization
●
Record Creation Information
●
Integrity Method
Core is used by all profiles.
https://github.com/spdx/spdx-3-
model/blob/develop/images/model-Core.png

Licensed under CC-BY-SA-3.0
Hardware Profile
Hardware
●
Physical
●
Virtual
●
Bulk
Hardware Description
https://github.com/spdx/spdx-3-
model/blob/develop/images/model-Hardware.png
The Hardware namespace defines metadata related 
to physical and virtual hardware properties. 
Hardware is any product, real or virtual. A product is 
tangible and is the result of labor, or of a natural or 
artificial process.

Licensed under CC-BY-SA-3.0
Supply Chain Profile
Creation
●
Manufacture
●
Assemble
●
Reproduce
●
Harvest
Modify
●
Change
●
Boundary
Destroy
Actions
Processes
https://github.com/spdx/spdx-3-
model/blob/develop/images/model-
SupplyChain.png
Responsibility
●
Owner
●
Custody
Use:
●
Inspection
●
Plan
●
Resolution
●
Boundary
●
Out of Spec
The Supply Chain profile documents events and 
processes associated with the lifecyle of a product, 
including its creation, transportation, usage, and 
decommissioning.

Licensed under CC-BY-SA-3.0
○
Core
○
Software
○
Hardware 
○
Supply Chain
○
Licensing
○
Services
○
Operations
○
AI
○
Dataset
○
Security
○
Cryptology
○
Safety
○
Threat Analysis
Domain Profile Knowledge Sharing 
SPDX Profile Integration
{
"@context": "https://spdx.github.io/spdx-spec/v3.0.1/rdf/spdx-context.jsonld",
"@graph": [
{
"spdxId": "urn:nanoid:BNEris92wBqwo72YI5C04",
"type": "hardware_PhysicalHardware",
"creationInfo": "_:b0",
"name": "AMD A10-6700 APU with Radeon(tm) HD 
Graphics ",
"hardware_partNumber": " A10-6700 APU",
"hardware_productAgent": 
"urn:nanoid:YMYzgKjNNuJ20iQN-NuL9"
},
{
"type": "CreationInfo",
"created": "2025-07-22T03:32:00Z",
"createdBy": "urn:nanoid:Dp9d5Qlhf6JDBHeNBvW-7",
"specVersion": "3.0.1",
"@id": "_:b0"
},
{
"spdxId": "urn:nanoid:YMYzgKjNNuJ20iQN-NuL9",
"type": "Organization",
"creationInfo": "_:b0",
"name": "AMD"
},
{
"spdxId": "urn:nanoid:4yT0oV6gTaRVweNrYlecQ",
"type": "Relationship",
"creationInfo": "_:b0",
"from": "urn:nanoid:OmvGSTuydsi7YK1qT5Rgg",
"relationshipType": "hasOutput",
"to": "urn:nanoid:BNEris92wBqwo72YI5C04"
}
One Document with multiple profiles

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
SPDX makes it easy to read and link
Use Case: Extracting Information
Hardware
Network
Software
Processes
System
Connections
Operations,
Software Agent
Build, AI, Software
Hardware
SPDX Profile
Define systems
Risk mitigation Analysis
(Tools such as NSCU)

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Linking Hardware Information & SC
Gathering and enhancing xBOM information with SC information
System 
Auditing
SPDX Core 
Profiles
SPDX Supply 
Chain
Collection
Presentation
Amalgamation
Analysis
Operations
Core
SBOM
HBOM
AIBOM
Operations
Licensing
Security
Origin
Traceability
Buy/Sell chain
Compliance
Tools
Category
Focus
Inventory
Operations
Maintenance
Risk Mitigation
Data Sharing 
Standard
Language Graph 
Risk Mitigation
Link information 
from multiple 
sources for use 
by chain 
Hardware Owner
Information Producer
Information Platform
Information Flow

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
SPDX makes it easy to read and link
Use Case: Viewing Information

Licensed under CC-BY-SA-3.0
Produced by: Smart Talk Beacon Solution Ltd. 2025
SPDX Supply Chain Solution -
SPDX solution is an open-standard, ontology-based 
platform and framework enabling seamless, secure data 
exchange and regulatory compliance. 
Trusted by leaders like Microsoft and AMD.
Open Source Solution with SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Supply Chain Need Categories
Supply Chain Regulatory Requirements by Category
●
Sustainability/Human Rights: EU CSDDD, Germany LkSG, UK Modern Slavery Act
●
Trade & Customs: WCO SAFE, CTPAT, UN/CEFACT
●
Resilience/Continuity: ISO 22301, ISO 28000, EO 14017
●
Traceability & Data: GS1, ISO 307
●
Cybersecurity: NIST 800-161, ISO/IEC 27036, EO 14028, EU CRA, CMMC

Licensed under CC-BY-SA-3.0
Produced by: Smart Talk Beacon Solution Ltd. 2025
Supply Chain Definition
A supply chain is the entire network of organizations, people, activities, information, and 
resources involved in moving a product or service from supplier to customer. It 
encompasses every phase, from sourcing raw materials and components, through 
manufacturing and assembly, to warehousing, distribution, and final delivery to the 
end user.
TODAY: Is it possible for each organization to capture 
their part of the supply chain, securely share the 
information with multiple stakeholders up and down the 
chain in a simple and cost effective within a changing 
regulatory compliance structure? 
YES with SPDX!
Supply Chain Challenge

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Data Process Stages 
Supply Chain Core Elements
Data Capture
Graph 
Language
Data Mapping 
Sharing 
Target
SPDX
Various Users 
& Companies
Requirement 
Maps
Receive 
Information
Templates
Supply 
Chain Tools
Ontology
Push/Pull 
Options

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Let look a Graphite mining org->(SPDX Organization) producing Graphite -> (Mining is a 
HarvestAction) 
Example Supply Chain And Visualization in SPDX
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
This Harvest Action can have 
relationships to other SPDX  
Items.  
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
This HarvestAction can 
have relationships to other 
SPDX  Items.  
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Organization
Organization relationships 
define the role an 
organization plays in relation 
to any other elements in the 
graph.
This is flexible and powerful.
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Consider the Output 
relationship. 
Harvest Action produces  
BulkHardware.
Bulk hardware (product) is 
identified in bulk units as opposed 
to individual units.
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
BulkHardware 
measurement units can 
be used to record CO2
emissions per action.
QUDT: https://qudt.org/
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Bulk Hardware units and 
measurement are defined in 
bulk Quantity.
/Core/UnitOfMeasure
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Representing a 
TransportAction
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Representing a 
TransportAction
Example Supply Chain
Supply Chain And SPDX
Dropoff or pickup links

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
TransportAction can 
link to new 
TransportAction 
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Showing a Custody of a 
assist/product change
Example Supply Chain
Supply Chain And SPDX

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Full graph 
Example Supply Chain
Supply Chain and SPDX

Licensed under CC-BY-SA-3.0
Produced by: Smart Talk Beacon Solution Ltd. 2025
Parallel Regularly Needs
Cybersecurity Resilience Act 
●
Widespread Vulnerabilities
●
Fragmented Regulations 
●
Global, Cross-Border Risks
●
Economic and National Security 
●
Consumer Protection and Confidence
●
Clear, Uniform Standards 
In summary, the Cyber Resilience Act 
aims to ensure that all digital products in 
the EU are secure by design and stay 
secure throughout their lifecycle to reduce 
vulnerabilities, unifying standards, and 
enhancing resilience against ever-evolving 
cyber threats.
Digital Product Passport 
●
Transparency and Traceability
●
Sustainability and Circular Economy
●
Consumer Empowerment
●
Regulatory Compliance
●
Business Value: Commitment to 
transparency and sustainability.
●
Innovation and Collaboration
In summary, the Digital Product Passport aims 
to bridge the gap between growing demands 
for transparency, regulatory requirements, and 
the need for more sustainable.

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Graphite Digital Product Passport Template
1. Mine and Extraction Details
●
Mine Name:
●
Mine Location (GPS):
●
Ownership/Operator:
●
Extraction Method:
●
License/Permit Number:
●
Date of Extraction:
●
Environmental & Social Compliance:
2. Raw Material Data
●
Material Type: Natural Graphite
●
Grade/Purity:
●
Batch Number:
●
Volume Extracted (tonnes):
3. Transportation
●
Transport Method: (e.g., Truck, Rail)
●
Route Description:
●
Shipping Company:
●
CO₂ Emissions (estimate):
●
Date/Shipped To:
Supply Chain Element Mapping to DPP Requirements
DPP Requirements Summary
4. Processing/Refining
●
Processing Facility Name:
●
Facility Location:
●
Processing Method:
●
Chemicals/Inputs Used:
●
Energy Use:
●
Waste/Byproducts:
●
Certifications:
5. Manufacturing/Assembly
●
Manufacturer Name:
●
Manufacturing Facility Location:
●
Product Type: (e.g., Battery Anode)
●
Serial/Batch Number:
●
Date of Manufacture:
6. Distribution \& End Use
●
Shipment Details:
●
Recipient Company Name:
●
Intended Product Use: (e.g., EV 
Battery)
●
Product Passport Linkage:
7. Sustainability Metrics
●
Total Carbon Footprint:
●
Water Use:
●
Recyclability Information:
●
End-of-Life Instructions:
8. Compliance \& Traceability
●
Regulatory Documents:
●
ESG Audit Certificate:
●
Chain of Custody Record:
●
Digital Product Passport ID (QR/NFC):

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Requirements Templates 
One Set of Data to Multiple Requirements
SPDX
Structured Data
Requirement
Company
Product 1
Risks
Destination
Date
DPP 
Template 1
CRA
Template 2
Requirements 
List
Data Elements
Requirements 
List
Data Pointers
Requirement
Requirement
Partner
Template 3

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Supporting Distributed Responsibilities
Regulatory Chain
Requirement
Data
Regulation
SPDX
Supply Chain
Evidence
Business
Government

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
SPDX Elements Used to Define  Regulation
Assembling a Regulatory Requirement

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
SPDX makes it easy to read and link
Use Case: Augmenting Information
Data Elements
SPDX 
Supply Chain 
Graph 
Hardware 
companies…
Software 
companies…
Logistics
companies…
Consumer
Data
SPDX Data 
Sharing Graph
Product or 
Supplier Data
Data Provider
Data Source
Graph
CRA & DPP Data
(Regulators & Partners)
Regulators…
……

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
Product Traceability 
Ownership and Custody Tracking - Origin to End of Life
Product 
History
Seller
Buyer
Downstream
Upstream
Spec 
Sheet
Spec 
Sheet
Spec 
Sheet
Product 
History
Spec 
Sheet
Spec 
Sheet
Spec 
Sheet
Product 
History
Accumulated Product History
Accumulated Product History
Traceability

Licensed under CC-BY-SA-3.0
Produced by: Smart Talk Beacon Solution Ltd. 2025
Uranium Mining Metadata
Information Sharing:
●
Substances
●
Contamination 
●
Disposal Method
Structured Document definition
(One example)
RDF
JSON 
Schema
Structured Data Definition 
Industry 
Compliance 
Template  
Data
Template
Disposal Site

Licensed under CC-BY-SA-3.0
alfred@smarttalkbeacon.com
SPDX Import and Export
Master Inventory
Import
Export
SBOM
Operations 
Cryptology 
AIBOM
HBOM
Functional 
Safety 
Security 
Information:
●
VEX Information
●
Vulnerability Threat Level & 
Assessment
●
Update Process
SBOM
Assessment
Operations 
Cryptology 
AIBOM
HBOM
Functional 
Safety 
Security 
Auditing
Inventory B
Inventory A
Supply Chain
Supply Chain

Licensed under CC-BY-SA-3.0
Smart Talk Beacon Solutions Inc.
3739 20th Ave
Regina, SK, CA
S4S 0P2
Presentors: 
Alfred Strauch, President
Steven Carbno, System Architect
Contact Information:
alfred@smarttalkbeacon.com
Web Addresses: 
www.smarttalkbeacon.com
www.actionmethodology.com
www.sysauditor.com

Licensed under CC-BY-SA-3.0
SPDX
Hardware
