---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-033-57-use-of-non-person-entities-npe-in-zta-adminis
section_title: "Use of Non-person Entities (NPE) in ZTA Administration"
section_number: 5.7
pages: 39-41
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Artificial intelligence and other software-based agents are being deployed to manage security 
issues on enterprise networks. These components need to interact with the management 
components of ZTA (e.g., policy engine, policy administrator), sometimes in lieu of a human 
administrator. How these components authenticate themselves in an enterprise implementing a 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
31 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
ZTA is an open issue. It is assumed that most automated technology systems will use some 
means to authenticate when using an API to resource components.   
The biggest risk when using automated technology for configuration and policy enforcement is 
the possibility of false positives (innocuous actions mistaken for attacks) and false negatives 
(attacks mistaken for normal activity) impacting the security posture of the enterprise. This can 
be reduced with regular retuning analysis to correct mistaken decisions and improve the decision 
process.  
The associated risk is that an attacker will be able to induce or coerce an NPE to perform some 
task that the attacker is not privileged to perform. The software agent may have a lower bar for 
authentication (e.g., API key versus MFA) to perform administrative or security-related tasks 
compared with a human user. If an attacker can interact with the agent, they could theoretically 
trick the agent into allowing the attacker greater access or into performing some task on behalf of 
the attacker. There is also a risk that an attacker could gain access to a software agent’s 
credentials and impersonate the agent when performing tasks. 
 
 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
32 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
6
