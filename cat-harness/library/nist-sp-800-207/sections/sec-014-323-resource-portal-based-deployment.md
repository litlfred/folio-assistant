---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-014-323-resource-portal-based-deployment
section_title: "Resource Portal-Based Deployment"
section_number: 3.2.3
pages: 24-25
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
In this deployment model, the PEP is a single component that acts as a gateway for subject 
requests. The gateway portal can be for an individual resource or a secure enclave for a 
collection of resources used for a single business function. One example would be a gateway 
portal into a private cloud or data center containing legacy applications as shown in Figure 5. 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
16 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
 
Figure 5: Resource Portal Model 
The primary benefit of this model over the others is that a software component does not need to 
be installed on all client devices. This model is also more flexible for BYOD policies and inter-
organizational collaboration projects. Enterprise administrators do not need to ensure that each 
device has the appropriate device agent before use. However, limited information can be inferred 
from devices requesting access. This model can only scan and analyze assets and devices once 
they connect to the PEP portal and may not be able to continuously monitor them for malware, 
unpatched vulnerabilities, and appropriate configuration.  
The main difference with this model is there is no local agent that handles requests, and so the 
enterprise may not have full visibility or arbitrary control over assets as it can only see/scan them 
when they connect to a portal. The enterprise may be able to employ measures such as browser 
isolation to mitigate or compensate. These assets may be invisible to the enterprise between these 
sessions. This model also allows attackers to discover and attempt to access the portal or attempt 
a denial-of-service (DoS) attack against the portal. The portal systems should be well-
provisioned to provide availability against a DoS attack or network disruption.
