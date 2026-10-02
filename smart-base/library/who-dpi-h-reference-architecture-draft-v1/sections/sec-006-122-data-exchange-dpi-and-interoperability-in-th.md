---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-006-122-data-exchange-dpi-and-interoperability-in-th
section_title: "Data exchange DPI and Interoperability in the health sector"
section_number: 1.2.2
pages: 26-27
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
210 
 
211 
A similar pattern emerges when examining foundational data exchange DPI. Health systems 
212 
involve a wide range of actors — ministries, facilities, clinicians, programme managers, health 
213 
coverage schemes, supply chain operators, researchers, and patients themselves — each with 
214 
different informational needs that no single system can meet alone. General-purpose data 
215 
exchange DPI are designed to move data securely between systems, and they are agnostic to 
216 
the content they carry. This content-neutrality keeps the exchange layer simple, broadly 
217 
reusable across sectors, and free of any single sector's business logic, while keeping 
218 
accountability for that business logic with the institutions that own it. 
219 
 
220 
However, the health sector has requirements that foundational data exchange, on its own, does 
221 
not address — both in how data must be understood when it moves and in how far it must 
222 
travel. Box 3 sets out where foundational data exchange DPI does not, by itself, meet health-
223 
sector needs, and the gaps the health sector aims to bridge.  
224 
 
225 
 
226 
Box 1.3: Why foundational data exchange DPI is not sufficient for health on its own 
 
Foundational data exchange DPI provides secure, authenticated, logged, reliable transport 
between registered parties. Like a postal service that delivers a sealed envelope without 
opening it, the data exchange DPI carries data between systems without reading or 
interpreting its contents. The capabilities below are health-sector requirements essential to 
health data exchange that this transport, on its own, does not provide.  
 
1. Structural, semantic, and message-format interoperability: Clinical and health-related 
data need to be structurally consistent, semantically unambiguous, and exchanged in 
recognised health message formats — such as HL7 FHIR — so that they are interpreted 
consistently across systems, including where systems use differing or older formats. General-
purpose data exchange DPI is designed to move data securely (encrypted end to end) but is 
agnostic to its structure, meaning, and format, carrying messages between systems without 
reading or reconciling their contents. 
 
2. Cross-Border and Multi-Jurisdiction Exchange 
Health increasingly requires the exchange of information across borders — for migrants, 
travellers, regional disease surveillance, and emergency response. Foundational data 
exchange DPI is typically national in scope; cross-border health data exchange depends on 
shared information standards, such as the International Patient Summary, and on legal and 
governance frameworks for health data that extend beyond any single national data exchange 
DPI. 
 
227 
 
228 
 
229 
 
230 
 
 
16
