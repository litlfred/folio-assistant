---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-042
section_title: "Page 42"
pages: 42-42
pdf_page: 42
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
prov:hadActivity, and the data property prov:atTime, respectively. The value of the latter is coerced to
datatype xsd:dateTime.
Context for End
{
"End": {
    "@id": "prov:End",
    "@context": {
"activity": {
    "@reverse": "prov:qualifiedEnd",
    "@type": "@id"
},
"trigger": {
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
}
}
The mapping Context for Communication supports the Qualification Pattern of Figure 2, d. The JSON
properties informed and informant map to the object properties prov:qualifiedCommunication and
prov:activity, respectively.
§ 5.15 Communication
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
42/71
