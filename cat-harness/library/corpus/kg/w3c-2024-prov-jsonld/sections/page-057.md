---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-057
section_title: "Page 57"
pages: 57-57
pdf_page: 57
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
],
"properties": {
"@type":           { "pattern": "Derivation"
"@id":             { "$ref": "#/definitions/
"activity":        { "$ref": "#/definitions/
"generation":      { "$ref": "#/definitions/
"usage":           { "$ref": "#/definitions/
"generatedEntity": { "$ref": "#/definitions/
"usedEntity":      { "$ref": "#/definitions/
"type":            { "$ref": "#/definitions/
"label":           { "$ref": "#/definitions/
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Alternate": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Alternate" },
"@id":        { "$ref": "#/definitions/Qual
"alternate1": { "$ref": "#/definitions/Qual
"alternate2": { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Specialization": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":           { "pattern": "Specializat
"@id":             { "$ref": "#/definitions/
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
57/71
