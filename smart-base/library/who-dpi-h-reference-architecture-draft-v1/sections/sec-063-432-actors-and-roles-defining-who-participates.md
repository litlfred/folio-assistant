---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-063-432-actors-and-roles-defining-who-participates
section_title: "Actors and Roles: Defining Who Participates"
section_number: 4.3.2
pages: 106-107
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
285 
Data models describe the information a system holds; they do not, on their own, describe who 
286 
acts on that information. An implementable specification also defines the actors — both human 
287 
and system — that participate in each transaction, and the roles they play. This matters for 
288 
several reasons that recur across DPI-H components: access to data and functions has to be 
289 
granted by role; actions recorded in a shared record have to be attributed to an identifiable 
290 
actor; workflows have to express which actor performs each step; and the capability statements 
291 
that govern conformance are written from the perspective of a defined actor. 
292 
WHO SMART Guidelines offer a worked example of this practice.37 The operational layer — the 
293 
digital adaptation kit — defines a set of generic personas: depersonalised, context-free 
294 
descriptions of the human and system actors involved in delivering a health service, set out 
295 
alongside the data elements, workflows, and decision logic for a given domain. In the 
296 
corresponding implementation guide, these personas are expressed as computable actor 
297 
definitions against which workflows, capability statements, and access rules are anchored. The 
298 
same discipline applies to shared infrastructure. For each DPI-H component, countries should 
299 
define the minimum set of actors and roles that participate in its transactions — for a registry, for 
300 
example, the registrant, the verifying authority, and the consuming system — and govern these 
301 
role schemas through the same mechanisms used for data models and terminology. Defining 
302 
 
37WHO SMART Guidelines (Standards-based, Machine-readable, Adaptive, Requirements-based, Testable). The digital adaptation 
kit (L2) defines generic personas among its standardised components, which are represented as computable actor definitions in the 
corresponding FHIR implementation guide (L3). WHO SMART guidelines: optimising country-level use of guideline 
recommendations in the digital age, The Lancet Digital Health, 2021. 
 
 
96 
actors explicitly, and reusing a common set across components, keeps access control, 
303 
attribution, and workflow consistent across the ecosystem rather than re-invented for each 
304 
system. 
305
