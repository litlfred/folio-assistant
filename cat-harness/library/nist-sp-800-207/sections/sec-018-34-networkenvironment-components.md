---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-018-34-networkenvironment-components
section_title: "Network/Environment Components"
section_number: 3.4
pages: 30-30
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
In a ZT environment, there should be a separation (logical or possibly physical) of the 
communication flows used to control and configure the network and application/service 
communication flows used to perform the actual work of the organization. This is often broken 
down to a control plane for network control communication and a data plane for 
application/service communication flows [Gilman]. 
The control plane is used by various infrastructure components (both enterprise-owned and from 
service providers) to maintain and configure assets; judge, grant, or deny access to resources; and 
perform any necessary operations to set up communication paths between resources. The data 
plane is used for actual communication between software components. This communication 
channel may not be possible before the path has been established via the control plane. For 
example, the control plane could be used by the PA and PEP to set up the communication path 
between the subject and the enterprise resource. The application/service workload would then 
use the data plane path that was established.
