---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-021-41-enterprise-with-satellite-facilities
section_title: "Enterprise with Satellite Facilities"
section_number: 4.1
pages: 32-33
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
The most common scenario involves an enterprise with a single headquarters and one or more 
geographically dispersed locations that are not joined by an enterprise-owned physical network 
connection (see Figure 8). Employees at the remote location may not have a full enterprise-
owned local network but still need to access enterprise resources to perform their tasks. The 
enterprise may have a Multiprotocol Label Switch (MPLS) link to the enterprise HQ network but 
may not have adequate bandwidth for all traffic or may not wish for traffic destined for cloud-
based applications/services to traverse through the enterprise HQ network. Likewise, employees 
may be teleworking or in a remote location and using enterprise-owned or personally-owned 
devices. In such cases, an enterprise may wish to grant access to some resources (e.g., employee 
calendar, email) but deny access or restrict actions to more sensitive resources (e.g., HR 
database). 
In this use case, the PE/PA(s) is often hosted as a cloud service (which usually provides superior 
availability and would not require remote workers to rely on enterprise infrastructure to access 
cloud resources) with end assets having an installed agent (see Section 3.2.1) or accessing a 
resource portal (see Section 3.2.3). It may not be most responsive to have the PE/PA(s) hosted on 
the enterprise local network as remote offices and workers must send all traffic back to the 
enterprise network to reach applications/services hosted by cloud services.   
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
24 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
 
Figure 8: Enterprise with Remote Employees 
4.2
