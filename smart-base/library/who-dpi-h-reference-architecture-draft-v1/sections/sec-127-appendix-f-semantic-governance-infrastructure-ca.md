---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-127-appendix-f-semantic-governance-infrastructure-ca
section_title: "Appendix F: Semantic Governance Infrastructure: capability details"
section_number: null
pages: 252-254
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
1 
capability details 
2 
This appendix provides a fuller breakdown of the individual capabilities within each of the five 
3 
governance capability categories introduced in 3.4.5. It is illustrative reference material rather 
4 
than a specification: the categories (clusters) are the level at which the reference architecture 
5 
operates, and the detailed specification of any individual capability is a matter for dedicated 
6 
standards efforts and national programmes. Across all five categories, three elements recur and 
7 
belong to none of them exclusively — the roles that carry out governance (stakeholders, owners, 
8 
and authors, both technical and clinical), the rules that determine when and how changes may 
9 
be made, and the policy that frames them. 
10 
Table F: SGI Capability Details 
11 
Capability 
category 
Example capabilities 
Description 
Intake 
Change Request Submission 
Receive and register change proposals from internal 
stakeholders, implementers and domain experts 
Upstream Release Ingestion 
Detect, retrieve and stage new releases from external 
standards organisations and content sources 
Deprecation Notification 
Handling 
Receive and process deprecation notices from 
upstream sources and from internal stewards 
Intake Triage and Classification 
Validate, scope, prioritise and route incoming items to 
the appropriate review pathway 
Submission Tracking and 
Queue Management 
Maintain a transparent, auditable queue of pending 
items with status visibility for submitters 
Authoring 
and 
publication 
Content Authoring 
Create and edit governance artefacts (CodeSystems, 
ValueSets, ConceptMaps, profiles, IGs) 
Review Workflow 
Coordinate peer and expert review of proposed 
changes against defined criteria 
Approval and Sign-off 
Capture authoritative approval consistent with delegated 
governance authority 
Versioning and Change 
Tracking 
Apply semantic versioning and maintain diff history 
across artefact lifecycles 
Release Packaging and 
Publication 
Bundle approved content into distributable releases with 
metadata and declared dependencies 
Business Rule Enforcement 
Validate that authoring and publication actions conform 
to defined governance policy 
Audit Trail and Provenance 
Record who proposed, reviewed, approved and 
released each change, and on what basis 
 
 
242 
Capability 
category 
Example capabilities 
Description 
Monitoring 
Governance Compliance 
Tracking 
Monitor adherence to authoring, review and publication 
rules across the artefact lifecycle 
Content Quality Assessment 
Measure internal completeness, consistency, mapping 
coverage and conformance of artefacts 
Currency and Staleness 
Tracking 
Detect drift between published artefacts and upstream 
sources, or time-based review thresholds 
Implementation Uptake 
Measurement 
Capture field-level usage telemetry to assess whether 
published standards are reaching consumers 
Reporting and Alerting 
Surface trends, exceptions and threshold breaches to 
stewards and stakeholders 
Distribution 
Multi-Modal Content Delivery 
Provide API (for example, FHIR terminology 
operations), package, syndication and bulk-export 
modalities 
Access Control and 
Authorisation 
Authenticate consumers and enforce role-, licence- or 
jurisdiction-based access policies 
Service Reliability and 
Availability 
Operate distribution endpoints with documented uptime, 
performance and redundancy targets 
Versioned and Addressable 
Content 
Expose content with stable canonical URLs, point-in-
time access and explicit version identifiers 
Service Discovery and 
Endpoint Registry 
Publish a catalogue of distribution endpoints and their 
architectural contracts 
Consumption 
Content Discovery 
Enable search, browse and catalogue navigation of 
published artefacts 
Content Retrieval 
Support direct query and download of artefacts in 
usable formats 
Integration Tooling 
Provide SDKs, package managers, validators and 
CI/CD plugins for downstream systems 
Change Subscription and 
Notification 
Allow consumers to subscribe to artefact changes 
relevant to their implementations 
Feedback to Maintainers 
Provide channels for downstream consumers and 
upstream content owners to surface issues, gaps and 
usage signals 
 
12 
The figure below illustrates how these capabilities relate in practice: a change moves from intake, 
13 
through change management and publication, to monitoring, carried out by defined roles 
14 
(stakeholders, authors, owners) and supported by tools (change-request tooling, authoring and 
15 
repository services), with upstream content and management rules feeding the process. 
16 
 
 
243 
 
17 
Figure A.1 — Semantic governance capabilities, the roles that carry them out, and the supporting application 
18 
components.  
19 
 
20
