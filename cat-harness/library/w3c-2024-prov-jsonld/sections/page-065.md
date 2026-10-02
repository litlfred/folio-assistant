---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-065
section_title: "Page 65"
pages: 65-65
pdf_page: 65
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
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
},
"Start": {
    "@id": "prov:Start",
    "@context": {
"activity": {
    "@reverse": "prov:qualifiedStart",
    "@type": "@id"
},
"trigger": {
    "@id": "prov:entity",
    "@type": "@id"
},
"starter": {
    "@id": "prov:hadActivity",
    "@type": "@id"
},
"time": {
    "@id": "prov:atTime",
    "@type": "xsd:dateTime"
}
    }
},
"End": {
    "@id": "prov:End",
    "@context": {
"activity": {
    "@reverse": "prov:qualifiedEnd",
    "@type": "@id"
},
"trigger": {
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
65/71
