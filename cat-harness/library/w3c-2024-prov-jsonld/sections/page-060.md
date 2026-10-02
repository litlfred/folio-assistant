---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-060
section_title: "Page 60"
pages: 60-60
pdf_page: 60
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"@type":       { "pattern": "Document" },
"@context":    { "$ref": "#/definitions/Cont
"@graph":      {
"type": "array",
"items": { "$ref": "#/definitions/p
}
},
"additionalProperties": false
}
},
"$schema": "http://json-schema.org/draft-07/schema#",
"$id": "https://openprovenance.org/prov-jsonld/schema.json",
"$ref": "#/definitions/prov:Document"
}
{
    "@context": {
"@version": 1.1,
"prov": "http://www.w3.org/ns/prov#",
"provext": "https://openprovenance.org/ns/provext#",
"xsd": "http://www.w3.org/2001/XMLSchema#",
"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
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
},
§ B. JSON-LD Context for PROV-JSONLD
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
60/71
