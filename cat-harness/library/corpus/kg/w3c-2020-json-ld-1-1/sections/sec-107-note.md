---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-107-note
section_title: "Note"
section_number: null
pages: 74-75
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 150: Linked Data Dataset
Compacted (Input) 
Expanded (Result) 
Statements 
TriG
{
  "@context": [
    "http://schema.org/",
    {"@base": "http://example.com/"}
  ],
  "@graph": [{
    "@id": "people/alice",
    "gender": [
      {"@value": "weiblich", "@language": "de"},
      {"@value": "female",   "@language": "en"}
    ],
    "knows": {"@id": "people/bob"},
    "name": "Alice"
  }, {
    "@id": "graphs/1",
    "@graph": {
      "@id": "people/alice",
      "parent": {
        "@id": "people/bob",
        "name": "Bob"
      }
    }
  }, {
    "@id": "graphs/2",
    "@graph": {
      "@id": "people/bob",
      "sibling": {
        "name": "Mary",
        "sibling": {"@id": "people/bob"}
      }
    }
  }]
}
Note the use of @graph at the outer-most level to describe three top-level resources (two of them named graphs). The named graphs use @graph in
addition to @id to provide the name for each graph.
This section restates the syntactic conventions described in the previous sections more formally.
A JSON-LD document MUST be valid JSON text as described in [RFC8259], or some format that can be represented in the JSON-LD internal
representation that is equivalent to valid JSON text.
A JSON-LD document MUST be a single node object, a map consisting of only the entries @context and/or @graph, or an array of zero or more node
objects.
In contrast to JSON, in JSON-LD the keys in objects MUST be unique.
Whenever a keyword is discussed in this grammar, the statements also apply to an alias for that keyword.
Note
JSON-LD allows keywords to be aliased (see § 4.1.6 Aliasing Keywords for details). For example, if the active context defines the term id as an alias
for @id, that alias may be legitimately used as a substitution for @id. Note that keyword aliases are not expanded during context processing.
A term is a short-hand string that expands to an IRI, blank node identifier, or keyword.
A term MUST NOT equal any of the JSON-LD keywords, other than @type.
When used as the prefix in a Compact IRI, to avoid the potential ambiguity of a prefix being confused with an IRI scheme, terms SHOULD NOT
come from the list of URI schemes as defined in [IANA-URI-SCHEMES]. Similarly, to avoid confusion between a Compact IRI and a term, terms
SHOULD NOT include a colon (:) and SHOULD be restricted to the form of isegment-nz-nc as defined in [RFC3987].
To avoid forward-compatibility issues, a term SHOULD NOT start with an @ character followed exclusively by one or more ALPHA characters (see
[RFC5234]) as future versions of JSON-LD may introduce additional keywords. Furthermore, the term MUST NOT be an empty string ("") as not all
programming languages are able to handle empty JSON keys.
