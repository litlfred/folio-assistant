---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-010
section_title: "Page 10"
pages: 10-10
pdf_page: 10
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
This section provides an overview of the JSON schema [JSON-SCHEMA] for PROV-JSONLD; its
full details are in Appendix A.
For each object property identified in the JSON schema, we provide the corresponding normative
attribute definition in [PROV-DM].
Some primitive types occur in PROV serializations, namely DateTime and QualifiedName. We define
their schemas as follows.
{
"DateTime": {
"$id": "#/definitions/DateTime",
"type": "string",
"format": "date-time"
}
}
{
"QualifiedName": {
"$id": "#/definitions/QualifiedName",
"type": "string",
"title": "The QualifiedName Schema",
    "activity" : "ex:compose",
    "entity" : "ex:dataSet1"
  }, {
    "@type" : "Generation",
    "entity" : "ex:article1",
    "activity" : "ex:compose"
  } ]
}
§ 4. Schema
§ 4.1 Preliminary Definitions
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
10/71
