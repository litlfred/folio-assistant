---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-034
section_title: "Page 34"
pages: 34-34
pdf_page: 34
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
The following JSON properties have the same meaning in all contexts of a PROV-JSONLD document:
role, type, label and location respectively map to the RDF properties prov:hadRole, rdf:type,
rdfs:label, and prov:atLocation.
{
"role": {
    "@id": "prov:hadRole",
    "@type": "@id"
},
"type": {
    "@id": "rdf:type",
    "@type": "@id"
},
"label": {
    "@id": "rdfs:label"
},
"location": {
    "@id": "prov:atLocation",
    "@type": "@id"
}
}
In the mapping Context for Entity, the JSON property value maps to PROV-O prov:value.
Context for Entity
{
"Entity": {
    "@id": "prov:Entity",
    "@context" : {
"value": {
    "@id": "prov:value"
}
    }
}
}
§ 5.3 Entity
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
34/71
