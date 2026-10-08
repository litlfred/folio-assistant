---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-032-56-reliance-on-proprietary-data-formats-or-solut
section_title: "Reliance on Proprietary Data Formats or Solutions"
section_number: 5.6
pages: 39-39
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
ZTA relies on several different data sources to make access decisions, including information 
about the requesting subject, asset used, enterprise and external intelligence, and threat analysis. 
Often, the assets used to store and process this information do not have a common, open standard 
on how to interact and exchange information. This can lead to instances where an enterprise is 
locked into a subset of providers due to interoperability issues. If one provider has a security 
issue or disruption, an enterprise may not be able to migrate to a new provider without extreme 
cost (e.g., replacing several assets) or going through a long transition program (e.g., translating 
policy rules from one proprietary format to another). Like DoS attacks, this risk is not unique to 
ZTA, but because ZTA is heavily dependent on the dynamic access of information (both 
enterprise and service providers), disruption can affect the core business functions of an 
enterprise. To mitigate associated risks, enterprises should evaluate service providers on a 
holistic basis by considering factors such as vendor security controls, enterprise switching costs, 
and supply chain risk management in addition to more typical factors such as performance, 
stability, etc. 
5.7
