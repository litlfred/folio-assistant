---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-031-55-storage-of-system-and-network-information
section_title: "Storage of System and Network Information"
section_number: 5.5
pages: 39-39
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
A related threat to enterprise monitoring and analysis of network traffic is the analysis 
component itself. If monitor scans, network traffic, and metadata are being stored for building 
contextual policies, forensics, or later analysis, that data becomes a target for attackers. Just like 
network diagrams, configuration files, and other assorted network architecture documents, these 
resources should be protected. If an attacker can successfully gain access to this information, 
they may be able to gain insight into the enterprise architecture and identify assets for further 
reconnaissance and attack. 
Another source of reconnaissance information for an attacker in a ZT enterprise is the 
management tool used to encode access policies. Like stored traffic, this component contains 
access policies to resources and can give an attacker information on which accounts are most 
valuable to compromise (e.g., the ones that have access to the desired data resources). 
As for all valuable enterprise data, adequate protections should be in place to prevent 
unauthorized access and access attempts. As these resources are vital to security, they should 
have the most restrictive access policies and be accessible only from designated or dedicated 
administrator accounts. 
5.6
