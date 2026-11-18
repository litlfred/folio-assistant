---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-015-324-device-application-sandboxing
section_title: "Device Application Sandboxing"
section_number: 3.2.4
pages: 25-26
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Another variation of the agent/gateway deployment model is having vetted applications or 
processes run compartmentalized on assets. These compartments could be virtual machines, 
containers, or some other implementation, but the goal is the same: to protect the application or 
instances of applications from a possibly compromised host or other applications running on the 
asset.  
 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
17 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
 
Figure 6: Application Sandboxes 
In Figure 6, the subject device runs approved, vetted applications in a sandbox. The applications 
can communicate with the PEP to request access to resources, but the PEP will refuse requests 
from other applications on the asset. The PEP could be an enterprise local service or a cloud 
service in this model. 
The main advantage of this model variant is that individual applications are segmented from the 
rest of the asset. If the asset cannot be scanned for vulnerabilities, these individual, sandboxed 
applications may be protected from a potential malware infection on the host asset. One of the 
disadvantages of this model is that enterprises must maintain these sandboxed applications for all 
assets and may not have full visibility into client assets. The enterprise also needs to make sure 
each sandboxed application is secure, which may require more effort than simply monitoring 
devices.  
3.3
