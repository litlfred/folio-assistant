---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-086-521-shortening-iris
section_title: "Shortening IRIs"
section_number: 5.2.1
pages: 61-62
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Context
Result
Example 128: Compacting using a default vocabulary
Given the following expanded document:
[{
  "@id": "http://example.org/places#BrewEats",
  "@type": ["http://example.org/Restaurant"],
  "http://example.org/name": [{"@value": "Brew Eats"}]
}]
And the following context:
{
  "@context": {
    "@vocab": "http://example.org/"
  }
}
The compaction algorithm will shorten all vocabulary-relative IRIs that begin with http://xmlns.com/foaf/0.1/:
{
  "@context": {
    "@vocab": "http://example.org/"
  },
  "@id": "http://example.org/places#BrewEats",
  "@type": "Restaurant",
  "name": "Brew Eats"
}
Note that two IRIs were shortened, unnecessary arrays are removed, and simple string values are replaced with the string.
See Security Considerations in § C. IANA Considerations for a discussion on how string vocabulary-relative IRI resolution via concatenation.
Example 129: Compacting using a base IRI
Given the following expanded document:
This section is non-normative.
To be unambiguous, the expanded document form always represents nodes and values using node objects and value objects. Moreover, property
values are always contained within an array, even when there is only one value. Sometimes this is useful to maintain a uniformity of access, but most
JSON data use the simplest possible representation, meaning that properties have single values, which are represented as strings or as structured
values such as node objects. By default, compaction will represent values which are simple strings as strings, but sometimes a value is an IRI, a date,
or some other typed value for which a simple string representation would loose information. By specifying this within a term definition, the semantics
of a string value can be inferred from the definition of the term used as a property. See § 4.2 Describing Values for more details.
Input
Context
Result
[{
  "@id": "http://example.com/document.jsonld",
  "http://www.w3.org/2000/01/rdf-schema#label": [{"@value": "Just a simple document"}]
}]
And the following context:
{
  "@context": {
    "@base": "http://example.com/",
    "label": "http://www.w3.org/2000/01/rdf-schema#label"
  }
}
The compaction algorithm will shorten all document-relative IRIs that begin with http://example.com/:
{
  "@context": {
    "@base": "http://example.com/",
    "label": "http://www.w3.org/2000/01/rdf-schema#label"
  },
  "@id": "document.jsonld",
  "label": "Just a simple document"
}
