---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-028-52-denial-of-service-or-network-disruption
section_title: "Denial-of-Service or Network Disruption"
section_number: 5.2
pages: 37-38
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
In ZTA, the PA is the key component for resource access. Enterprise resources cannot connect to 
each other without the PA’s permission and, possibly, configuration action. If an attacker 
disrupts or denies access to the PEP(s) or PE/PA (i.e., DoS attack or route hijack), it can 
adversely impact enterprise operations. Enterprises can mitigate this threat by having the policy 
enforcement reside in a properly secured cloud environment or be replicated in several locations 
following guidance on cyber resiliency [SP 800-160v2]. 
This mitigates the risk but does not eliminate it. Botnets such as Mirai produce massive DoS 
attacks against key internet service providers and disrupt service to millions of internet users.5 It 
is also possible that an attacker could intercept and block traffic to a PEP or PA from a portion or 
all of the user accounts within an enterprise (e.g., a branch office or even a single remote 
employee). In such cases, only a portion of enterprise subjects is affected. This is also possible in 
legacy remote-access VPNs and is not unique to ZTA.  
A hosting provider may also accidentally take a cloud-based PE or PA offline. Cloud services 
have experienced disruptions in the past, both infrastructure as a service (IaaS)6 and SaaS.7 An 
operational error could prevent an entire enterprise from functioning if the policy engine or 
policy administrator component becomes inaccessible from the network.  
 
5 https://blog.cloudflare.com/inside-mirai-the-infamous-iot-botnet-a-retrospective-analysis/ 
6 https://aws.amazon.com/message/41926/  
7 https://www.nzherald.co.nz/business/news/article.cfm?c_id=3&objectid=12286870 
 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
29 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
There is also the risk that enterprise resources may not be reachable from the PA, so even if 
access is granted to a subject, the PA cannot configure the communication path from the 
network. This could happen due to a DDoS attack or simply due to unexpected heavy usage. This 
is similar to any other network disruption in that some or all enterprise subjects cannot access a 
particular resource due to that resource not being available for some reason. 
5.3
