---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-030
section_title: "Page 30"
pages: 30-30
pdf_page: 30
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
{ "$ref": "#/definitions/prov:Association" 
{ "$ref": "#/definitions/prov:Delegation" }
{ "$ref": "#/definitions/prov:Invalidation"
{ "$ref": "#/definitions/prov:Start" },
{ "$ref": "#/definitions/prov:End" },
{ "$ref": "#/definitions/prov:Derivation" }
{ "$ref": "#/definitions/prov:Alternate" },
{ "$ref": "#/definitions/prov:Specializatio
{ "$ref": "#/definitions/prov:Membership" }
{ "$ref": "#/definitions/prov:Influence" },
{ "$ref": "#/definitions/prov:Communication
]
}
}
{
"prov:StatementOrBundle": {
"oneOf": [
{ "$ref": "#/definitions/prov:Statement" },
{ "$ref": "#/definitions/prov:Bundle" }
]
}
}
The type Context is described in the next section.
Finally, contexts are defined according to Schema for Context. They take the shape of an array,
containing either mappings of prefixes to IRIs or IRIs to further JSON-LD contexts.
Schema for Context
{
"Context": {
"$id": "#/definitions/Context",
"type": "array",
"title": "The @context Schema",
"items": {
§ 4.20 Context
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
30/71
