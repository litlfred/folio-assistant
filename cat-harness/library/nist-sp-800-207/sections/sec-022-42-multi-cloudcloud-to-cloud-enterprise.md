---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-022-42-multi-cloudcloud-to-cloud-enterprise
section_title: "Multi-cloud/Cloud-to-Cloud Enterprise"
section_number: 4.2
pages: 33-34
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
One increasingly common use case for deploying a ZTA is an enterprise utilizing multiple cloud 
providers (see Figure 9). In this use case, the enterprise has a local network but uses two or more 
cloud service providers to host applications/services and data. Sometimes, the application/service 
is hosted on a cloud service that is separate from the data source. For performance and ease of 
management, the application hosted in Cloud Provider A should be able to connect directly to the 
data source hosted in Cloud Provider B rather than force the application to tunnel back through 
the enterprise network. 
 
Figure 9: Multi-cloud Use Case 
This use case is the server-server implementation of the CSA’s software defined perimeter (SDP) 
specification [CSA-SDP]. As enterprises move to more cloud-hosted applications and services, it 
becomes apparent that relying on the enterprise perimeter for security becomes a liability. As 
discussed in Section 2.2, ZT principles take the view that there should be no difference between 
enterprise-owned and -operated network infrastructure and infrastructure owned and operated by 
any other service provider. The zero trust approach to multi-cloud use is to place PEPs at the 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
25 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
access points of each application/service and data source. The PE and PA may be services 
located in either cloud or even on a third cloud provider. The client (via a portal or local installed 
agent) then accesses the PEPs directly. That way, the enterprise can still manage access to 
resources even when hosted outside the enterprise. One challenge is that different cloud 
providers have unique ways of implementing similar functionality. Enterprise architects will 
need to be aware of the how to implement their enterprise ZTA with each cloud provider they 
utilize. 
4.3
