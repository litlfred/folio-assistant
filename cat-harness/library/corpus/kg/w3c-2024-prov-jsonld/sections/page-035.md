---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-035
section_title: "Page 35"
pages: 35-35
pdf_page: 35
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
In the mapping Context for Activity, the JSON properties startTime and endTime map to the RDF data
properties prov:startedAtTime and prov:endedAtType, respectively, and have a value coerced to
datatype xsd:dateTime.
Context for Activity
{
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
}
}
The mapping Context for Agent does not define further properties.
Context for Agent
{
"Agent": {
    "@id": "prov:Agent",
    "@context" : {}
}
}
§ 5.4 Activity
§ 5.5 Agent
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
35/71
