---
doc_id: nist-sp-800-207
doc_title: "Zero Trust Architecture"
section_id: sec-045-73-steps-to-introducing-zta-to-a-perimeter-based
section_title: "Steps to Introducing ZTA to a Perimeter-Based Architected Network"
section_number: 7.3
pages: 46-47
source_pdf: nist-sp-800-207.pdf
source_sha256: 0290d6ece2487428
toc_source: outline
---
Migrating to ZTA requires an organization to have detailed knowledge of its assets (physical and 
virtual), subjects (including user privileges), and business processes. This knowledge is accessed 
by the PE when evaluating resource requests. Incomplete knowledge will most often lead to a 
business process failure where the PE denies requests due to insufficient information. This is 
especially an issue if there are unknown “shadow IT” deployments operating within an 
organization. 
Before undertaking an effort to bring ZTA to an enterprise, there should be a survey of assets, 
subjects, data flows, and workflows. This awareness forms the foundational state that must be 
reached before a ZTA deployment is possible. An enterprise cannot determine what new 
processes or systems need to be in place if there is no knowledge of the current state of 
operations. These surveys can be conducted in parallel, but both are tied to examination of the 
business processes of the organization. These steps can be mapped to the steps in the RMF 
[SP800-37] as any adoption of a ZTA is a process to reduce risk to an agency’s business 
functions. The pathway to implementing a ZTA can be visualized in Figure 12. 
 
Figure 12: ZTA Deployment Cycle 
NIST SP 800-207 
 
ZERO TRUST ARCHITECTURE 
 
 
 
38 
This publication is available free of charge from: https://doi.org/10.6028/NIST.SP.800-207 
After the initial inventory is created, there is a regular cycle of maintenance and updating. This 
updating may either change business processes or not have any impact, but an evaluation of 
business processes should be conducted. For example, a change in digital certificate providers 
may not appear to have a significant impact but may involve certificate root store management, 
Certificate Transparency log monitoring, and other factors that are not apparent at first.
