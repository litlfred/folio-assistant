---
doc_id: arxiv-2601.04544v1
doc_title: "TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration"
section_id: sec-017-badcase
section_title: "Badcase"
section_number: null
pages: 15-16
source_pdf: arxiv-2601.04544v1.pdf
source_sha256: 5472dcd690fe1c89
toc_source: outline
---
Incomplete problem descriptions
Input Query: What should I do if a webpage loads very slowly?
TCAR Output:
<Reason> The user reports that “the webpage loads very slowly,” which requires diagnosis from both the
network path and acceleration layers. The Network Agent can analyze public/private network latency, packet
loss, jitter, and path quality. The CDN Agent can examine CDN access latency, origin fetch behavior, and
distribution policies. If EdgeOne is being used, the EO Agent should investigate origin latency, edge node
issues, and configuration problems. </Reason>
<ID>network_agent</ID>
<ID>cdn_agent</ID>
<ID>eo_agent</ID>
Insuﬀicient understanding of highly domain-specific scenarios
15
TCAndon-Router
Agent List:
<Agent>
<Name>CKafka Message Queue Agent</Name>
<Description>
Query CKafka instance information and diagnose CKafka-related issues.</Description>
<ID>ckafka_agent</ID>
</Agent>
<Agent>
<Name>RocketMQ Message Queue Agent</Name>
<Description>
Analyze abnormal RocketMQ topic production rates and query configuration changes (
scaling/reconfiguration).
</Description>
<ID>rocketMQ_agent</ID>
</Agent>
Input Query: Configuration change for CKafka message queue
TCAR Output:
<Reason> The user reports a “message queue configuration change.”
The RocketMQ Message
Queue Agent has the capability to handle configuration change queries and can effectively address
the user’s issue. </Reason>
<ID>rocketMQ_agent</ID>
16
