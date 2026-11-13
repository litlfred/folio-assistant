---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-051-736-initial-deployment-and-monitoring
section_title: "Initial Deployment and Monitoring"
section_number: 7.3.6
pages: 49-50
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Once the candidate workflow and ZTA components are chosen, the initial deployment can start. 
Enterprise administrators must implement the developed policies by using the selected 
components but may wish to operate in an observation and monitoring mode at first. Few 
enterprise policy sets are complete in their first iterations: important user accounts (e.g., 
administrator accounts) may be denied access to resources they need or may not need all the 
access privileges they have been assigned. 
The new ZT business workflow could be operated in reporting-only mode for some time to make 
sure the policies are effective and workable. This also allows the enterprise to gain an 
understanding of baseline asset and resource access requests, behavior, and communication 
patterns. Reporting-only means that access should be granted for most requests, and logs and 
traces of connections should be compared with the initial developed policy. Basic policies such 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
41 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
as denying requests that fail MFA or appear from known, attacker controlled or subverted IP 
addresses should be enforced and logged, but after initial deployment, access polices should be 
more lenient to collect data from actual interactions of the ZT workflow. Once the baseline 
activity patterns for the workflow has been established, anomalous behavior can be more easily 
identify. If it is not possible to operate in a more lenient nature, enterprise network operators 
should monitor logs closely and be prepared to modify access policies based on operational 
experience.
