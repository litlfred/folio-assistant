---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-066
section_title: "Page 66"
pages: 66-66
pdf_page: 66
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"@id": "prov:entity",
    "@type": "@id"
},
"ender": {
    "@id": "prov:hadActivity",
    "@type": "@id"
},
"time": {
    "@id": "prov:atTime",
    "@type": "xsd:dateTime"
}
    }
},
"Specialization": {
    "@id": "provext:Specialization",
    "@context": {
"specificEntity": {
    "@reverse" : "provext:qualifiedSpecialization",
    "@type" : "@id"
},
"generalEntity": {
    "@id": "provext:generalEntity",
    "@type": "@id"
}
    }
},
"Membership": {
    "@id": "provext:Membership",
    "@context": {
"collection": {
    "@reverse" : "provext:qualifiedMembership",
    "@type" : "@id"
},
"entity": {
    "@id": "provext:member",
    "@type": "@id"
}
    }
},
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
66/71
