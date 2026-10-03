---
doc_id: 9789240101197-eng
doc_title: "9789240101197-eng"
section_id: page-035
section_title: "Page 35"
pages: 35-35
pdf_page: 35
source_pdf: 9789240101197-eng.pdf
source_sha256: cd157b40eef513c1
text_source: embedded
granularity: page
---
ARCHITECTURE
INTRODUCTION
IMPLEMENTATION
TRACEABILITY
ANNEXES
STRATEGY
COUNTRY EXAMPLES
The key components are as follows.
	
→
Foundational components. These components provide 
system capabilities for organizing and managing master 
data such as product, facility and supplier data. They 
complement other registries, such as the client registry 
and terminology services, in the digital health enterprise 
architecture. These components are foundational in that 
they enable interoperability of transactional data across 
health supply chain information systems and processes. 
They ensure a uniform and standardized referencing 
of products, facilities and suppliers across processes, 
including those for planning, order management and 
warehouse management. 
	
→
Interoperability layer. This component facilitates the 
exchange of data across various systems as well as 
across levels of the health system. Interoperability of 
DSHC systems and DHSC with other digital ecosystems 
is essential to ensure seamless data exchange that 
facilitates efficient supply chain operations and supports 
patient safety by enabling commodity traceability. The 
use of an interoperability layer eliminates the need 
for point-to-point integrations of systems, which over 
time are not sustainable and are expensive to maintain. 
With the interoperability layer, systems that share data 
with other systems need to publish data only once. The 
interoperability layer can transform the data as needed 
and route them to multiple consuming systems. Any 
future integrations can be accomplished by integrating 
with the interoperability layer without disrupting existing 
systems and their integrations.
	
→
HSCISs. These systems support the various supply chain 
processes. Note that one system or digital platform 
might support one or more supply chain processes. For 
example, an enterprise resource planning (ERP) system 
could support procurement, order management and 
warehouse management processes.
Resources such as SCISMM, TSS v2 and the IHE white 
paper on the supply of products for health care (23) 
provide details on the functional and nonfunctional 
requirements of various HSCISs as well as foundational 
and data management capabilities such as product 
master data management and interoperability. These 
resources specify what capabilities should be supported 
by each of the components within the “health supply 
chain information systems” layer.
	
→
Data services. These include components that support 
data aggregation and analysis. Digital infrastructure such 
as the data warehouse and reporting and analytics tools 
would be part of the analytical components of these 
services. These components also include traceability 
services that use the aggregated supply chain data to 
enable health product tracking, tracing and verification. 
(See Chapter 4 for more details on how the DHSC can 
enable traceability capabilities.)
	
→
External systems. These include systems that are 
outside the public health ecosystem but may integrate 
with it to exchange data, including manufacturers’ 
systems, global platforms developed by funders or 
procurement agencies, and global or regional data 
repositories that aggregate master or transactional data.
	
→
Digital ecosystems. These are other digital ecosystems 
that benefit from health supply chain data. Examples 
include the following:
	» regulatory systems that combine supply chain data 
from the dispensing system with health information 
and individuals’ data to conduct post-market 
surveillance and pharmacovigilance;
	» regulatory systems that use supply chain data such 
as data on inventory or products dispensed from 
various facilities to perform product recalls in the 
event of quality issues;
	» finance and insurance systems that combine data 
from the dispensing system with individuals’ 
information to verify and process insurance claims; 
and
	» laboratory or quality monitoring systems that 
integrate with HSCISs to trigger alerts on quality 
issues or trigger swift product quarantines or 
recalls.
Illustrative architectural approaches and governance options
Countries often have a mixture of needs and capabilities 
that should be reflected in their DHSC architecture. They 
can adopt an architecture framework using an approach 
that aligns with their supply chain design and level of digital 
maturity. This section provides examples of architectures 
that are based on digital maturity and examples based on 
supply chain design (with different governance options). 
In practice, however, both factors will help determine the 
appropriate architecture framework.
The examples based on digital maturity use the SCISMM 
maturity levels. Levels 1 and 2 involve manual data entry and 
siloed systems, so this section focuses on the higher maturity 
levels.
Defining the DHSC architecture
25
