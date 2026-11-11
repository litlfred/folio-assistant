---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-091-526-normalizing-values-as-objects
section_title: "Normalizing Values as Objects"
section_number: 5.2.6
pages: 65-66
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Context
Example 134: Forcing Object Values
Given the following expanded document:
[{
  "http://example.com/notype": [
    {"@value": "string"},
    {"@value": true},
    {"@value": false},
    {"@value": 1},
    {"@value": 10.0},
    {"@value": "plain"},
    {"@value": "false", "@type": "http://www.w3.org/2001/XMLSchema#boolean"},
    {"@value": "english", "@language": "en"},
    {"@value": "2018-02-17", "@type": "http://www.w3.org/2001/XMLSchema#date"},
    {"@id": "http://example.com/iri"}
  ]
}]
And the following context:
{
  "@context": {
    "@version": 1.1,
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "notype": {"@id": "http://example.com/notype", "@type": "@none"}
  }
}
The compacted version will use string values for the defined terms when the values match the term definition. Also, the other native values, 1 and
true, can be represented without defining a specific type mapping.
{
  "@context": {
    "@version": 1.1,
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "notype": {"@id": "http://example.com/notype", "@type": "@none"}
  },
  "notype": [
    {"@value": "string"},
    {"@value": true},
    {"@value": false},
    {"@value": 1},
    {"@value": 10.0},
    {"@value": "plain"},
    {"@value": "false", "@type": "xsd:boolean"},
    {"@value": "english", "@language": "en"},
    {"@value": "2018-02-17", "@type": "xsd:date"},
    {"@id": "http://example.com/iri"}
This section is non-normative.
Generally, when compacting, properties having only one value are represented as strings or maps, while properties having multiple values are
represented as an array of strings or maps. This means that applications accessing such properties need to be prepared to accept either representation.
To force all values to be represented using an array, a term definition can set "@container": "@set". Moreover, @set can be used in combination
with other container settings, for example looking at our language-map example from § 5.2.5 Indexing Values:
This section is non-normative.
When compacting, the Compaction algorithm will compact using a term for a property only when the values of that property match the @container,
@type, and @language specifications for that term definition. This can actually split values between different properties, all of which have the same
IRI. In case there is no matching term definition, the compaction algorithm will compact using the absolute IRI of the property.
  ]
}
