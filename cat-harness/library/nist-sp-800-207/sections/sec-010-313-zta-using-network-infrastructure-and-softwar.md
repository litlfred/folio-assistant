---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-010-313-zta-using-network-infrastructure-and-softwar
section_title: "ZTA Using Network Infrastructure and Software Defined Perimeters"
section_number: 3.1.3
pages: 21-22
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
The last approach uses the network infrastructure to implement a ZTA. The ZTA implementation 
could be achieved by using an overlay network (i.e., layer 7 but also could be set up lower of the 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
13 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
OSI network stack). These approaches are sometimes referred to as software defined perimeter 
(SDP) approaches and frequently include concepts from Software Defined Networks (SDN) 
[SDNBOOK] and intent-based networking (IBN) [IBNVN]. In this approach, the PA acts as the 
network controller that sets up and reconfigures the network based on the decisions made by the 
PE. The clients continue to request access via PEPs, which are managed by the PA component.   
When the approach is implemented at the application network layer (i.e., layer 7), the most 
common deployment model is the agent/gateway (see Section 3.2.1). In this implementation, the 
agent and resource gateway (acting as the single PEP and configured by the PA) establish a 
secure channel used for communication between the client and resource. There may be other 
variations of this model, as well for cloud virtual networks, non-IP based networks, etc. 
3.2
