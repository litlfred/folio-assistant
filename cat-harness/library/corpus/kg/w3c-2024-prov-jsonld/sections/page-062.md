---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-062
section_title: "Page 62"
pages: 62-62
pdf_page: 62
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"@id": "prov:Delegation",
    "@context": {
"responsible": {
    "@id": "prov:agent",
    "@type" : "@id"
},
"delegate": {
    "@reverse": "prov:qualifiedDelegation",
    "@type": "@id"
},
"activity": {
    "@id" : "prov:hadActivity",
    "@type" : "@id"
}
    }
},
"Usage": {
    "@id": "prov:Usage",
    "@context": {
"activity": {
    "@reverse" : "prov:qualifiedUsage",
    "@type" : "@id"
},
"time": {
    "@id": "prov:atTime",
    "@type": "xsd:dateTime"
}
    }
},
"Generation": {
    "@id": "prov:Generation",
    "@context": {
"entity": {
    "@reverse" : "prov:qualifiedGeneration",
    "@type" : "@id"
},
"time": {
    "@id": "prov:atTime",
    "@type": "xsd:dateTime"
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
62/71
