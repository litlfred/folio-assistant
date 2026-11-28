---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-043-71-pure-zero-trust-architecture
section_title: "Pure Zero Trust Architecture"
section_number: 7.1
pages: 45-45
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
In a greenfield approach, it would be possible to build a zero trust architecture from the ground 
up. Assuming the enterprise knows the applications/services and workflows that it wants to use 
for its operations, it can produce an architecture based on zero trust tenets for those workflows. 
Once the workflows are identified, the enterprise can narrow down the components needed and 
begin to map how the individual components interact. From that point, it is an engineering and 
organizational exercise in building the infrastructure and configuring the components. This may 
include additional organizational changes depending on how the enterprise is currently set up 
and operating. 
In practice, this is rarely a viable option for federal agencies or any organization with an existing 
network. However, there may be times when an organization is asked to fulfill a new 
responsibility that would require building its own infrastructure. In these cases, it might be 
possible to introduce ZT concepts to some degree. For example, an agency may be given a new 
responsibility that entails building a new application, service, or database. The agency could 
design the newly needed infrastructure around ZT principles and secure system engineering 
[SP8900-160v1], such as evaluating subjects’ trust before granting access and establishing 
micro-perimeters around new resources. The degree of success depends on how dependent this 
new infrastructure is on existing resources (e.g., ID management systems). 
7.2
