---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-019-341-network-requirements-to-support-zta
section_title: "Network Requirements to Support ZTA"
section_number: 3.4.1
pages: 30-32
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
1. Enterprise assets have basic network connectivity. The local area network (LAN), 
enterprise controlled or not, provides basic routing and infrastructure (e.g., DNS). The 
remote enterprise asset may not necessarily use all infrastructure services. 
2. The enterprise must be able to distinguish between what assets are owned or 
managed by the enterprise and the devices’ current security posture. This is 
determined by enterprise-issued credentials and not using information that cannot be 
authenticated information (e.g., network MAC addresses that can be spoofed).  
3. The enterprise can observe all network traffic. The enterprise records packets seen on 
the data plane, even if it is not be able to perform application layer inspection (i.e., OSI 
layer 7) on all packets. The enterprise filters out metadata about the connection (e.g., 
destination, time, device identity) to dynamically update policies and inform the PE as it 
evaluates access requests. 
4. Enterprise resources should not be reachable without accessing a PEP. Enterprise 
resources do not accept arbitrary incoming connections from the internet. Resources 
accept custom-configured connections only after a client has been authenticated and 
authorized. These communication paths are set up by the PEP. Resources may not even 
be discoverable without accessing a PEP. This prevents attackers from identifying targets 
via scanning and/or launching DoS attacks against resources located behind PEPs. Note 
that not all resources should be hidden this way; some network infrastructure components 
(e.g., DNS servers) must be accessible.  
5. The data plane and control plane are logically separate. The policy engine, policy 
administrator, and PEPs communicate on a network that is logically separate and not 
directly accessible by enterprise assets and resources. The data plane is used for 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
22 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
application/service data traffic. The policy engine, policy administrator, and PEPs use the 
control plane to communicate and manage communication paths between assets. The 
PEPs must be able to send and receive messages from both the data and control planes. 
6. Enterprise assets can reach the PEP component. Enterprise subjects must be able to 
access the PEP component to gain access to resources. This could take the form of a web 
portal, network device, or software agent on the enterprise asset that enables the 
connection.  
7. The PEP is the only component that accesses the policy administrator as part of a 
business flow. Each PEP operating on the enterprise network has a connection to the 
policy administrator to establish communication paths from clients to resources. All 
enterprise business process traffic passes through one or more PEPs.  
8. Remote enterprise assets should be able to access enterprise resources without 
needing to traverse enterprise network infrastructure first. For example, a remote 
subject should not be required to use a link back to the enterprise network (i.e., virtual 
private network [VPN]) to access services utilized by the enterprise and hosted by a 
public cloud provider (e.g., email). 
9. The infrastructure used to support the ZTA access decision process should be made 
scalable to account for changes in process load. The PE(s), PA(s), and PEPs used in a 
ZTA become the key components in any business process. Delay or inability to reach a 
PEP (or inability of the PEPs to reach the PA/PE) negatively impacts the ability to 
perform the workflow. An enterprise implementing a ZTA needs to provision the 
components for the expected workload or be able to rapidly scale the infrastructure to 
handle increased usage when needed. 
10. Enterprise assets may not be able to reach certain PEPs due to policy or observable 
factors. For example, there may be a policy stating that mobile assets may not be able to 
reach certain resources if the requesting asset is located outside of the enterprise’s home 
country. These factors could be based on location (geolocation or network location), 
device type, or other criteria. 
 
 
 
 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
23 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
4
