---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-041
section_title: "Page 41"
pages: 41-41
pdf_page: 41
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
The mapping Context for Start supports the Qualification Pattern of Figure 2, e. The JSON properties
activity, trigger, starter, and time map to the object properties prov:qualifiedStart, prov:entity,
prov:hadActivity, and the data property prov:atTime, respectively. The value of the latter is coerced to
datatype xsd:dateTime.
Context for Start
{
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
}
}
The mapping Context for End supports the Qualification Pattern of Figure 2, f. The JSON properties
activity, trigger, ender, and time map to the object properties prov:qualifiedEnd, prov:entity,
§ 5.13 Start
§ 5.14 End
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
41/71
