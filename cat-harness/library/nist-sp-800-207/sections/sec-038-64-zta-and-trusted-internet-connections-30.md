---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-038-64-zta-and-trusted-internet-connections-30
section_title: "ZTA and Trusted Internet Connections 3.0"
section_number: 6.4
pages: 42-43
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
TIC is a federal cybersecurity initiative jointly managed by OMB, DHS, and the General 
Services Administration (GSA), and is intended to establish a network security baseline across 
the Federal Government. Historically, TIC was a perimeter-based cybersecurity strategy which 
required agencies to consolidate and monitor their external network connections. Inherent in TIC 
1.0 and TIC 2.0 is the assumption that the inside of the perimeter is “trusted,” whereas ZTA 
assumes that network location does not infer “trust” (i.e., there is no “trust” on an agency’s 
internal network). TIC 2.0 provides a list of network-based security capabilities (e.g. content 
filtering, monitoring, authentication, and others) to be deployed at the TIC Access Point at the 
agency’s perimeter; many of these capabilities are aligned with ZT principles.  
TIC 3.0 has been updated to accommodate cloud services and mobile devices [M-19-26]. In TIC 
3.0, it is recognized that the definition of “trust” may vary across specific computing contexts 
and that agencies have different risk tolerances for defining trust zones.  In addition, TIC 3.0 has 
an updated TIC Security Capability Handbook, which defines two types of security capabilities: 
(1) Universal Security Capabilities that apply at the enterprise level, and (2) PEP Security 
Capabilities that are network-level capabilities to be applied to multiple policy enforcement 
points (PEPs), as defined in TIC use cases.  The PEP Security Capabilities may be applied at any 
appropriate PEP located along a given data flow instead of at a single PEP at the agency 
perimeter. Many of these TIC 3.0 security capabilities directly support ZTA (e.g., encrypted 
traffic, strong authentication, microsegmentation, network and system inventory, and others). 
TIC 3.0 defines specific use cases that describe the implementation of trust zones and security 
capabilities across specific applications, services, and environments.  
TIC 3.0 is focused on network-based security protections, whereas ZTA is a more inclusive 
architecture addressing application, user, and data protections. As TIC 3.0 evolves its use 
cases, it is likely that a ZTA TIC use case will be developed to define the network protections to 
be deployed at ZTA enforcement points. 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
34 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
6.5
