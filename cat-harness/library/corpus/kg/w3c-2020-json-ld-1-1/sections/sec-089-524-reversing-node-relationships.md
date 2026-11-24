---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-089-524-reversing-node-relationships
section_title: "Reversing Node Relationships"
section_number: 5.2.4
pages: 63-64
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 132: Reversing Node Relationships
Given the following expanded document:
[{
  "@id": "http://example.org/#homer",
  "http://example.com/vocab#name": [{"@value": "Homer"}],
  "@reverse": {
Reverse properties can be even more useful when combined with framing, which can actually make node objects defined at the top-level of a
document to become embedded nodes. JSON-LD provides a means to index such values, by defining an appropriate @container definition within a
term definition.
This section is non-normative.
Properties with multiple values are typically represented using an unordered array. This means that an application working on an internalized
representation of that JSON would need to iterate through the values of the array to find a value matching a particular pattern, such as a language-
tagged string using the language en.
Context
    "http://example.com/vocab#parent": [{
      "@id": "http://example.org/#bart",
      "http://example.com/vocab#name": [{"@value": "Bart"}]
    }, {
      "@id": "http://example.org/#lisa",
      "http://example.com/vocab#name": [{"@value": "Lisa"}]
    }]
  }
}]
And the following context:
{
  "@context": {
    "name": "http://example.com/vocab#name",
    "children": { "@reverse": "http://example.com/vocab#parent" }
  }
}
The compacted version eliminates the @reverse property by describing "children" as the reverse of "parent".
{
  "@context": {
    "name": "http://example.com/vocab#name",
    "children": { "@reverse": "http://example.com/vocab#parent" }
  },
  "@id": "#homer",
  "name": "Homer",
  "children": [
    { "@id": "#bart", "name": "Bart"},
    { "@id": "#lisa", "name": "Lisa"}
  ]
}
