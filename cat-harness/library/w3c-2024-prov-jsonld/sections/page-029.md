---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-029
section_title: "Page 29"
pages: 29-29
pdf_page: 29
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"@graph":     {
"type": "array",
"items": { "$ref": "#/definitions/p
}
},
"additionalProperties": false
}
}
{
"prov:Document": {
"type": "object",
"required": [
"@context", "@graph"
],
"properties": {
"@type":       { "pattern": "Document" },
"@context":    { "$ref": "#/definitions/Con
"@graph":      {
"type": "array",
"items": { "$ref": "#/definitions/p
}
},
"additionalProperties": false
}
}
Bundles contain statements (definition prov:Statement), whereas documents contain statements or
bundles (definition prov:StatementOrBundle); see their specification in Schemas for prov:Statement
and prov:StatementOrBundle.
Schemas for prov:Statement and prov:StatementOrBundle
{
"prov:Statement": {
"oneOf": [
{ "$ref": "#/definitions/prov:Entity" },
{ "$ref": "#/definitions/prov:Activity" },
{ "$ref": "#/definitions/prov:Agent" },
{ "$ref": "#/definitions/prov:Usage" },
{ "$ref": "#/definitions/prov:Generation" }
{ "$ref": "#/definitions/prov:Attribution" 
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
29/71
