---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-040
section_title: "Page 40"
pages: 40-40
pdf_page: 40
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"entity": {
    "@reverse" : "prov:qualifiedGeneration",
    "@type" : "@id"
},
"time": {
    "@id": "prov:atTime",
    "@type": "xsd:dateTime"
}
    }
}
}
The mapping Context for Invalidation supports the Qualification Pattern of Figure 2, c. The JSON
properties entity and time map to the object property prov:qualifiedInvalidation and the data property
prov:atTime, respectively. The value of the latter is coerced to datatype xsd:dateTime.
Context for Invalidation
{
"Invalidation": {
    "@id": "prov:Invalidation",
    "@context": {
"entity": {
    "@reverse" : "prov:qualifiedInvalidation",
    "@type" : "@id"
},
"time": {
    "@id": "prov:atTime",
    "@type": "xsd:dateTime"
}
    }
}
}
§ 5.12 Invalidation
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
40/71
