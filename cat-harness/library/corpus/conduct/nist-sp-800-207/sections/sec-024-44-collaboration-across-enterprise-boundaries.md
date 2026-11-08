---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-024-44-collaboration-across-enterprise-boundaries
section_title: "Collaboration Across Enterprise Boundaries"
section_number: 4.4
pages: 35-36
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
A fourth use case is cross-enterprise collaboration. For example, there is a project involving 
employees from Enterprise A and Enterprise B (see Figure 11). The two enterprises may be 
separate federal agencies (G2G) or even a federal agency and a private enterprise (G2B). 
Enterprise A operates the database used for the project but must allow access to the data for 
certain members of Enterprise B. Enterprise A can set up specialized accounts for the employees 
of Enterprise B to access the required data and deny access to all other resources, but this can 
quickly become difficult to manage. Having both organizations enrolled in a federated ID 
management system would allow quicker establishment of these relationships provided that both 
organizations’ PEPs can authenticate subjects in a federated ID community.   
 
Figure 11: Cross-Enterprise Collaboration 
This scenario can be similar to Use Case 1 (Section 4.1) as employees of both enterprises may 
not be located on their organizations’ network infrastructures, and the resource they need to 
access may be within one enterprise environment or hosted in the cloud. This means that there do 
not need to be complex firewall rules or enterprise-wide access control lists (ACLs) allowing 
certain IP addresses belonging to Enterprise B to access resources in Enterprise A based on 
Enterprise A’s access policies. How this access is accomplished depends on the technology in 
use. Similar to Use Case 1, a PE and PA hosted as a cloud service may provide availability to all 
parties without having to establish a VPN or similar. The employees of Enterprise B may be 
asked to install a software agent on their asset or access the necessary data resources through a 
web gateway (see Section 3.2.3). 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
27 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
4.5
