---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"additionalProperties": false
}
}
We also define general types for property values, which can be arrays of values ArrayOfValues or
arrays of labels ArrayOfLabelValues.
{
"ArrayOfValues": {
"$id": "#/definitions/ArrayOfValues",
"type": "array",
"items": {
"anyOf": [
{ "$ref": "#/definitions/QualifiedN
{ "$ref": "#/definitions/typed_valu
{ "$ref": "#/definitions/lang_strin
                                ]
                         }
 }
}
{
"ArrayOfLabelValues": {
"$id": "#/definitions/ArrayOfLabelValues",
"type": "array",
"items": { "$ref": "#/definitions/lang_string" }
}
}
With these preliminary definitions in place, we can now present the specification of PROV-JSONLD's
core data structures.
In the Schema for prov:Entity, an entity MUST contain an identifier (property @id) and a property
@type with value Entity. It MAY contain further type information (property type, see PROV-DM
prov:type), a location (property location, see PROV-DM prov:location), a label (property label, see
§ 4.2 prov:Entity
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
12/71
