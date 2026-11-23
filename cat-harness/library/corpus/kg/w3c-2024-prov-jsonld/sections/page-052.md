---
doc_id: w3c-2024-prov-jsonld
doc_title: "The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model (W3C Member Submission 25 August 2024)"
section_id: page-052
section_title: "Page 52"
pages: 52-52
pdf_page: 52
source_pdf: w3c-2024-prov-jsonld.pdf
source_sha256: ab826cd4a4cfe750
text_source: embedded
granularity: page
---
{ "$ref": "#/definitions/prov:Membership" }
{ "$ref": "#/definitions/prov:Influence" },
{ "$ref": "#/definitions/prov:Communication"
]
},
"prov:Entity": {
"type": "object",
"required": [ "@type", "@id" ],
"properties": {
"@type":      { "pattern": "Entity" },
"@id":        { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Array
"value":      { "$ref": "#/definitions/Array
"location":   { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Agent": {
"type": "object",
"required": [ "@type", "@id" ],
"properties": {
"@type":      { "pattern": "Agent" },
"@id":        { "$ref": "#/definitions/Qual
"type":       { "$ref": "#/definitions/Array
"location":   { "$ref": "#/definitions/Array
"label":      { "$ref": "#/definitions/Array
},
"patternProperties": {
"^[A-Za-z0-9_]+:(.*)$": { "$ref": "#/definit
},
"additionalProperties": false
},
"prov:Activity": {
"type": "object",
"required": [ "@type", "@id" ],
"properties": {
"@type":      { "pattern": "Activity" },
"@id":        { "$ref": "#/definitions/Qual
"startTime":  { "$ref": "#/definitions/DateT
10/1/26, 6:17 PM
The PROV-JSONLD Serialization
https://www.w3.org/submissions/prov-jsonld/
52/71
