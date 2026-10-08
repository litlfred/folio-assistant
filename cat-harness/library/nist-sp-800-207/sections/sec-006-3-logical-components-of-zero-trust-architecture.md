---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-006-3-logical-components-of-zero-trust-architecture
section_title: "Logical Components of Zero Trust Architecture"
section_number: 3
pages: 18-20
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
There are numerous logical components that make up a ZTA deployment in an enterprise. These 
components may be operated as an on-premises service or through a cloud-based service. The 
conceptual framework model in Figure 2 shows the basic relationship between the components 
and their interactions. Note that this is an ideal model showing logical components and their 
interactions. From Figure 1, the policy decision point (PDP) is broken down into two logical 
components: the policy engine and policy administrator (defined below). The ZTA logical 
components use a separate control plane to communicate, while application data is 
communicated on a data plane (see Section 3.4). 
 
 
Figure 2: Core Zero Trust Logical Components 
The component descriptions: 
• Policy engine (PE): This component is responsible for the ultimate decision to grant 
access to a resource for a given subject. The PE uses enterprise policy as well as input 
from external sources (e.g., CDM systems, threat intelligence services described below) 
as input to a trust algorithm (see Section 3.3 for more details) to grant, deny, or revoke 
access to the resource. The PE is paired with the policy administrator component. The 
policy engine makes and logs the decision (as approved, or denied), and the policy 
administrator executes the decision. 
• Policy administrator (PA): This component is responsible for establishing and/or 
shutting down the communication path between a subject and a resource (via commands 
to relevant PEPs). It would generate any session-specific authentication and 
authentication token or credential used by a client to access an enterprise resource. It is 
closely tied to the PE and relies on its decision to ultimately allow or deny a session. If 
the session is authorized and the request authenticated, the PA configures the PEP to 
allow the session to start. If the session is denied (or a previous approval is 
countermanded), the PA signals to the PEP to shut down the connection. Some 
implementations may treat the PE and PA as a single service; here, it is divided into its 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
10 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
two logical components. The PA communicates with the PEP when creating the 
communication path. This communication is done via the control plane.  
• Policy enforcement point (PEP): This system is responsible for enabling, monitoring, 
and eventually terminating connections between a subject and an enterprise resource. The 
PEP communicates with the PA to forward requests and/or receive policy updates from 
the PA. This is a single logical component in ZTA but may be broken into two different 
components: the client (e.g., agent on a laptop) and resource side (e.g., gateway 
component in front of resource that controls access) or a single portal component that acts 
as a gatekeeper for communication paths. Beyond the PEP is the trust zone (see Section 
2) hosting the enterprise resource. 
In addition to the core components in an enterprise implementing a ZTA, several data sources 
provide input and policy rules used by the policy engine when making access decisions. These 
include local data sources as well as external (i.e., nonenterprise-controlled or -created) data 
sources. These can include: 
• Continuous diagnostics and mitigation (CDM) system: This gathers information about 
the enterprise asset’s current state and applies updates to configuration and software 
components. An enterprise CDM system provides the policy engine with the information 
about the asset making an access request, such as whether it is running the appropriate 
patched operating system (OS), the integrity of enterprise-approved software components 
or presence of non-approved components and whether the asset has any known 
vulnerabilities. CDM systems are also responsible for identifying and potentially 
enforcing a subset of polices on nonenterprise devices active on enterprise infrastructure. 
• Industry compliance system: This ensures that the enterprise remains compliant with 
any regulatory regime that it may fall under (e.g., FISMA, healthcare or financial 
industry information security requirements). This includes all the policy rules that an 
enterprise develops to ensure compliance. 
• Threat intelligence feed(s): This provides information from internal or external sources 
that help the policy engine make access decisions. These could be multiple services that 
take data from internal and/or multiple external sources and provide information about 
newly discovered attacks or vulnerabilities. This also includes newly discovered flaws in 
software, newly identified malware, and reported attacks to other assets that the policy 
engine will want to deny access to from enterprise assets. 
• Network and system activity logs: This enterprise system aggregates asset logs, 
network traffic, resource access actions, and other events that provide real-time (or near-
real-time) feedback on the security posture of enterprise information systems. 
• Data access policies: These are the attributes, rules, and policies about access to 
enterprise resources. This set of rules could be encoded in (via management interface) or 
dynamically generated by the policy engine. These policies are the starting point for 
authorizing access to a resource as they provide the basic access privileges for accounts 
and applications/services in the enterprise. These policies should be based on the defined 
mission roles and needs of the organization. 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
11 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
• Enterprise public key infrastructure (PKI): This system is responsible for generating 
and logging certificates issued by the enterprise to resources, subjects, services and 
applications. This also includes the global certificate authority ecosystem and the Federal 
PKI,4 which may or may not be integrated with the enterprise PKI. This could also be a 
PKI that is not built upon X.509 certificates. 
• ID management system: This is responsible for creating, storing, and managing 
enterprise user accounts and identity records (e.g., lightweight directory access protocol 
(LDAP) server). This system contains the necessary subject information (e.g., name, 
email address, certificates) and other enterprise characteristics such as role, access 
attributes, and assigned assets. This system often utilizes other systems (such as a PKI) 
for artifacts associated with user accounts. This system may be part of a larger federated 
community and may include nonenterprise employees or links to nonenterprise assets for 
collaboration. 
• Security information and event management (SIEM) system: This collects security-
centric information for later analysis. This data is then used to refine policies and warn of 
possible attacks against enterprise assets. 
3.1
