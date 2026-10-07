---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-013-322-enclave-based-deployment
section_title: "Enclave-Based Deployment"
section_number: 3.2.2
pages: 23-24
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
This deployment model is a variation of the device agent/gateway model above. In this model, 
the gateway components may not reside on assets or in front of individual resources but instead 
reside at the boundary of a resource enclave (e.g., on-location data center) as shown in Figure 4. 
Usually, these resources serve a single business function or may not be able to communicate 
directly to a gateway (e.g., legacy database system that does not have an application 
programming interface [API] that can be used to communicate with a gateway). This deployment 
model may also be useful for enterprises that use cloud-based micro-services for a single 
business processes (e.g., user notification, database lookup, salary disbursement). In this model, 
the entire private cloud is located behind a gateway. 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
15 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
 
Figure 4: Enclave Gateway Model 
It is possible for this model to be a hybrid with the device agent/gateway model. In this model, 
enterprise assets have a device agent that is used to connect to enclave gateways, but these 
connections are created using the same process as the basic device agent/gateway model.  
This model is useful for enterprises that have legacy applications or on-premises data centers that 
cannot have individual gateways in place. The enterprise needs a robust asset and configuration 
management program in place to install/configure the device agents. The downside is that the 
gateway protects a collection of resources and may not be able to protect each resource 
individually. This may also allow for subjects to see resources which they do not have privileges 
to access.
