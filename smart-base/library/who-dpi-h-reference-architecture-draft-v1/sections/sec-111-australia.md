---
doc_id: who-dpi-h-reference-architecture-draft-v1
doc_title: "DRAFT V1.0"
section_id: sec-111-australia
section_title: "Australia"
section_number: null
pages: 242-243
source_pdf: who-dpi-h-reference-architecture-draft-v1.pdf
source_sha256: 3bc9943fdaf76c46
toc_source: outline
---
84 
● HL7 FHIR reference terminology service (tx.fhir.org) — the reference implementation of 
85 
the FHIR Terminology Service specification, widely used for testing and reference.86 
86 
● openEHR Clinical Knowledge Manager — an international, peer-reviewed repository of 
87 
archetypes and templates supporting local adaptation of globally curated models.87 
88 
● National FHIR profile registries — country-specific implementation guides and profiles (for 
89 
example, Simplifier-based national registries), maintaining canonical structural definitions. 
90 
D.2  Country implementation examples 
91 
Australia 
92 
Components illustrated: LHR, CDSE, Terminology Service, LIMR 
93 
Australia's national digital health programme aligns a nationally governed, opt-out longitudinal record 
94 
(My Health Record) with a FHIR-based interoperability framework, a national terminology service 
95 
 
78https://www.who.int/tools/godata 
79https://www.bahmni.org/ 
80https://sormas.org/ 
81https://openelis-global.org/ 
82https://www.cdc.gov/epiinfo/ 
83https://www.who.int/data/platforms 
84https://github.com/IHTSDO/snowstorm 
85https://ontoserver.csiro.au/ 
86https://tx.fhir.org/ 
87https://ckm.openehr.org/ckm/ 
 
 
232 
and a set of national information-model profiles (AU Base). The record aggregates clinical 
96 
documents, medication, immunisation and pathology data contributed from distributed source 
97 
systems88, while decision-support and terminology governance are pursued alongside it as part of 
98 
the same national capability. The transferable observation is the value of governing the record, 
99 
terminology, information models and decision support as one coherent programme rather than as 
100 
isolated investments, and the sustained effort required to drive contributing-system participation at 
101 
scale. 
102
