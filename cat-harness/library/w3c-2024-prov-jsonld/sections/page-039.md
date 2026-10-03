---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-039
section_title: "Page 39"
pages: 39-39
pdf_page: 39
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
The mapping Context for Usage supports the Qualification Pattern of Figure 2, a. The JSON properties
activity and time map to the object property prov:qualifiedUsage and the data property prov:atTime,
respectively. The value of the latter is coerced to datatype xsd:dateTime.
Context for Usage
{
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
}
}
The mapping Context for Generation supports the Qualification Pattern of Figure 2, b. The JSON
properties entity and time map to the object property prov:qualifiedGeneration and the data property
prov:atTime, respectively. The value of the latter is coerced to datatype xsd:dateTime.
Context for Generation
{
"Generation": {
    "@id": "prov:Generation",
    "@context": {
§ 5.10 Usage
§ 5.11 Generation
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
39/71
