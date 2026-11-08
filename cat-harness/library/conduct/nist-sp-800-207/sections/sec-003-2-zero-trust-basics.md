---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-003-2-zero-trust-basics
section_title: "Zero Trust Basics"
section_number: 2
pages: 13-15
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Zero trust is a cybersecurity paradigm focused on resource protection and the premise that trust 
is never granted implicitly but must be continually evaluated. Zero trust architecture is an end-to-
end approach to enterprise resource and data security that encompasses identity (person and non-
person entities), credentials, access management, operations, endpoints, hosting environments, 
and the interconnecting infrastructure. The initial focus should be on restricting resources to 
those with a need to access and grant only the minimum privileges (e.g., read, write, delete) 
needed to perform the mission. Traditionally, agencies (and enterprise networks in general) have 
focused on perimeter defense and authenticated subjects are given authorized access to a broad 
collection of resources once on the internal network. As a result, unauthorized lateral movement 
within the environment has been one of the biggest challenges for federal agencies.  
The Trusted Internet Connections (TIC) and agency perimeter firewalls provide strong internet 
gateways. This helps block attackers from the internet, but the TICs and perimeter firewalls are 
less useful for detecting and blocking attacks from inside the network and cannot protect subjects 
outside of the enterprise perimeter (e.g., remote workers, cloud-based services, edge devices, 
etc.).  
An operative definition of zero trust and zero trust architecture is as follows: 
Zero trust (ZT) provides a collection of concepts and ideas designed to minimize 
uncertainty in enforcing accurate, least privilege per-request access decisions in 
information systems and services in the face of a network viewed as compromised. Zero 
trust architecture (ZTA) is an enterprise’s cybersecurity plan that utilizes zero trust 
concepts and encompasses component relationships, workflow planning, and access 
policies. Therefore, a zero trust enterprise is the network infrastructure (physical and 
virtual) and operational policies that are in place for an enterprise as a product of a zero 
trust architecture plan. 
An enterprise decides to adopt zero trust as its core strategy and generate a zero trust architecture 
as a plan developed with zero trust principles (see Section 2.1 below) in mind. This plan is then 
deployed to produce a zero trust environment for use in the enterprise.   
This definition focuses on the crux of the issue, which is the goal to prevent unauthorized access 
to data and services coupled with making the access control enforcement as granular as 
possible. That is, authorized and approved subjects (combination of user, application (or service), 
and device) can access the data to the exclusion of all other subjects (i.e., attackers). To take this 
one step further, the word “resource” can be substituted for “data” so that ZT and ZTA are about 
resource access (e.g., printers, compute resources, Internet of Things [IoT] actuators) and not just 
data access.  
To lessen uncertainties (as they cannot be eliminated), the focus is on authentication, 
authorization, and shrinking implicit trust zones while maintaining availability and minimizing 
temporal delays in authentication mechanisms. Access rules are made as granular as possible to 
enforce least privileges needed to perform the action in the request.  
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
5 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
In the abstract model of access shown in Figure 1, a subject needs access to an enterprise 
resource. Access is granted through a policy decision point (PDP) and corresponding policy 
enforcement point (PEP).3  
 
 
Figure 1: Zero Trust Access 
The system must ensure that the subject is authentic and the request is valid. The PDP/PEP 
passes proper judgment to allow the subject to access the resource. This implies that zero trust 
applies to two basic areas: authentication and authorization. What is the level of confidence 
about the subject’s identity for this unique request? Is access to the resource allowable given the 
level of confidence in the subject’s identity? Does the device used for the request have the proper 
security posture? Are there other factors that should be considered and that change the 
confidence level (e.g., time, location of subject, subject’s security posture)? Overall, enterprises 
need to develop and maintain dynamic risk-based policies for resource access and set up a 
system to ensure that these policies are enforced correctly and consistently for individual 
resource access requests. This means that an enterprise should not rely on implied 
trustworthiness wherein if the subject has met a base authentication level (e.g., logging into an 
asset), all subsequent resource requests are assumed to be equally valid.  
The “implicit trust zone” represents an area where all the entities are trusted to at least the level 
of the last PDP/PEP gateway. For example, consider the passenger screening model in an airport. 
All passengers pass through the airport security checkpoint (PDP/PEP) to access the boarding 
gates. The passengers, airport employees, aircraft crew, etc., mill about in the terminal area, and 
all the individuals are considered trusted. In this model, the implicit trust zone is the boarding 
area. 
The PDP/PEP applies a set of controls so that all traffic beyond the PEP has a common level of 
trust. The PDP/PEP cannot apply additional policies beyond its location in the flow of traffic. To 
allow the PDP/PEP to be as specific as possible, the implicit trust zone must be as small as 
possible.  
Zero trust provides a set of principles and concepts around moving the PDP/PEPs closer to the 
resource. The idea is to explicitly authenticate and authorize all subjects, assets and workflows 
that make up the enterprise. 
 
3 Part of the concepts defined in OASIS XACML 2.0 https://docs.oasis-open.org/xacml/2.0/access_control-xacml-2.0-core-spec-
os.pdf 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
6 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
2.1
