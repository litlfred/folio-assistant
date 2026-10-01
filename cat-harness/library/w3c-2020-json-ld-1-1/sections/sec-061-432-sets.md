---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-061-432-sets
section_title: "Sets"
section_number: 4.3.2
pages: 42-43
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 85: An unordered collection of values in JSON-LD
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {"foaf": "http://xmlns.com/foaf/0.1/"},
  ...
  "@id": "http://example.org/people#joebob",
  "foaf:nick": {
    "@set": [ "joe", "bob", "jaybee" ]
  },
  ...
}
Since JSON-LD 1.1, the @set keyword may be combined with other container specifications within an expanded term definition to similarly cause
compacted values of indexes to be consistently represented using arrays. See § 4.6 Indexed Values for a further discussion.
This section is non-normative.
Unless the processing mode is set to json-ld-1.0, @type may be used with an expanded term definition with @container set to @set; no other
entries may be set within such an expanded term definition. This is used by the Compaction algorithm to ensure that the values of @type (or an alias)
are always represented in an array.
This section is non-normative.
Many JSON APIs separate properties from their entities using an intermediate object; in JSON-LD these are called nested properties. For example, a
set of possible labels may be grouped under a common property:
By defining labels using the keyword @nest, a JSON-LD processor will ignore the nesting created by using the labels property and process the
contents as if it were declared directly within containing object. In this case, the labels property is semantically meaningless. Defining it as equivalent
to @nest causes it to be ignored when expanding, making it equivalent to the following:
Input
Example 86: Specifying that a collection is unordered in the context
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    ...
    "nick": {
      "@id": "http://xmlns.com/foaf/0.1/nick",
      "@container": "@set"
    }
  },
  ...
  "@id": "http://example.org/people#joebob",
  "nick": [ "joe", "bob", "jaybee" ],
  ...
}
