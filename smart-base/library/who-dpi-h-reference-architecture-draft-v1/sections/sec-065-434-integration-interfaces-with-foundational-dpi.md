---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-065-434-integration-interfaces-with-foundational-dpi
section_title: "Integration Interfaces with Foundational DPI"
section_number: 4.3.4
pages: 107-108
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
339 
DPI-H components do not operate in isolation from the broader digital ecosystem. They may 
340 
depend on and integrate with foundational DPI — national identity systems, digital payments 
341 
 
38HL7 International (2023). HL7 FHIR Release 5. Health Level Seven International. Available at: https://hl7.org/fhir/ 
 
 
97 
infrastructure, civil registration and vital statistics systems, and national data exchange — and 
342 
should specify the integration interfaces through which those dependencies are realised. 
343 
Countries should define and document two categories of integration interface for each DPI-H 
344 
component. 
345 
General APIs that foundational DPI should enable for health sector use. These include 
346 
identity verification APIs that allow the client registry to validate a person’s identity against the 
347 
national identity system and retrieve a verified national identifier; civil registration APIs that allow 
348 
birth and death events to trigger updates in the client registry and health workforce registry; 
349 
payment gateway APIs that allow health financing systems to initiate, verify, and reconcile 
350 
payments through the national payments infrastructure; and data exchange APIs that allow 
351 
health information to be shared securely through the national data exchange backbone where 
352 
one exists. 
353 
Health-sector-specific APIs that foundational DPI authorities could synchronise with. 
354 
These include the client registry’s patient matching and identity resolution APIs, which 
355 
foundational identity authorities may need to consume when resolving health-related identity 
356 
queries; the facility registry’s location and service capability APIs, which geographic information 
357 
systems and emergency response services may consume; the health workforce registry’s 
358 
credentialing verification APIs, which payment systems use to confirm provider eligibility before 
359 
releasing funds; and the terminology services APIs, which any system exchanging coded health 
360 
data — including those outside the health sector — needs to access to ensure consistent 
361 
semantic interpretation. 
362 
Where foundational DPI does not yet expose the APIs that health requires, countries should 
363 
document these as requirements to be communicated to the relevant foundational DPI 
364 
authorities — maintaining the principle established throughout this architecture that health 
365 
should express its needs to foundational DPIs rather than duplicate them. Where foundational 
366 
DPI is absent entirely, health should implement minimum interim capabilities with documented 
367 
transition plans as the broader digital ecosystem develops. 
368
