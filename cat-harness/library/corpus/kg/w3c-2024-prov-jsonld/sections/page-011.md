---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-011
section_title: "Page 11"
pages: 11-11
pdf_page: 11
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"default": "",
"pattern": "(^[A-Za-z0-9_]+:)?(.*)$"
}
}
EDITOR'S NOTE
The production rules for qualified names are more complex than the simple regular expression outlined here. A post-
processor will need to check that qualified names comply with the definition in [PROV-N].
Typed values (typed_value) are JSON objects with properties @value and @type. String values
(lang_string) are JSON objects with properties @value and @language.
{
"typed_value": {
"type": "object",
"required": [ "@value", "@type"],
"properties": {
"@value": {
"type": "string"
},
"@type": {
"type": "string"
}
},
"additionalProperties": false
}
}
{
"lang_string": {
"type": "object",
"required": [ "@value" ],
"properties": {
"@value": {
"type": "string"
},
"@language": {
"type": "string"
}
},
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
11/71
