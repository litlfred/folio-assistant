---
doc_id: 9789240116191-eng
doc_title: "9789240116191-eng"
section_id: page-039
section_title: "Page 39"
pages: 39-39
pdf_page: 39
source_pdf: 9789240116191-eng.pdf
source_sha256: 9cc9ca42d30db9eb
text_source: embedded
granularity: page
---
30
Managing change to institutionalize standardized product master data
Change management is essential to ensure that operational 
processes, systems, and people transition to using 
standardized master data without disrupting existing 
operations. Effective change management enables the 
successful adoption and use of updated master data 
structures, processes, and associated system enhancements.
Without a comprehensive change management plan, 
transitions can be unpredictable and may result in 
increased cost, effort, delays, and rework. This chapter 
outlines the steps required to develop appropriate change 
management procedures to institutionalize the use of 
standardized product master data, processes, and tools.
INPUTS
STEPS
RESOURCES
OUTPUTS
•	 Standardized 
master data 
coding schemes 
and structures.
•	 Master data 
management 
procedures 
including master 
data governance 
policies.
•	 Data sharing and 
data use policies.
Identify all the systems and processes that 
need standardized product master data.
•	 Change 
management 
plan for all 
systems and 
processes 
to use NPC.
Identify and define the specific changes 
needed to institutionalize the use of 
standardized product master data across 
people, processes, and systems. 
These may include:
•	 	Process changes to ensure that 
standardized product master data is 
uniformly referenced across all operational 
processes, including forecasting, 
procurement, inventory receipt and 
management, shipping, and dispensing.
•	 System enhancements across all health 
and supply chain information systems 
to enable them to receive, store, and use 
standardized product master data 
in all transactions.
•	 Data structure and model changes to 
accommodate standardized product 
master data and enable linkage with 
existing datasets where necessary.
•	 Data exchange mechanisms and event 
triggers such as data additions and 
updates—for sharing standardized product 
master data across all relevant systems.
Develop a change management plan 
to institutionalise use of NPC
STEP 1
Best practices:
When global identifiers such as GTINs are not 
available—e.g., if a manufacturer has not yet subscribed 
for a GTIN—it is recommended to use a local identifier for 
trade items. These local identifiers can later be mapped 
to GTINs once they become available.
•	
In the example below, GTINs are mapped to a local 
identifier attribute called Country Trade Item Identifier. 
This attribute is designed to default to GTINs when they 
are available. In the absence of GTINs, the attribute 
generates and maintains a local identifier, which can 
be replaced with a GTIN once it is assigned to the 
trade item.
