---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-087-522-representing-values-as-strings
section_title: "Representing Values as Strings"
section_number: 5.2.2
pages: 62-63
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Context
Example 130: Coercing Values to Strings
Given the following expanded document:
[{
  "http://example.com/plain": [
    {"@value": "string"},
    {"@value": true},
    {"@value": 1}
  ],
  "http://example.com/date": [
    {
      "@value": "2018-02-16",
      "@type": "http://www.w3.org/2001/XMLSchema#date"
    }
  ],
  "http://example.com/en": [
    {"@value": "English", "@language": "en"}
  ],
  "http://example.com/iri": [
    {"@id": "http://example.com/some-location"}
  ]
}]
And the following context:
{
  "@context": {
    "@vocab": "http://example.com/",
    "date": {"@type": "http://www.w3.org/2001/XMLSchema#date"},
    "en":   {"@language": "en"},
    "iri": {"@type": "@id"}
  }
}
The compacted version will use string values for the defined terms when the values match the term definition. Note that there is no term defined
for "plain", that is created automatically using the vocabulary mapping. Also, the other native values, 1 and true, can be represented without
defining a specific type mapping.
This section is non-normative.
As described in § 4.3.1 Lists, JSON-LD has an expanded syntax for representing ordered values, using the @list keyword. To simplify the
representation in JSON-LD, a term can be defined with "@container": "@list" which causes all values of a property using such a term to be
considered ordered.
This section is non-normative.
In some cases, the property used to relate two nodes may be better expressed if the nodes have a reverse direction, for example, when describing a
relationship between two people and a common parent. See § 4.8 Reverse Properties for more details.
{
  "@context": {
    "@vocab": "http://example.com/",
    "date": {"@type": "http://www.w3.org/2001/XMLSchema#date"},
    "en":   {"@language": "en"},
    "iri": {"@type": "@id"}
  },
  "plain": ["string", true, 1],
  "date": "2018-02-16",
  "en": "English",
  "iri": "http://example.com/some-location"
}
