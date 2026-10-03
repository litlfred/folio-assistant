---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-064
section_title: "Page 64"
pages: 64-64
pdf_page: 64
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
},
"Communication": {
    "@id": "prov:Communication",
    "@context": {
"informed": {
    "@reverse" : "prov:qualifiedCommunication",
    "@type" : "@id"
},
"informant": {
    "@id": "prov:activity",
    "@type": "@id"
}
    }
},
"Influence": {
    "@id": "prov:Influence",
    "@context": {
"influencee": {
    "@reverse" : "prov:qualifiedInfluence",
    "@type" : "@id"
},
"influencer": {
    "@id": "prov:influencer",
    "@type": "@id"
}
    }
},
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
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
64/71
