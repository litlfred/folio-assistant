---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-016-33-trust-algorithm
section_title: "Trust Algorithm"
section_number: 3.3
pages: 26-28
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
For an enterprise with a ZTA deployment, the policy engine can be thought of as the brain and 
the PE’s trust algorithm as its primary thought process. The trust algorithm (TA) is the process 
used by the policy engine to ultimately grant or deny access to a resource. The policy engine 
takes input from multiple sources (see Section 3): the policy database with observable 
information about subjects, subject attributes and roles, historical subject behavior patterns, 
threat intelligence sources, and other metadata sources. The process can be grouped into broad 
categories and visualized in Figure 7. 
 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
18 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
 
Figure 7: Trust Algorithm Input 
In the figure, the inputs can be broken into categories based on what they provide to the trust 
algorithm.   
• Access request: This is the actual request from the subject. The resource requested is the 
primary information used, but information about the requester is also used. This can 
include OS version, software used (e.g., does the requesting application appear on a list 
of approved applications?), and patch level. Depending on these factors and the asset 
security posture, access to assets might be restricted or denied. 
• Subject database: This is the “who” that is requesting access to a resource [SP800-63]. 
This is the set of subjects (human and processes) of the enterprise or collaborators and a 
collection of subject attributes/privileges assigned. These subjects and attributes form the 
basis of policies for resource access [SP800-162] [NISTIR 7987]. User identities can 
include a mix of logical identity (e.g., account ID) and results of authentication checks 
performed by PEPs. Attributes of identity that can be factored into deriving the 
confidence level include time and geolocation. A collection of privileges given to 
multiple subjects could be thought of as a role, but privileges should be assigned to a 
subject on an individual basis and not simply because they may fit into a particular role in 
the organization. This collection should be encoded and stored in an ID management 
system and policy database. This may also include data about past observed subject 
behavior in some (TA) variants (see Section 3.3.1). 
• Asset database (and observable status): This is the database that contains the known 
status of each enterprise-owned (and possibly known nonenterprise/BYOD) asset 
(physical and virtual, to some extent). This is compared to the observable status of the 
asset making the request and can include OS version, software present, and its integrity, 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
19 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
location (network location and geolocation), and patch level. Depending on the asset state 
compared with this database, access to assets might be restricted or denied. 
• Resource requirements: This set of policies complements the user ID and attributes 
database [SP800-63] and defines the minimal requirements for access to the resource. 
Requirements may include authenticator assurance levels, such as MFA network location 
(e.g., deny access from overseas IP addresses), data sensitivity, and requests for asset 
configuration. These requirements should be developed by both the data custodian (i.e., 
those responsible for the data) and those responsible for the business processes that 
utilize the data (i.e., those responsible for the mission). 
• Threat intelligence: This is an information feed or feeds about general threats and active 
malware operating on the internet. This could also include specific information about 
communication seen from the device that may be suspect (such as queries for possible 
malware command and control nodes). These feeds can be external services or internal 
scans and discoveries and can include attack signatures and mitigations. This is the only 
component that will most likely be under the control of a service rather than the 
enterprise. 
The weight of importance for each data source may be a proprietary algorithm or may be 
configured by the enterprise. These weight values can be used to reflect the importance of the 
data source to an enterprise.  
The final determination is then passed to the PA for execution. The PA’s job is to configure the 
necessary PEPs to enable authorized communication. Depending on how the ZTA is deployed, 
this may involve sending authentication results and connection configuration information to 
gateways and agents or resource portals. PAs may also place a hold or pause on a 
communication session to reauthenticate and reauthorize the connection in accordance with 
policy requirements. The PA is also responsible for issuing the command to terminate the 
connection based on policy (e.g., after a time-out, when the workflow has been completed, due to 
a security alert).
