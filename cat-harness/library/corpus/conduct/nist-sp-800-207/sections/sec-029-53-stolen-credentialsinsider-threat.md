---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-029-53-stolen-credentialsinsider-threat
section_title: "Stolen Credentials/Insider Threat"
section_number: 5.3
pages: 38-38
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Properly implemented ZT, information security and resiliency policies, and best practices reduce 
the risk of an attacker gaining broad access via stolen credentials or insider attack. The ZT 
principle of no implicit trust based on network location means attackers need to compromise an 
existing account or device to gain a foothold in an enterprise. A properly developed and 
implemented ZTA should prevent a compromised account or asset from accessing resources 
outside its normal purview or access patterns. This means that accounts with access policies 
around resources that an attacker is interested in would be the primary targets for attackers.  
Attackers may use phishing, social engineering, or a combination of attacks to obtain credentials 
of valuable accounts. “Valuable” may mean different things based on the attacker’s motivation. 
For instance, enterprise administrator accounts may be valuable, but attackers interested in 
financial gain may consider accounts that have access to financial or payment resources of equal 
value. Implementation of MFA for access requests may reduce the risk of information loss from 
a compromised account. However, an attacker with valid credentials (or a malicious insider) may 
still be able to access resources for which the account has been granted access. For example, an 
attacker or compromised employee who has the credentials and enterprise-owned asset of a valid 
human resources employee may still be able to access an employee database.   
ZTA reduces risk and prevents any compromised accounts or assets from moving laterally 
throughout the network. If the compromised credentials are not authorized to access a particular 
resource, they will continue to be denied access to that resource. In addition, a contextual trust 
algorithm (see Section 3.3.1) is more likely to detect and respond quickly to this attack than 
when occurring in a legacy, perimeter-based network. The contextual TA can detect access 
patterns that are out of normal behavior and deny the compromised account or insider threat 
access to sensitive resources.  
5.4
