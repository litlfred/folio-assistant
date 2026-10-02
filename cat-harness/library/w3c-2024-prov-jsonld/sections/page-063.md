---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-063
section_title: "Page 63"
pages: 63-63
pdf_page: 63
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
}
    }
},
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
},
"Attribution": {
    "@id": "prov:Attribution",
    "@context": {
"entity": {
    "@reverse" : "prov:qualifiedAttribution",
    "@type" : "@id"
}
    }
},
"Association": {
    "@id": "prov:Association",
    "@context": {
"activity": {
    "@reverse" : "prov:qualifiedAssociation",
    "@type" : "@id"
},
"plan": {
    "@id": "prov:hadPlan",
    "@type": "@id"
}
    }
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
63/71
