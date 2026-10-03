---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-036
section_title: "Page 36"
pages: 36-36
pdf_page: 36
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
The mapping Context for Derivation supports the Qualification Pattern of Figure 2, g. Each of the
JSON properties generatedEntity, usedEntity, activity, generation, and usage maps to an object
property: namely, prov:qualifiedDerivation, prov:entity, prov:hadActivity, prov:hadGeneration, and
prov:hadUsage, respectively.
Context for Derivation
{
"Derivation": {
    "@id": "prov:Derivation",
    "@context": {
"generatedEntity": {
    "@reverse": "prov:qualifiedDerivation",
    "@type": "@id"
},
"usedEntity": {
    "@id": "prov:entity",
    "@type": "@id"
},
"generation": {
    "@id": "prov:hadGeneration",
    "@type": "@id"
},
"activity": {
    "@id": "prov:hadActivity",
    "@type": "@id"
},
"usage": {
    "@id": "prov:hadUsage",
    "@type": "@id"
}
    }
}
}
§ 5.6 Derivation
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
36/71
