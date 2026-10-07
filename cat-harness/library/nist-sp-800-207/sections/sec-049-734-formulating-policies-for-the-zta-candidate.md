---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-049-734-formulating-policies-for-the-zta-candidate
section_title: "Formulating Policies for the ZTA Candidate"
section_number: 7.3.4
pages: 48-49
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
The process of identifying a candidate service or business workflow depends on several factors: 
the importance of the process to the organization, the group of subjects affected, and the current 
state of resources used for the workflow. The value of the asset or workflow based on risk to the 
asset or workflow can be evaluated using the NIST Risk Management Framework [SP800-37].  
After the asset or workflow is identified, identify all upstream resources (e.g., ID management 
systems, databases, micro-services), downstream resources (e.g., logging, security monitoring), 
and entities (e.g., subjects, service accounts) that are used or affected by the workflow. This may 
influence the candidate choice as a first migration to ZTA. An application/service used by an 
identified subset of enterprise subjects (e.g., a purchasing system) may be preferred over one that 
is vital to the entire subject base of the enterprise (e.g., email). 
The enterprise administrators then need to determine the set of criteria (if using a criteria-based 
TA) or confidence level weights (if using a score-based TA) for the resources used in the 
candidate business process (see Section 3.3.1). Administrators may need to adjust these criteria 
or values during the tuning phase. These adjustments are necessary to ensure that policies are 
effective but do not hinder access to resources.  
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
40 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207
