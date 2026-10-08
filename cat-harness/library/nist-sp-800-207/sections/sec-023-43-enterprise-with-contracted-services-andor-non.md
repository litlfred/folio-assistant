---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-023-43-enterprise-with-contracted-services-andor-non
section_title: "Enterprise with Contracted Services and/or Nonemployee Access"
section_number: 4.3
pages: 34-35
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Another common scenario is an enterprise that includes on-site visitors and/or contracted service 
providers that require limited access to enterprise resources to do their work (see Figure 10). For 
example, an enterprise has its own internal applications/services, databases, and assets. These 
include services contracted out to providers who may occasionally be on-site to provide 
maintenance (e.g., smart heating and lighting systems that are owned and managed by external 
providers). These visitors and service providers will need network connectivity to perform their 
tasks. A zero trust enterprise could facilitate this by allowing these devices and any visiting 
service technician access to the internet while obscuring enterprise resources.  
 
Figure 10: Enterprise with Nonemployee Access 
In this example, the organization also has a conference center where visitors interact with 
employees. Again, with a ZTA approach of SDPs, employee devices and subjects are 
differentiated and may be able to access appropriate enterprise resources. Visitors to the campus 
can have internet access but cannot access enterprise resources. They may not even be able to 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
26 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
discover enterprise services via network scans (i.e., prevent active network reconnaissance/east-
west movement). 
In this use case, the PE(s) and PA(s) could be hosted as a cloud service or on the LAN (assuming 
little or no use of cloud-hosted services). The enterprise assets could have an installed agent (see 
Section 3.2.1) or access resources via a portal (see Section 3.2.3). The PA(s) ensures that all 
nonenterprise assets (those that do not have installed agents or cannot connect to a portal) cannot 
access local resources but may access the internet. 
4.4
