---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-020-3-basic-concepts
section_title: "Basic Concepts"
section_number: 3
pages: 11-12
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 2: Sample JSON document
{
  "name": "Manu Sporny",
  "homepage": "http://manu.sporny.org/",
  "image": "http://manu.sporny.org/images/manu.png"
}
Input
Example 3: Sample JSON-LD document using full IRIs instead of terms
Expanded (Input) 
Statements 
Turtle (Result) Open in playground
{
  "http://schema.org/name": "Manu Sporny",
  "http://schema.org/url": {
    "@id": "http://manu.sporny.org/"
    ↑ The '@id' keyword means 'This value is an identifier that is an IRI'
  },
In the example above, every property is unambiguously identified by an IRI and all values representing IRIs are explicitly marked as such by the @id
keyword. While this is a valid JSON-LD document that is very specific about its data, the document is also overly verbose and difficult to work with
for human developers. To address this issue, JSON-LD introduces the notion of a context as described in the next section.
This section only covers the most basic features of JSON-LD. More advanced features, including typed values, indexed values, and named graphs,
can be found in § 4. Advanced Concepts.
This section is non-normative.
When two people communicate with one another, the conversation takes place in a shared environment, typically called "the context of the
conversation". This shared context allows the individuals to use shortcut terms, like the first name of a mutual friend, to communicate more quickly
but without losing accuracy. A context in JSON-LD works in the same way. It allows two applications to use shortcut terms to communicate with one
another more efficiently, but without losing accuracy.
Simply speaking, a context is used to map terms to IRIs. Terms are case sensitive and most valid strings that are not reserved JSON-LD keywords can
be used as a term. Exceptions are the empty string "" and strings that have the form of a keyword (i.e., starting with "@" followed exclusively by one
or more ALPHA characters (see [RFC5234])), which must not be used as terms. Strings that have the form of an IRI (e.g., containing a ":") should
not be used as terms.
For the sample document in the previous section, a context would look something like this:
As the context above shows, the value of a term definition can either be a simple string, mapping the term to an IRI, or a map.
A context is introduced using an entry with the key @context and may appear within a node object or a value object.
When an entry with a term key has a map value, the map is called an expanded term definition. The example above specifies that the values of image
and homepage, if they are strings, are to be interpreted as IRIs. Expanded term definitions also allow terms to be used for index maps and to specify
whether array values are to be interpreted as sets or lists. Expanded term definitions may be defined using IRIs or compact IRIs as keys, which is
