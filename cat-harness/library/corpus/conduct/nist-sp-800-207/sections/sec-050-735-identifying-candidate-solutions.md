---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-050-735-identifying-candidate-solutions
section_title: "Identifying Candidate Solutions"
section_number: 7.3.5
pages: 49-49
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Once a list of candidate business processes has been developed, enterprise architects can 
compose a list of candidate solutions. Some deployment models (see Section 3.1) are better 
suited to particular workflows and current enterprise ecosystems. Likewise, some vendor 
solutions are better suited to some use cases than others. These are some factors to consider: 
• Does the solution require that components be installed on the client asset? This may 
limit business processes where nonenterprise-owned assets are used or desired, such as 
BYOD or cross-agency collaborations.  
• Does the solution work where the business process resources exist entirely on 
enterprise premises? Some solutions assume that requested resources will reside in the 
cloud (so-called north-south traffic) and not within an enterprise perimeter (east-west 
traffic). The location of candidate business process resources will influence candidate 
solutions as well as the ZTA for the process.  
• Does the solution provide a means to log interactions for analysis? A key component 
of ZT is the collection and use of data related to the process flow that feeds back into the 
PE when making access decisions.  
• Does the solution provide broad support for different applications, services, and 
protocols? Some solutions may support a broad range of protocols (web, secure shell 
[SSH], etc.) and transports (IPv4 and IPv6), while others may only work with a narrow 
focus such as web or email.  
• Does the solution require changes to subject behavior? Some solutions may require 
additional steps to perform a given workflow. This may change how enterprise subjects 
perform the workflow. 
One solution is to model an existing business process as a pilot program rather than just a 
replacement. This pilot program could be made general to apply to several business processes or 
be made specific to one use case. The pilot can be used as a “proving ground” for ZTA before 
transitioning subjects to the ZTA deployment and away from the legacy process infrastructure.
