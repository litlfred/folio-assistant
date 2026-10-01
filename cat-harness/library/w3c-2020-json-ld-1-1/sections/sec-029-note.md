---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-029-note
section_title: "Note"
section_number: null
pages: 19-19
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
When possible, the context definition should be put at the top of a JSON-LD document. This makes the document easier to read and might make
streaming parsers more efficient. Documents that do not have the context at the top are still conformant JSON-LD.
Note
To avoid forward-compatibility issues, terms starting with an @ character followed exclusively by one or more ALPHA characters (see [RFC5234])
are to be avoided as they might be used as keyword in future versions of JSON-LD. Terms starting with an @ character that are not JSON-LD 1.1
keywords are treated as any other term, i.e., they are ignored unless mapped to an IRI. Furthermore, the use of empty terms ("") is not allowed as not
all programming languages are able to handle empty JSON keys.
This section is non-normative.
  }]
}
Input
Example 21: Embedded contexts within node objects
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "name": "http://example.com/person#name",
    "details": "http://example.com/person#details"
  },
  "name": "Markus Lanthaler",
  ...
  "details": {
    "@context": {
      "name": "http://example.com/organization#name"
    },
    "name": "Graz University of Technology"
  }
}
Input
Example 22: Combining external and local contexts
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": [
    "https://json-ld.org/contexts/person.jsonld",
    {
      "pic": {
        "@id": "http://xmlns.com/foaf/0.1/depiction",
        "@type": "@id"
      }
    }
  ],
  "name": "Manu Sporny",
  "homepage": "http://manu.sporny.org/",
  "pic": "http://twitter.com/account/profile_image/manusporny"
}
