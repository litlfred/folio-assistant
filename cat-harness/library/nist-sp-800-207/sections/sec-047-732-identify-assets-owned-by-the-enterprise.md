---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-047-732-identify-assets-owned-by-the-enterprise
section_title: "Identify Assets Owned by the Enterprise"
section_number: 7.3.2
pages: 47-48
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
As mentioned in Section 2.1, one of the key requirements of ZTA is the ability to identify and 
manage devices. ZTA also requires the ability to identify and monitor nonenterprise-owned 
devices that may be on enterprise-owned network infrastructure or that access enterprise 
resources. The ability to manage enterprise assets is key to the successful deployment of ZTA. 
This includes hardware components (e.g., laptops, phones, IoT devices) and digital artifacts (e.g., 
user accounts, applications, digital certificates). It may not be possible to conduct a complete 
census on all enterprise-owned assets, so an enterprise should consider building the capability to 
quickly identify, categorize, and assess newly discovered assets that are on enterprise-owned 
infrastructure. 
This goes beyond simply cataloging and maintaining a database of enterprise assets. This also 
includes configuration management and monitoring. The ability to observe the current state of an 
asset is part of the process of evaluating access requests (see Section 2.1). This means that the 
enterprise must be able to configure, survey, and update enterprise assets, such as virtual assets 
and containers. This also includes both its physical (as best estimated) and network location. This 
information should inform the PE when making resource access decisions.  
Nonenterprise-owned assets and enterprise-owned “shadow IT” should also be cataloged as well 
as possible. This may include whatever is visible by the enterprise (e.g., MAC address, network 
location) and augmented by administrator data entry. This information is not only used for access 
decisions (as collaborator and BYOD assets may need to contact PEPs) but also for monitoring 
and forensics logging by the enterprise. Shadow IT presents a special problem in that these 
resources are enterprise-owned but not managed like other resources. Certain ZTA approaches 
(mainly network-based) may even cause shadow IT components to become unusable as they may 
not be known and included in network access policies. 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
39 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
Many federal agencies have already begun identifying enterprise assets. Agencies that have 
established CDM program capabilities, such as HWAM [HWAM] and Software Asset 
Management (SWAM) [SWAM], have a rich set of data to draw from when enacting a ZTA. 
Agencies may also have a list of ZTA candidate processes that involve High Value Assets 
(HVA) [M-19-03] that have been identified as key to the agency mission. This work would need 
to exist enterprise- or agency-wide before any business process could be (re)designed with a 
ZTA. These programs must be designed to be expandable and adaptable to changes in the 
enterprise, not only when migrating to ZTA but also when accounting for new assets, services, 
and business processes that become part of the enterprise.
