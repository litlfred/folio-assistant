---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-027-51-subversion-of-zta-decision-process
section_title: "Subversion of ZTA Decision Process"
section_number: 5.1
pages: 37-37
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
In ZTA, the policy engine and policy administrator are the key components of the entire 
enterprise. No communication between enterprise resources occurs unless it is approved and 
possibly configured by the PE and PA. This means that these components must be properly 
configured and maintained. Any enterprise administrator with configuration access to the PE’s 
rules may be able to perform unapproved changes or make mistakes that can disrupt enterprise 
operations. Likewise, a compromised PA could allow access to resources that would otherwise 
not be approved (e.g., to a subverted, personally-owned device). Mitigating associated risks 
means the PE and PA components must be properly configured and monitored, and any 
configuration changes must be logged and subject to audit.  
5.2
