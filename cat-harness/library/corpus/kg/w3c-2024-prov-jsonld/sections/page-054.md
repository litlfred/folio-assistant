---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-054
section_title: "Page 54"
pages: 54-54
pdf_page: 54
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Invalidation": {
"type": "object",
"required": [ "@type" ],
"properties": {
"@type":      { "pattern": "Invalidation" }
"@id":        { "$ref": "#/definitions/Qual
"entity":     { "$ref": "#/definitions/Qual
"activity":   { "$ref": "#/definitions/Qual
"time":       { "$ref": "#/definitions/DateT
"type":       { "$ref": "#/definitions/Array
"role":       { "$ref": "#/definitions/Array
"location":   { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Start": {
"type": "object",
"required": [
"@type"
],
"properties": {
"@type":      { "pattern": "Start" },
"@id":        { "$ref": "#/definitions/Qual
"activity":   { "$ref": "#/definitions/Qual
"starter":    { "$ref": "#/definitions/Qual
"trigger":    { "$ref": "#/definitions/Qual
"time":       { "$ref": "#/definitions/DateT
"type":       { "$ref": "#/definitions/Array
"role":       { "$ref": "#/definitions/Array
"location":   { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
54/71
