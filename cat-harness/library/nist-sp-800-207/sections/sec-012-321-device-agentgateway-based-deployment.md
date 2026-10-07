---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-012-321-device-agentgateway-based-deployment
section_title: "Device Agent/Gateway-Based Deployment"
section_number: 3.2.1
pages: 22-23
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
In this deployment model, the PEP is divided into two components that reside on the resource or 
as a component directly in front of a resource. For example, each enterprise-issued asset has an 
installed device agent that coordinates connections, and each resource has a component (i.e., 
gateway) that is placed directly in front so that the resource communicates only with the 
gateway, essentially serving as a proxy for the resource. The agent is a software component that 
directs some (or all) traffic to the appropriate PEP in order for requests to be evaluated. The 
gateway is responsible for communicating with the policy administrator and allowing only 
approved communication paths configured by the policy administrator (see Figure 3).  
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
14 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
 
Figure 3: Device Agent/Gateway Model 
In a typical scenario, a subject with an enterprise-issued laptop wishes to connect to an enterprise 
resource (e.g., human resources application/database). The access request is taken by the local 
agent, and the request is forwarded to the policy administrator. The policy administrator and 
policy engine could be an enterprise local asset or a cloud-hosted service. The policy 
administrator forwards the request to the policy engine for evaluation. If the request is 
authorized, the policy administrator configures a communication channel between the device 
agent and the relevant resource gateway via the control plane. This may include information such 
as an internet protocol (IP) address, port information, session key, or similar security artifacts. 
The device agent and gateway then connect, and encrypted application/service data flows begin. 
The connection between the device agent and resource gateway is terminated when the workflow 
is completed or when triggered by the policy administrator due to a security event (e.g., session 
time-out, failure to reauthenticate). 
This model is best utilized for enterprises that have a robust device management program in 
place as well as discrete resources that can communicate with the gateway. For enterprises that 
heavily utilize cloud services, this is a client-server implementation of the Cloud Security 
Alliance (CSA) Software Defined Perimeter (SDP) [CSA-SDP]. This model is also appropriate 
for enterprises that do not want a BYOD policy in place. Access is possible only via the device 
agent, which can be placed on enterprise-owned assets.
