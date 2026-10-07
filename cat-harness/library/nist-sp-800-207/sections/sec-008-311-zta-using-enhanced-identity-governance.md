---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-008-311-zta-using-enhanced-identity-governance
section_title: "ZTA Using Enhanced Identity Governance"
section_number: 3.1.1
pages: 20-21
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
The enhanced identity governance approach to developing a ZTA uses the identity of actors as 
the key component of policy creation. If it were not for subjects requesting access to enterprise 
resources, there would be no need to create access polices. For this approach, enterprise resource 
access policies are based on identity and assigned attributes. The primary requirement for 
resource access is based on the access privileges granted to the given subject. Other factors such 
as device used, asset status, and environmental factors may alter the final confidence level 
calculation (and ultimate access authorization) or tailor the result in some way, such as granting 
only partial access to a given data source based on network location. Individual resources or PEP 
 
4 https://www.idmanagement.gov/topics/fpki/ 
 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
12 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
components protecting the resource must have a way to forward requests to a policy engine 
service or authenticate the subject and approve the request before granting access. 
Enhanced identity governance-based approaches for enterprises are often employed using an 
open network model or an enterprise network with visitor access or frequent nonenterprise 
devices on the network (such as with the use case in Section 4.3 below). Network access is 
initially granted to all assets but access to enterprise resources are restricted to identities with the 
appropriate access privileges. There is a downside in granting basic network connectivity as 
malicious actors could still attempt network reconnaissance and/or use the network to launch 
denial of service attacks either internally or against a third party. Enterprises still need to monitor 
and respond to such behavior before it impacts workflows.  
The identity-driven approach works well with the resource portal model (see Section 3.2.3) since 
device identity and status provide secondary support data to access decisions. Other models work 
as well, depending on policies in place. Identity-driven approaches also work well for enterprises 
that use cloud-based applications/services that may not allow for enterprise-owned or -operated 
ZT security components to be used (such as many SaaS offerings). The enterprise can use the 
identity of requestors to form and enforce policy on these platforms.
