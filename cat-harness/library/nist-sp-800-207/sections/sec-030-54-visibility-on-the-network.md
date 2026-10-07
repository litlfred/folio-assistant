---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-030-54-visibility-on-the-network
section_title: "Visibility on the Network"
section_number: 5.4
pages: 38-39
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
As mentioned in Section 3.4.1, all traffic is inspected and logged on the network and analyzed to 
identify and react to potential attacks against the enterprise. However, as also mentioned, some 
(possibly the majority) of the traffic on the enterprise network may be opaque to layer 3 network 
analysis tools. This traffic may originate from nonenterprise-owned assets (e.g., contracted 
services that use the enterprise infrastructure to access the internet) or applications/services that 
are resistant to passive monitoring. The enterprise that cannot perform deep packet inspection or 
examine the encrypted traffic and must use other methods to assess a possible attacker on the 
network.  
That does not mean that the enterprise is unable to analyze encrypted traffic that it sees on the 
network. The enterprise can collect metadata (e.g., source and destination addresses, etc.) about 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
30 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
the encrypted traffic and use that to detect an active attacker or possible malware communicating 
on the network. Machine learning techniques [Anderson] can be used to analyze traffic that 
cannot be decrypted and examined. Employing this type of machine learning would allow the 
enterprise to categorize traffic as valid or possibly malicious and subject to remediation.  
5.5
