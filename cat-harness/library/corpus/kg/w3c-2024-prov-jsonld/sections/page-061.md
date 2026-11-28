---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-061
section_title: "Page 61"
pages: 61-61
pdf_page: 61
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"entity": {
    "@id": "prov:entity",
    "@type": "@id"
},
"activity": {
    "@id": "prov:activity",
    "@type": "@id"
},
"agent": {
    "@id": "prov:agent",
    "@type": "@id"
},
"Activity": {
    "@id": "prov:Activity",
    "@context" : {
"startTime": {
    "@id": "prov:startedAtTime",
    "@type": "xsd:dateTime"
},
"endTime": {
    "@id": "prov:endedAtTime",
    "@type": "xsd:dateTime"
}
    }
},
"Entity": {
    "@id": "prov:Entity",
    "@context" : {
"value": {
    "@id": "prov:value"
}
    }
},
"Agent": {
    "@id": "prov:Agent",
    "@context" : {}
},
"Delegation": {
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
61/71
